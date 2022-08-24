import { ArrayUtils } from "../../../lib/common.js"
import { Linear } from "../../../lib/mapping.js"
import { barsToNumFrames, numFramesToBars, RENDER_QUANTUM, TransportMessage } from "../../common.js"
import { ChannelIndex, Memory, Pattern, Step } from "../memory.js"
import { ProcessorOptions, ToMainMessage, ToWorkletMessage } from "../messages.js"
import { Preset } from "../preset.js"
import { Resources } from "../resources.js"
import { PlayMode } from "../state.js"
import { BasicTuneDecayVoice } from "./basic-voice.js"
import { BassdrumVoice } from "./bassdrum.js"
import { Channel, VoiceFactory } from "./channel.js"
import { PatternProvider, TrackPatternPlay, UserPatternSelect } from "./pattern.js"
import { StepSequencer, StepSequencerEnvironment } from "./sequencer.js"
import { SnaredrumVoice } from "./snaredrum.js"
import { Voice } from "./voice.js"

const LevelMapping = new Linear(-18.0, 0.0) // min active, half accent, full, accent + total accent

registerProcessor('tr-909', class extends AudioWorkletProcessor implements StepSequencerEnvironment, VoiceFactory {
    private readonly resources: Resources<Float32Array>
    private readonly preset: Preset
    private readonly memory: Memory
    private readonly channels: Channel[]
    private readonly sequencer: StepSequencer

    private patternProvider: PatternProvider | null = null
    private moving: boolean = false
    private tapMode: boolean = false
    private bpm: number = 120.0
    private barIncrement: number = 0.0
    private frameIndex: number = 0 | 0

    constructor(options: { processorOptions: ProcessorOptions }) {
        super(options)

        this.resources = options.processorOptions.resources
        this.preset = new Preset()
        this.preset.tempo.addObserver((bpm: number) => {
            this.bpm = bpm
            this.barIncrement = numFramesToBars(RENDER_QUANTUM, this.bpm, sampleRate)
        }, true)
        this.memory = new Memory()
        this.memory.state.playMode.addObserver(mode => mode === PlayMode.Track
            ? this.patternProvider = new TrackPatternPlay(this.memory.state, this.port)
            : this.patternProvider = new UserPatternSelect(this.memory.state, this.port, () => this.moving), true)
        this.channels = ArrayUtils.fill(10, index => new Channel(this, index))
        this.sequencer = new StepSequencer(this)

        this.port.onmessage = (event: MessageEvent) => {
            const message: ToWorkletMessage | TransportMessage = event.data
            if (message.type === 'update-parameter') {
                this.preset.find(message.path).get().setUnipolar(message.unipolar)
            } else if (message.type === 'update-memory-state') {
                this.memory.state.deserialize(message.format)
                this.patternProvider!.reevaluate()
            } else if (message.type === 'update-track-measure') {
                this.patternProvider!.setTrackMeasure(message.measure)
            } else if (message.type === 'update-track') {
                this.memory.banks[message.bankIndex]
                    .tracks[message.arrayIndex]
                    .deserialize(message.format)
                this.patternProvider!.reevaluate()
            } else if (message.type === 'update-pattern') {
                this.memory.banks[message.bankIndex]
                    .patternByLocation(message.location)
                    .deserialize(message.format)
            } else if (message.type === "update-pattern-group-chained") {
                this.memory.banks[message.bankIndex]
                    .patternGroups[message.patternGroupIndex]
                    .writeChain(message.chained)
            } else if (message.type === "transport-play") {
                this.moving = true
            } else if (message.type === "transport-pause") {
                this.moving = false
            } else if (message.type === "transport-move") {
                this.sequencer.moveTo(message.position)
            } else if (message.type === "play-channel") {
                this.schedulePlay(message.channelIndex, this.frameIndex, message.step, false)
            } else if (message.type === "set-tap-mode") {
                console.debug(`set tap mode to ${message.enabled}`)
                this.tapMode = message.enabled
            }
        }
    }

    // noinspection JSUnusedGlobalSymbols
    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        if (this.moving) {
            this.sequencer.sequence(this.barIncrement)
        }
        this.channels.forEach((channel: Channel, index: number) =>
            channel.process(outputs[index][0], this.frameIndex, this.frameIndex + RENDER_QUANTUM))
        this.frameIndex += RENDER_QUANTUM
        return true
    }

    currentPattern(): Pattern | null {
        return this.patternProvider!.pattern()
    }

    nextPattern(): void {
        this.patternProvider!.next()
    }

    onPatternStep(pattern: Pattern, stepIndex: number, position: number): void {
        const cycleGuideMode = this.memory.state.cycleGuideMode.get()
        const frameIndex = this.frameIndex + Math.floor(barsToNumFrames(position, this.bpm, sampleRate))
        const frameIndexDelayed = frameIndex + Pattern.FlamDelays[pattern.flamIndex.get()] / 1000.0 * sampleRate
        const totalAccent: boolean = pattern.isTotalAccent(stepIndex)
        for (let channelIndex = 0; channelIndex < ChannelIndex.End; channelIndex++) {
            if (this.tapMode && cycleGuideMode && channelIndex === ChannelIndex.Rim && stepIndex % 4 === 0) {
                this.schedulePlay(channelIndex, frameIndex, stepIndex === 0
                    ? Step.Full
                    : Step.Weak, totalAccent)
                continue
            }
            const step: Step = pattern.getStep(channelIndex, stepIndex)
            if (step === Step.None) {
                continue
            }
            this.schedulePlay(channelIndex, frameIndex, step, totalAccent)
            // FLAM
            if (channelIndex !== ChannelIndex.Hihat && step === Step.Extra) {
                this.schedulePlay(channelIndex, frameIndexDelayed, step, totalAccent)
            }
        }
        if (!this.tapMode) {
            this.port.postMessage({ type: "update-step", stepIndex: stepIndex } as ToMainMessage)
        }
    }

    onRoundStep(stepIndex: number): void {
        if (this.tapMode) {
            this.port.postMessage({ type: "update-step", stepIndex: stepIndex } as ToMainMessage)
        }
    }

    schedulePlay(channelIndex: ChannelIndex, frameIndex: number, step: Step, totalAccent: boolean): void {
        this.channels[channelIndex].schedulePlay(frameIndex, step, totalAccent)
    }

    resolveLevel(step: Step, totalAccent: boolean): number {
        let level = step === Step.Full ? 0.5 : 0.0
        if (totalAccent) {
            level += this.preset.accent.get() * 0.5
        }
        return LevelMapping.y(level)
    }

    createVoice(channelIndex: ChannelIndex, step: Step, totalAccent: boolean): Voice {
        console.assert(step !== Step.None)
        switch (channelIndex) {
            case ChannelIndex.Bassdrum:
                return new BassdrumVoice(this.resources.bassdrum, this.preset.bassdrum, sampleRate,
                    this.resolveLevel(step, totalAccent))
            case ChannelIndex.Snaredrum:
                return new SnaredrumVoice(this.resources.snaredrum, this.preset.snaredrum, sampleRate,
                    this.resolveLevel(step, totalAccent))
            case ChannelIndex.TomLow:
                return new BasicTuneDecayVoice(this.resources.tomLow, this.preset.tomLow, sampleRate,
                    0.030, this.resolveLevel(step, totalAccent))
            case ChannelIndex.TomMid:
                return new BasicTuneDecayVoice(this.resources.tomMid, this.preset.tomMid, sampleRate,
                    0.030, this.resolveLevel(step, totalAccent))
            case ChannelIndex.TomHi:
                return new BasicTuneDecayVoice(this.resources.tomHi, this.preset.tomHi, sampleRate,
                    0.030, this.resolveLevel(step, totalAccent))
            case ChannelIndex.Rim:
                return new BasicTuneDecayVoice(this.resources.rim, this.preset.rim, sampleRate,
                    0, this.resolveLevel(step, totalAccent))
            case ChannelIndex.Clap:
                return new BasicTuneDecayVoice(this.resources.clap, this.preset.clap, sampleRate,
                    0, this.resolveLevel(step, totalAccent))
            case ChannelIndex.Hihat:
                return step === Step.Extra
                    ? new BasicTuneDecayVoice(this.resources.openedHihat, this.preset.openedHihat, sampleRate,
                        0.012, this.resolveLevel(step, totalAccent))
                    : new BasicTuneDecayVoice(this.resources.closedHihat, this.preset.closedHihat, sampleRate,
                        0.006, this.resolveLevel(step, totalAccent))
            case ChannelIndex.Crash:
                return new BasicTuneDecayVoice(this.resources.crash, this.preset.crash, sampleRate,
                    0, this.resolveLevel(step, totalAccent))
            case ChannelIndex.Ride:
                return new BasicTuneDecayVoice(this.resources.ride, this.preset.ride, sampleRate,
                    0, this.resolveLevel(step, totalAccent))
        }
        throw new Error(`${channelIndex} not found.`)
    }
})