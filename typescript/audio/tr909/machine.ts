import {ArrayUtils, ObservableValueImpl, Parameter, Terminable, Terminator} from "../../lib/common.js"
import {dbToGain, Transport} from "../common.js"
import {MeterWorklet} from "../meter/worklet.js"
import {BankGroupIndex, Memory, MemoryBank, PatternIndex} from "./memory.js"
import {ProcessorOptions, ToMainMessage, ToWorkletMessage} from "./messages.js"
import {ChannelIndex, Pattern, Step} from "./pattern.js"
import {Preset} from "./preset.js"
import {Resources} from "./resources.js"
import {Track} from "./track.js"

export class Machine implements Terminable {
    static loadModule(context: AudioContext): Promise<void> {
        return context.audioWorklet.addModule("bin/audio/tr909/processor.js")
    }

    private readonly terminator: Terminator = new Terminator()
    private readonly scheduleUpdates: { time: number, exec: () => void }[] = []
    private running: boolean = true

    readonly worklet: AudioWorkletNode
    readonly preset: Preset
    readonly memory: Memory
    readonly transport: Transport
    readonly meterWorklet: MeterWorklet
    readonly master: GainNode

    readonly processorStepIndex = new ObservableValueImpl<number>(0)
    readonly processorTrackMeasure = new ObservableValueImpl<number>(1) // TODO Update

    constructor(readonly context, resources: Resources) {
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
            .map((bank: MemoryBank, bankGroupIndex: BankGroupIndex) => {
                return [
                    ...bank.tracks
                        .map((track: Track, arrayIndex: number) => track
                            .addObserver(() => this.worklet.port.postMessage({
                                type: 'update-track', bankGroupIndex, arrayIndex, format: track.serialize()
                            } as ToWorkletMessage), false)),
                    ...bank.patterns
                        .map((pattern: Pattern, arrayIndex: PatternIndex) => pattern
                            .addObserver(() => this.worklet.port.postMessage({
                                type: 'update-pattern', bankGroupIndex, arrayIndex, format: pattern.serialize()
                            } as ToWorkletMessage), false))]
            }).flat())
        this.worklet.port.onmessage = event => {
            const message = event.data as ToMainMessage
            if (message.type === 'update-step') {
                const index = message.stepIndex
                const time = context.currentTime + context.outputLatency
                this.scheduleUpdates.push({time, exec: () => this.processorStepIndex.set(index)})
            }
        }
        this.startScheduler()

        // TODO > Test Data < REMOVE WHEN DONE TESTING
        this.memory.state.patternBy(0, 0).testA()
        this.memory.state.patternBy(0, 1).testB()
        const track = this.memory.state.activeBank().tracks[1]
        track.insert(0)
        track.insert(1)
        track.insert(0)
        track.insert(1)
    }

    play(channelIndex: ChannelIndex, step: Step) {
        this.worklet.port.postMessage({type: 'play-channel', channelIndex, step} as ToWorkletMessage)
    }

    terminate(): void {
        this.running = false
        this.terminator.terminate()
    }

    private startScheduler() {
        const schedule = () => {
            if (this.scheduleUpdates.length > 0) {
                if (this.context.currentTime >= this.scheduleUpdates[0].time) {
                    this.scheduleUpdates.shift().exec()
                }
            }
            if (this.running) {
                requestAnimationFrame(schedule)
            }
        }
        schedule()
    }
}
