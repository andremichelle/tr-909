import processorUrl from "./processor/processor.ts?worker&url"
import {Arrays, DefaultObservableValue, int, Terminable, Terminator} from "@opendaw/lib-std"
import {barsToSeconds, dbToGain} from "./common"
import {BankIndex, ChannelIndex, Memory, MemoryBank, MemoryFormat, PatternGroup, PatternGroupIndex, PatternLocation, Step, Track} from "./memory"
import {ProcessorName, ProcessorOptions, ToMainMessage, ToWorkletMessage} from "./messages"
import {Preset, PresetFormat} from "./preset"
import {Resources} from "./resources"
import {Transport} from "./transport"

export interface MachineFormat {
    preset: PresetFormat
    memory: MemoryFormat
}

type PatternUpdate = { bankIndex: BankIndex, location: PatternLocation }

export class Machine implements Terminable {
    static async create(context: AudioContext, resources: Resources<Float32Array>): Promise<Machine> {
        await context.audioWorklet.addModule(processorUrl)
        return new Machine(context, resources)
    }

    readonly #terminator: Terminator = new Terminator()
    readonly #pendingPatternUpdates: Array<PatternUpdate> = []

    readonly context: AudioContext
    readonly worklet: AudioWorkletNode
    readonly preset: Preset
    readonly memory: Memory
    readonly transport: Transport
    readonly master: GainNode
    readonly processorStepIndex: DefaultObservableValue<int>
    readonly processorTrackMeasure: DefaultObservableValue<int>

    #flushRequested: boolean = false

    private constructor(context: AudioContext, resources: Resources<Float32Array>) {
        this.context = context
        this.worklet = new AudioWorkletNode(context, ProcessorName, {
            numberOfInputs: 0,
            numberOfOutputs: ChannelIndex.End,
            outputChannelCount: Arrays.create(() => 1, ChannelIndex.End),
            processorOptions: {resources} satisfies ProcessorOptions
        })
        this.preset = this.#terminator.own(new Preset())
        this.memory = new Memory()
        this.transport = this.#terminator.own(new Transport())
        this.master = context.createGain()
        this.processorStepIndex = this.#terminator.own(new DefaultObservableValue<int>(0))
        this.processorTrackMeasure = this.#terminator.own(new DefaultObservableValue<int>(0))
        for (let index = 0; index < ChannelIndex.End; index++) {this.worklet.connect(this.master, index, 0)}
        this.#terminator.ownAll(
            this.transport.subscribe(message => this.#post(message)),
            this.preset.volume.catchupAndSubscribe(owner => this.master.gain.value = dbToGain(owner.getValue())),
            ...Array.from(this.preset.parameters().entries(), ([path, parameter]) =>
                parameter.subscribe(owner => this.#post({type: "update-parameter", path, unitValue: owner.getUnitValue()}))),
            this.memory.state.changeNotification.subscribe(() =>
                this.#post({type: "update-memory-state", format: this.memory.state.serialize()})),
            ...this.memory.banks.flatMap((bank: MemoryBank, bankIndex: BankIndex) => [
                ...bank.tracks.map((track: Track, arrayIndex: int) => track.subscribe(() =>
                    this.#post({type: "update-track", bankIndex, arrayIndex, format: track.serialize()}))),
                ...bank.patternGroups.map((group: PatternGroup, patternGroupIndex: PatternGroupIndex) => group.subscribe(() =>
                    this.#post({type: "update-pattern-group-chained", bankIndex, patternGroupIndex, chained: group.getChained()}))),
                ...bank.patternGroups.flatMap(group => group.patterns).map(pattern => pattern.subscribe(() =>
                    this.#schedulePatternUpdate(bankIndex, pattern.location)))
            ]),
            this.processorTrackMeasure.subscribe(owner => {
                if (!this.transport.isPlaying()) {this.#post({type: "update-track-measure", measure: owner.getValue()})}
            })
        )
        this.worklet.port.onmessage = (event: MessageEvent<ToMainMessage>) => {
            const message = event.data
            if (message.type === "update-step") {
                this.processorStepIndex.setValue(message.stepIndex)
            } else if (message.type === "update-pattern") {
                const state = this.memory.state
                state.patternIndicesChangeNotification.notify(state.activeBank().patternByLocation(message.location))
            } else if (message.type === "update-track-measure") {
                this.processorTrackMeasure.setValue(message.measure)
            } else if (message.type === "track-complete") {
                this.transport.stop()
                this.processorTrackMeasure.setValue(0)
            }
        }
    }

    hasAnyData(): boolean {return this.memory.hasAnyData()}

    serialize(): MachineFormat {return {preset: this.preset.serialize(), memory: this.memory.serialize()}}

    deserialize(format: MachineFormat): this {
        this.preset.deserialize(format.preset)
        this.memory.deserialize(format.memory)
        return this
    }

    stepAbsoluteDuration(): number {
        return barsToSeconds(this.memory.state.activePattern().scaleRatio(), this.preset.tempo.getValue())
    }

    play(channelIndex: ChannelIndex, step: Step): void {this.#post({type: "play-channel", channelIndex, step})}

    setTapMode(enabled: boolean): void {this.#post({type: "set-tap-mode", enabled})}

    terminate(): void {
        this.#terminator.terminate()
        this.worklet.disconnect()
    }

    #post(message: ToWorkletMessage): void {this.worklet.port.postMessage(message)}

    #schedulePatternUpdate(bankIndex: BankIndex, location: PatternLocation): void {
        if (!this.#pendingPatternUpdates.some(update => update.bankIndex === bankIndex && update.location === location)) {
            this.#pendingPatternUpdates.push({bankIndex, location})
        }
        if (this.#flushRequested) {return}
        this.#flushRequested = true
        queueMicrotask(() => {
            this.#flushRequested = false
            this.#pendingPatternUpdates.splice(0).forEach(({bankIndex, location}) => this.#post({
                type: "update-pattern", bankIndex, location,
                format: this.memory.banks[bankIndex].patternByLocation(location).serialize()
            }))
        })
    }
}
