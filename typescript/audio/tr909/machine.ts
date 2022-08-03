import {ArrayUtils, ObservableValueImpl, Parameter, Terminable, Terminator} from "../../lib/common.js"
import {barsToSeconds, dbToGain, Transport} from "../common.js"
import {MeterWorklet} from "../meter/worklet.js"
import {
    BankIndex,
    ChannelIndex,
    Memory,
    MemoryBank,
    Pattern,
    PatternGroup,
    PatternGroupIndex,
    PatternLocation,
    Step
} from "./memory.js"
import {ProcessorOptions, ToMainMessage, ToWorkletMessage} from "./messages.js"
import {Preset} from "./preset.js"
import {Resources} from "./resources.js"
import {Track} from "./track.js"

export class Machine implements Terminable {
    static loadModule(context: AudioContext): Promise<void> {
        return context.audioWorklet.addModule("bin/audio/tr909/dsp/processor.js")
    }

    private readonly terminator: Terminator = new Terminator()
    private readonly scheduleUpdates: { time: number, exec: () => void }[] = []
    private readonly bundledUpdates: { bankIndex: BankIndex, location: PatternLocation }[] = []

    private running: boolean = true

    readonly worklet: AudioWorkletNode
    readonly preset: Preset
    readonly memory: Memory
    readonly transport: Transport
    readonly meterWorklet: MeterWorklet
    readonly master: GainNode

    readonly processorStepIndex = new ObservableValueImpl<number>(0)
    readonly processorTrackMeasure = new ObservableValueImpl<number>(0)

    constructor(readonly context, resources: Resources<Float32Array>) {
        this.worklet = new AudioWorkletNode(context, "tr-909", {
            numberOfInputs: 1,
            numberOfOutputs: ChannelIndex.End,
            outputChannelCount: ArrayUtils.fill(ChannelIndex.End, () => 1),
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers",
            processorOptions: {resources} as ProcessorOptions
        })
        this.preset = new Preset()
        this.memory = new Memory()
        this.transport = new Transport()
        this.transport.addObserver(message => this.worklet.port.postMessage(message), false)
        this.meterWorklet = new MeterWorklet(context, 10, 1)
        this.master = context.createGain()
        for (let index = 0; index < ChannelIndex.End; index++) {
            this.worklet.connect(this.meterWorklet, index, index).connect(this.master, index, 0)
        }
        this.terminator.with(this.preset.volume.addObserver(value => this.master.gain.value = dbToGain(value), true))
        this.terminator.with(this.preset.observeAll((parameter: Parameter<any>, path: string[]) => {
            this.worklet.port.postMessage({
                type: 'update-parameter',
                path,
                unipolar: parameter.getUnipolar()
            } as ToWorkletMessage)
        }))
        this.terminator.with(this.memory.state.changeNotification.addObserver(() => this.worklet.port.postMessage({
            type: 'update-memory-state',
            format: this.memory.state.serialize()
        } as ToWorkletMessage)))
        this.terminator.merge(this.memory.banks
            .map((bank: MemoryBank, bankIndex: BankIndex) => {
                return [
                    ...bank.tracks
                        .map((track: Track, trackIndex: number) => track
                            .addObserver(() => this.worklet.port.postMessage({
                                type: 'update-track', bankIndex, arrayIndex: trackIndex, format: track.serialize()
                            } as ToWorkletMessage), false)),
                    ...bank.patternGroups
                        .map((patternGroup: PatternGroup, patternGroupIndex: PatternGroupIndex) =>
                            patternGroup.addObserver(() => this.worklet.port.postMessage({
                                type: 'update-pattern-group-chained',
                                bankIndex,
                                patternGroupIndex,
                                chained: patternGroup.getChained()
                            } as ToWorkletMessage), false)),
                    ...bank.patternGroups
                        .map(patternGroup => patternGroup.patterns)
                        .flat()
                        .map((pattern: Pattern) => pattern
                            .addObserver(() => this
                                .bundledUpdate(bankIndex, pattern.location), false))]
            }).flat())
        this.terminator.with(this.processorTrackMeasure.addObserver(measure => {
            if (!this.transport.isPlaying()) {
                this.worklet.port.postMessage({type: 'update-track-measure', measure} as ToWorkletMessage)
            }
        }, false))
        this.worklet.port.onmessage = event => {
            const message = event.data as ToMainMessage
            const schedule = (exec: () => void) =>
                this.scheduleUpdates.push({time: this.context.currentTime + this.context.outputLatency, exec})
            if (message.type === 'update-step') {
                schedule(() => this.processorStepIndex.set(message.stepIndex))
            } else if (message.type === 'update-pattern') {
                const state = this.memory.state
                state.patternIndicesChangeNotification.notify(state.activeBank().patternByLocation(message.location))
            } else if (message.type === "update-track-measure") {
                schedule(() => this.processorTrackMeasure.set(message.measure))
            } else if (message.type === "track-complete") {
                schedule(() => {
                    this.transport.stop()
                    this.processorTrackMeasure.set(0)
                })
            }
        }
        this.startScheduler()
    }

    stepAbsoluteDuration(): number {
        return barsToSeconds(this.memory.state.activePattern().scaleRatio(), this.preset.tempo.get())
    }

    play(channelIndex: ChannelIndex, step: Step) {
        this.worklet.port.postMessage({type: 'play-channel', channelIndex, step} as ToWorkletMessage)
    }

    terminate(): void {
        this.running = false
        this.terminator.terminate()
    }

    private bundledUpdate(bankIndex: BankIndex, location: PatternLocation) {
        if (!this.bundledUpdates.some(update => update.bankIndex === bankIndex && update.location === location)) {
            this.bundledUpdates.push({bankIndex, location})
        }
    }

    private startScheduler() {
        const schedule = () => {
            if (this.scheduleUpdates.length > 0) {
                if (this.context.currentTime >= this.scheduleUpdates[0].time) {
                    this.scheduleUpdates.shift().exec()
                }
            }
            while (this.bundledUpdates.length > 0) {
                const update = this.bundledUpdates.pop()
                const bankIndex = update.bankIndex
                const location = update.location
                this.worklet.port.postMessage({
                    type: 'update-pattern', bankIndex, location,
                    format: this.memory.banks[bankIndex].patternByLocation(location).serialize()
                } as ToWorkletMessage)
            }
            if (this.running) {
                requestAnimationFrame(schedule)
            }
        }
        schedule()
    }
}
