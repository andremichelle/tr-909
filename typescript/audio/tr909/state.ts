import {
    ObservableImpl,
    ObservableValue,
    ObservableValueImpl,
    Serializer,
    Terminable,
    Terminator
} from "../../lib/common.js"
import {
    BankIndex,
    Memory,
    MemoryBank,
    Pattern,
    PatternGroup,
    PatternGroupIndex,
    PatternIndex, Track, TrackIndex
} from "./memory.js"

export enum PlayMode {
    Track, Pattern
}

export interface StateFormat {
    bankGroupIndex: BankIndex
    patternGroupIndex: PatternGroupIndex
    patternIndex: PatternIndex
    trackIndex: TrackIndex
    cycleGuideMode: boolean
    playMode: PlayMode
}

export class State implements Serializer<StateFormat>, Terminable {
    private readonly terminator: Terminator = new Terminator()

    readonly bankGroupIndex: ObservableValue<BankIndex> = new ObservableValueImpl<BankIndex>(BankIndex.I)
    readonly patternGroupIndex: ObservableValue<PatternGroupIndex> = new ObservableValueImpl<PatternGroupIndex>(PatternGroupIndex.I)
    readonly patternIndex: ObservableValue<PatternIndex> = new ObservableValueImpl<PatternIndex>(PatternIndex.Pattern1)
    readonly trackIndex: ObservableValue<TrackIndex> = new ObservableValueImpl<TrackIndex>(TrackIndex.I)
    readonly cycleGuideMode: ObservableValue<boolean> = new ObservableValueImpl<boolean>(false)
    readonly playMode: ObservableValue<PlayMode> = new ObservableValueImpl<PlayMode>(PlayMode.Track)

    readonly changeNotification: ObservableImpl<void> = new ObservableImpl<void>()
    readonly patternIndicesChangeNotification: ObservableImpl<Pattern> = new ObservableImpl<Pattern>()

    constructor(readonly memory: Memory) {
        this.terminator.with(this.bankGroupIndex.addObserver(this.onPatternIndicesChange, false))
        this.terminator.with(this.patternGroupIndex.addObserver(this.onPatternIndicesChange, false))
        this.terminator.with(this.patternIndex.addObserver(this.onPatternIndicesChange, false))

        this.terminator.with(this.bankGroupIndex.addObserver(this.onChange, false))
        this.terminator.with(this.patternGroupIndex.addObserver(this.onChange, false))
        this.terminator.with(this.patternIndex.addObserver(this.onChange, false))
        this.terminator.with(this.trackIndex.addObserver(this.onChange, false))
        this.terminator.with(this.cycleGuideMode.addObserver(this.onChange, false))
        this.terminator.with(this.playMode.addObserver(this.onChange, false))
    }

    activeBank(): MemoryBank {
        const banks = this.memory.banks
        const bankIndex = this.bankGroupIndex.get()
        console.assert(bankIndex >= 0 && bankIndex < banks.length)
        return banks[bankIndex]
    }

    activePatternGroup(): PatternGroup {
        const patternGroups = this.activeBank().patternGroups
        const patternGroupIndex = this.patternGroupIndex.get()
        console.assert(patternGroupIndex >= 0 && patternGroupIndex < patternGroups.length)
        return patternGroups[patternGroupIndex]
    }

    activePattern(): Pattern {
        const patterns = this.activePatternGroup().patterns
        const patternIndex = this.patternIndex.get()
        console.assert(patternIndex >= 0 && patternIndex < patterns.length)
        return patterns[patternIndex]
    }

    activeTrack(): Track {
        const tracks = this.activeBank().tracks
        const trackIndex = this.trackIndex.get()
        console.assert(trackIndex >= 0 && trackIndex < tracks.length)
        return tracks[trackIndex]
    }

    deserialize(format: StateFormat): Serializer<StateFormat> {
        this.bankGroupIndex.set(format.bankGroupIndex)
        this.patternGroupIndex.set(format.patternGroupIndex)
        this.patternIndex.set(format.patternIndex)
        this.trackIndex.set(format.trackIndex)
        this.cycleGuideMode.set(format.cycleGuideMode)
        this.playMode.set(format.playMode)
        return this
    }

    serialize(): StateFormat {
        return {
            bankGroupIndex: this.bankGroupIndex.get(),
            patternGroupIndex: this.patternGroupIndex.get(),
            patternIndex: this.patternIndex.get(),
            trackIndex: this.trackIndex.get(),
            cycleGuideMode: this.cycleGuideMode.get(),
            playMode: this.playMode.get()
        }
    }

    terminate(): void {
        this.terminator.terminate()
    }

    private readonly onChange = () => this.changeNotification.notify()
    private readonly onPatternIndicesChange = () => this.patternIndicesChangeNotification.notify(this.activePattern())
}