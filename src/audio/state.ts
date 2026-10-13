import {DefaultObservableValue, Exec, Notifier, Terminable, Terminator} from "@opendaw/lib-std"
import {BankIndex, Memory, MemoryBank, Pattern, PatternGroup, PatternGroupIndex, PatternIndex, Track, TrackIndex} from "./memory"

export enum PlayMode {Track, Pattern}

export interface StateFormat {
    bankGroupIndex: BankIndex
    patternGroupIndex: PatternGroupIndex
    patternIndex: PatternIndex
    trackIndex: TrackIndex
    cycleGuideMode: boolean
    playMode: PlayMode
}

export class State implements Terminable {
    readonly #terminator: Terminator = new Terminator()
    readonly #memory: Memory

    readonly bankGroupIndex: DefaultObservableValue<BankIndex>
    readonly patternGroupIndex: DefaultObservableValue<PatternGroupIndex>
    readonly patternIndex: DefaultObservableValue<PatternIndex>
    readonly trackIndex: DefaultObservableValue<TrackIndex>
    readonly cycleGuideMode: DefaultObservableValue<boolean>
    readonly playMode: DefaultObservableValue<PlayMode>

    readonly changeNotification: Notifier<void>
    readonly patternIndicesChangeNotification: Notifier<Pattern>

    #muted: boolean = false

    constructor(memory: Memory) {
        this.#memory = memory
        this.bankGroupIndex = this.#terminator.own(new DefaultObservableValue<BankIndex>(BankIndex.I))
        this.patternGroupIndex = this.#terminator.own(new DefaultObservableValue<PatternGroupIndex>(PatternGroupIndex.I))
        this.patternIndex = this.#terminator.own(new DefaultObservableValue<PatternIndex>(PatternIndex.Pattern1))
        this.trackIndex = this.#terminator.own(new DefaultObservableValue<TrackIndex>(TrackIndex.I))
        this.cycleGuideMode = this.#terminator.own(new DefaultObservableValue<boolean>(false))
        this.playMode = this.#terminator.own(new DefaultObservableValue<PlayMode>(PlayMode.Track))
        this.changeNotification = this.#terminator.own(new Notifier<void>())
        this.patternIndicesChangeNotification = this.#terminator.own(new Notifier<Pattern>())
        const onPatternIndicesChange = () => this.patternIndicesChangeNotification.notify(this.activePattern())
        const onChange = () => {if (!this.#muted) {this.changeNotification.notify()}}
        this.#terminator.ownAll(
            this.bankGroupIndex.subscribe(onPatternIndicesChange),
            this.patternGroupIndex.subscribe(onPatternIndicesChange),
            this.patternIndex.subscribe(onPatternIndicesChange),
            this.bankGroupIndex.subscribe(onChange),
            this.patternGroupIndex.subscribe(onChange),
            this.patternIndex.subscribe(onChange),
            this.trackIndex.subscribe(onChange),
            this.cycleGuideMode.subscribe(onChange),
            this.playMode.subscribe(onChange)
        )
    }

    batch(exec: Exec): void {
        this.#muted = true
        exec()
        this.#muted = false
        this.changeNotification.notify()
    }

    activeBank(): MemoryBank {return this.#memory.banks[this.bankGroupIndex.getValue()]}

    activePatternGroup(): PatternGroup {return this.activeBank().patternGroups[this.patternGroupIndex.getValue()]}

    activePattern(): Pattern {return this.activePatternGroup().patterns[this.patternIndex.getValue()]}

    activeTrack(): Track {return this.activeBank().tracks[this.trackIndex.getValue()]}

    deserialize(format: StateFormat): this {
        this.bankGroupIndex.setValue(format.bankGroupIndex)
        this.patternGroupIndex.setValue(format.patternGroupIndex)
        this.patternIndex.setValue(format.patternIndex)
        this.trackIndex.setValue(format.trackIndex)
        this.cycleGuideMode.setValue(format.cycleGuideMode)
        this.playMode.setValue(format.playMode)
        return this
    }

    serialize(): StateFormat {
        return {
            bankGroupIndex: this.bankGroupIndex.getValue(),
            patternGroupIndex: this.patternGroupIndex.getValue(),
            patternIndex: this.patternIndex.getValue(),
            trackIndex: this.trackIndex.getValue(),
            cycleGuideMode: this.cycleGuideMode.getValue(),
            playMode: this.playMode.getValue()
        }
    }

    terminate(): void {this.#terminator.terminate()}
}
