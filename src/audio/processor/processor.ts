import {Arrays, int, Nullable, panic, ValueMapping} from "@opendaw/lib-std"
import {barsToNumFrames, numFramesToBars, RENDER_QUANTUM} from "../common"
import {ChannelIndex, Memory, Pattern, Step} from "../memory"
import {ProcessorName, ProcessorOptions, ToMainMessage, ToWorkletMessage} from "../messages"
import {Preset} from "../preset"
import {Resources} from "../resources"
import {PlayMode} from "../state"
import {BasicTuneDecayVoice} from "./basic-voice"
import {BassdrumVoice} from "./bassdrum"
import {Channel, VoiceFactory} from "./channel"
import {PatternProvider, TrackPatternPlay, UserPatternSelect} from "./pattern-provider"
import {StepSequencer, StepSequencerEnvironment} from "./sequencer"
import {SnaredrumVoice} from "./snaredrum"
import {Voice} from "./voice"

// min active, half accent, full, accent + total accent
const LevelMapping = ValueMapping.linear(-18.0, 0.0)

registerProcessor(ProcessorName, class extends AudioWorkletProcessor implements StepSequencerEnvironment, VoiceFactory {
    readonly #resources: Resources<Float32Array>
    readonly #preset: Preset
    readonly #memory: Memory
    readonly #channels: ReadonlyArray<Channel>
    readonly #sequencer: StepSequencer

    #patternProvider: PatternProvider
    #moving: boolean = false
    #tapMode: boolean = false
    #bpm: number = 120.0
    #barIncrement: number = 0.0
    #frameIndex: int = 0 | 0

    constructor(options: AudioWorkletNodeOptions) {
        super(options)
        this.#resources = (options.processorOptions as ProcessorOptions).resources
        this.#preset = new Preset()
        this.#memory = new Memory()
        this.#channels = Arrays.create(index => new Channel(this, index), ChannelIndex.End)
        this.#sequencer = new StepSequencer(this)
        this.#patternProvider = this.#createPatternProvider(this.#memory.state.playMode.getValue())
        this.#preset.tempo.catchupAndSubscribe(owner => {
            this.#bpm = owner.getValue()
            this.#barIncrement = numFramesToBars(RENDER_QUANTUM, this.#bpm, sampleRate)
        })
        this.#memory.state.playMode.subscribe(owner => {
            this.#patternProvider.terminate()
            this.#patternProvider = this.#createPatternProvider(owner.getValue())
        })
        this.port.onmessage = (event: MessageEvent<ToWorkletMessage>) => {
            const message = event.data
            switch (message.type) {
                case "update-parameter":
                    this.#preset.find(message.path).ifSome(parameter => parameter.setUnitValue(message.unitValue))
                    break
                case "update-memory-state":
                    this.#memory.state.deserialize(message.format)
                    this.#patternProvider.reevaluate()
                    break
                case "update-track-measure":
                    this.#patternProvider.setTrackMeasure(message.measure)
                    break
                case "update-track":
                    this.#memory.banks[message.bankIndex].tracks[message.arrayIndex].deserialize(message.format)
                    this.#patternProvider.reevaluate()
                    break
                case "update-pattern":
                    this.#memory.banks[message.bankIndex].patternByLocation(message.location).deserialize(message.format)
                    break
                case "update-pattern-group-chained":
                    this.#memory.banks[message.bankIndex].patternGroups[message.patternGroupIndex].writeChain(message.chained)
                    break
                case "transport-play":
                    this.#moving = true
                    break
                case "transport-pause":
                    this.#moving = false
                    break
                case "transport-move":
                    this.#sequencer.rewind()
                    break
                case "play-channel":
                    this.schedulePlay(message.channelIndex, this.#frameIndex, message.step, false)
                    break
                case "set-tap-mode":
                    this.#tapMode = message.enabled
                    break
            }
        }
    }

    process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        if (this.#moving) {this.#sequencer.sequence(this.#barIncrement)}
        this.#channels.forEach((channel: Channel, index: int) =>
            channel.process(outputs[index][0], this.#frameIndex, this.#frameIndex + RENDER_QUANTUM))
        this.#frameIndex += RENDER_QUANTUM
        return true
    }

    currentPattern(): Nullable<Pattern> {return this.#patternProvider.pattern()}

    nextPattern(): void {this.#patternProvider.next()}

    onPatternStep(pattern: Pattern, stepIndex: int, position: number): void {
        const cycleGuideMode = this.#memory.state.cycleGuideMode.getValue()
        const frameIndex = this.#frameIndex + Math.floor(barsToNumFrames(position, this.#bpm, sampleRate))
        const frameIndexDelayed = frameIndex + Pattern.FlamDelays[pattern.flamIndex.getValue()] / 1000.0 * sampleRate
        const totalAccent = pattern.isTotalAccent(stepIndex)
        for (let channelIndex = 0; channelIndex < ChannelIndex.End; channelIndex++) {
            if (this.#tapMode && cycleGuideMode && channelIndex === ChannelIndex.Rim && stepIndex % 4 === 0) {
                this.schedulePlay(channelIndex, frameIndex, stepIndex === 0 ? Step.Full : Step.Weak, totalAccent)
                continue
            }
            const step = pattern.getStep(channelIndex, stepIndex)
            if (step === Step.None) {continue}
            this.schedulePlay(channelIndex, frameIndex, step, totalAccent)
            if (channelIndex !== ChannelIndex.Hihat && step === Step.Extra) {
                this.schedulePlay(channelIndex, frameIndexDelayed, step, totalAccent)
            }
        }
        if (!this.#tapMode) {this.#postStep(stepIndex)}
    }

    onRoundStep(stepIndex: int): void {if (this.#tapMode) {this.#postStep(stepIndex)}}

    schedulePlay(channelIndex: ChannelIndex, frameIndex: number, step: Step, totalAccent: boolean): void {
        this.#channels[channelIndex].schedulePlay(frameIndex, step, totalAccent)
    }

    createVoice(channelIndex: ChannelIndex, step: Step, totalAccent: boolean): Voice {
        const resources = this.#resources
        const preset = this.#preset
        const level = this.#resolveLevel(step, totalAccent)
        switch (channelIndex) {
            case ChannelIndex.Bassdrum:
                return new BassdrumVoice(resources.bassdrum, preset.bassdrum, sampleRate, level)
            case ChannelIndex.Snaredrum:
                return new SnaredrumVoice(resources.snaredrum, preset.snaredrum, sampleRate, level)
            case ChannelIndex.TomLow:
                return new BasicTuneDecayVoice(resources.tomLow, preset.tomLow, sampleRate, 0.030, level)
            case ChannelIndex.TomMid:
                return new BasicTuneDecayVoice(resources.tomMid, preset.tomMid, sampleRate, 0.030, level)
            case ChannelIndex.TomHi:
                return new BasicTuneDecayVoice(resources.tomHi, preset.tomHi, sampleRate, 0.030, level)
            case ChannelIndex.Rim:
                return new BasicTuneDecayVoice(resources.rim, preset.rim, sampleRate, 0, level)
            case ChannelIndex.Clap:
                return new BasicTuneDecayVoice(resources.clap, preset.clap, sampleRate, 0, level)
            case ChannelIndex.Hihat:
                return step === Step.Extra
                    ? new BasicTuneDecayVoice(resources.openedHihat, preset.openedHihat, sampleRate, 0.012, level)
                    : new BasicTuneDecayVoice(resources.closedHihat, preset.closedHihat, sampleRate, 0.006, level)
            case ChannelIndex.Crash:
                return new BasicTuneDecayVoice(resources.crash, preset.crash, sampleRate, 0, level)
            case ChannelIndex.Ride:
                return new BasicTuneDecayVoice(resources.ride, preset.ride, sampleRate, 0, level)
        }
        return panic(`Unknown channel ${channelIndex}`)
    }

    #resolveLevel(step: Step, totalAccent: boolean): number {
        let level = step === Step.Full ? 0.5 : 0.0
        if (totalAccent) {level += this.#preset.accent.getValue() * 0.5}
        return LevelMapping.y(level)
    }

    #postStep(stepIndex: int): void {this.port.postMessage({type: "update-step", stepIndex} satisfies ToMainMessage)}

    #createPatternProvider(mode: PlayMode): PatternProvider {
        return mode === PlayMode.Track
            ? new TrackPatternPlay(this.#memory.state, this.port)
            : new UserPatternSelect(this.#memory.state, this.port, () => this.#moving)
    }
})
