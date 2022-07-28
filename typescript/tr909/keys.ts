import {BankGroupIndex, PatternGroupIndex, TrackIndex} from "../audio/tr909/memory.js"
import {Events, Terminable} from "../lib/common.js"

export enum PatternEditMode {
    Step, Tap
}

export enum MainKeyIndex {
    Step1, Step2, Step3, Step4,
    Step5, Step6, Step7, Step8,
    Step9, Step10, Step11, Step12,
    Step13, Step14, Step15, Step16,
    TotalAccent
}

export enum FunctionKeyIndex {
    Track1, Track2, Track3, Track4,
    PatternGroup1, PatternGroup2, PatternGroup3, EmptyExtInst,
    TempoStep, BackTap, ForwardBankI, AvailableMeasuresBankII,
    CycleGuideLastMeasure, TapeSyncTempoMode, LastStep, Scale,
    ShuffleFlam, Clear, InstrumentSelect
}

export const FunctionKeyboardShortcuts = new Map<string, FunctionKeyIndex>([
    ['Digit1', FunctionKeyIndex.Track1],
    ['Digit2', FunctionKeyIndex.Track2],
    ['Digit3', FunctionKeyIndex.Track3],
    ['Digit4', FunctionKeyIndex.Track4],
    ['Digit5', FunctionKeyIndex.PatternGroup1],
    ['Digit6', FunctionKeyIndex.PatternGroup2],
    ['Digit7', FunctionKeyIndex.PatternGroup3],
    ['Digit8', FunctionKeyIndex.EmptyExtInst],
    ['KeyL', FunctionKeyIndex.LastStep],
    ['KeyS', FunctionKeyIndex.ShuffleFlam],
    ['KeyC', FunctionKeyIndex.Clear],
    ['KeyI', FunctionKeyIndex.InstrumentSelect],
])

export class ZeroBasedIndices {
    static readonly BankGroupKeys = [
        FunctionKeyIndex.ForwardBankI, FunctionKeyIndex.AvailableMeasuresBankII
    ] as const
    static readonly TrackKeys = [
        FunctionKeyIndex.Track1, FunctionKeyIndex.Track2, FunctionKeyIndex.Track3, FunctionKeyIndex.Track4
    ] as const
    static readonly PatternGroupKeys = [
        FunctionKeyIndex.PatternGroup1, FunctionKeyIndex.PatternGroup2, FunctionKeyIndex.PatternGroup3
    ] as const
    static readonly PatternEditModes = [
        FunctionKeyIndex.TempoStep, FunctionKeyIndex.BackTap
    ] as const
    static readonly StepKeys = [
        MainKeyIndex.Step1, MainKeyIndex.Step2, MainKeyIndex.Step3, MainKeyIndex.Step4,
        MainKeyIndex.Step5, MainKeyIndex.Step6, MainKeyIndex.Step7, MainKeyIndex.Step8,
        MainKeyIndex.Step9, MainKeyIndex.Step10, MainKeyIndex.Step11, MainKeyIndex.Step12,
        MainKeyIndex.Step13, MainKeyIndex.Step14, MainKeyIndex.Step15, MainKeyIndex.Step16
    ] as const
}

export class FunctionKeyLabel<T> {
    static readonly TrackPlay: ReadonlyArray<FunctionKeyLabel<TrackIndex>> = [
        FunctionKeyLabel.create(FunctionKeyIndex.Track1, TrackIndex.I),
        FunctionKeyLabel.create(FunctionKeyIndex.Track2, TrackIndex.II),
        FunctionKeyLabel.create(FunctionKeyIndex.Track3, TrackIndex.III),
        FunctionKeyLabel.create(FunctionKeyIndex.Track4, TrackIndex.IV)
    ]
    static readonly PatternPlay: ReadonlyArray<FunctionKeyLabel<PatternGroupIndex>> = [
        FunctionKeyLabel.create(FunctionKeyIndex.PatternGroup1, PatternGroupIndex.I),
        FunctionKeyLabel.create(FunctionKeyIndex.PatternGroup2, PatternGroupIndex.II),
        FunctionKeyLabel.create(FunctionKeyIndex.PatternGroup3, PatternGroupIndex.III)
    ]
    static readonly Empty: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.EmptyExtInst, 'empty')
    static readonly Tempo: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.TempoStep, 'tempo')
    static readonly Back: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.BackTap, 'back')
    static readonly Forward: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.ForwardBankI, 'forward')
    static readonly AvailableMeasures: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.AvailableMeasuresBankII, 'available measure')
    static readonly CycleGuide: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.CycleGuideLastMeasure, 'cycle/guide')
    static readonly TapeSync: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.TapeSyncTempoMode, 'tape sync')
    static readonly LastStep: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.LastStep, 'last step')
    static readonly Scale: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.Scale, 'scale')
    static readonly ShuffleFlam: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.ShuffleFlam, 'shuffle/flam')
    static readonly Clear: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.Clear, 'clear')
    static readonly InstrumentSelect: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.InstrumentSelect, 'instrument select')

    static readonly TrackWrite: ReadonlyArray<FunctionKeyLabel<TrackIndex>> = [
        FunctionKeyLabel.create(FunctionKeyIndex.Track1, TrackIndex.I),
        FunctionKeyLabel.create(FunctionKeyIndex.Track2, TrackIndex.II),
        FunctionKeyLabel.create(FunctionKeyIndex.Track3, TrackIndex.III),
        FunctionKeyLabel.create(FunctionKeyIndex.Track4, TrackIndex.IV)
    ]
    static readonly PatternWrite: ReadonlyArray<FunctionKeyLabel<PatternGroupIndex>> = [
        FunctionKeyLabel.create(FunctionKeyIndex.PatternGroup1, PatternGroupIndex.I),
        FunctionKeyLabel.create(FunctionKeyIndex.PatternGroup2, PatternGroupIndex.II),
        FunctionKeyLabel.create(FunctionKeyIndex.PatternGroup3, PatternGroupIndex.III)
    ]
    static readonly ExtInst: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.EmptyExtInst, 'external instrument')
    static readonly PatternEditMode: ReadonlyArray<FunctionKeyLabel<PatternEditMode>> = [
        FunctionKeyLabel.create(FunctionKeyIndex.TempoStep, PatternEditMode.Step),
        FunctionKeyLabel.create(FunctionKeyIndex.BackTap, PatternEditMode.Tap)
    ] as const
    static readonly BankGroup: ReadonlyArray<FunctionKeyLabel<BankGroupIndex>> = [
        FunctionKeyLabel.create(FunctionKeyIndex.ForwardBankI, BankGroupIndex.I),
        FunctionKeyLabel.create(FunctionKeyIndex.AvailableMeasuresBankII, BankGroupIndex.II)
    ]
    static readonly LastMeasure: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.CycleGuideLastMeasure, 'last measure')
    static readonly TempoMode: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.TapeSyncTempoMode, 'tempo mode')
    static readonly ShiftLastStep: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.LastStep, '') // unused
    static readonly ShiftScale: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.Scale, '') // unused
    static readonly ShiftShuffleFlam: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.ShuffleFlam, '') // unused
    static readonly ShiftClear: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.Clear, '') // unused
    static readonly ShiftInstrumentSelect: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.InstrumentSelect, '') // unused

    static readonly NormalKeys: ReadonlyArray<FunctionKeyLabel<any>> = [
        ...FunctionKeyLabel.TrackPlay,
        ...FunctionKeyLabel.PatternPlay,
        FunctionKeyLabel.Empty,
        FunctionKeyLabel.Tempo,
        FunctionKeyLabel.Back,
        FunctionKeyLabel.Forward,
        FunctionKeyLabel.AvailableMeasures,
        FunctionKeyLabel.CycleGuide,
        FunctionKeyLabel.TapeSync,
        FunctionKeyLabel.LastStep,
        FunctionKeyLabel.Scale,
        FunctionKeyLabel.ShuffleFlam,
        FunctionKeyLabel.Clear,
        FunctionKeyLabel.InstrumentSelect
    ]
    static readonly ShiftKeys: ReadonlyArray<FunctionKeyLabel<any>> = [
        ...FunctionKeyLabel.TrackWrite,
        ...FunctionKeyLabel.PatternWrite,
        FunctionKeyLabel.ExtInst,
        ...FunctionKeyLabel.PatternEditMode,
        ...FunctionKeyLabel.BankGroup,
        FunctionKeyLabel.LastMeasure,
        FunctionKeyLabel.TempoMode,
        FunctionKeyLabel.ShiftLastStep,
        FunctionKeyLabel.ShiftScale,
        FunctionKeyLabel.ShiftShuffleFlam,
        FunctionKeyLabel.ShiftClear,
        FunctionKeyLabel.ShiftInstrumentSelect
    ]

    private static create<T>(keyIndex: FunctionKeyIndex, value: T): FunctionKeyLabel<T> {
        return new FunctionKeyLabel<T>(keyIndex, value)
    }

    private constructor(readonly keyIndex: FunctionKeyIndex, readonly value: T) {
    }
}

export enum KeyState {
    Off, Flash, Blink, On
}

export class Key {
    private state: KeyState = KeyState.Off

    constructor(private readonly element: HTMLButtonElement) {
    }

    bind(type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): Terminable {
        return Events.bindEventListener(this.element, type, listener, options)
    }

    setPointerCapture(pointerId: number): void {
        this.element.setPointerCapture(pointerId)
    }

    setState(state: KeyState): void {
        if (this.state === state) {
            return
        }
        this.state = state
        this.applyState()
    }

    applyState(): void {
        this.element.classList.toggle('active', this.state === KeyState.On)
        this.element.classList.toggle('blink-active', this.state === KeyState.Blink)
        this.element.classList.toggle('flash-active', this.state === KeyState.Flash)
    }

    flash(): void {
        this.element.classList.toggle('active', this.state !== KeyState.On)
        this.element.classList.toggle('blink-active', this.state !== KeyState.Blink)
        this.element.classList.toggle('flash-active', this.state !== KeyState.Flash)
    }
}

export class KeyGroup<INDEX extends number> {
    constructor(readonly keys: ReadonlyArray<Key>) {
    }

    forEach(fn: (key: Key, index: INDEX) => void): void {
        this.keys.forEach(fn)
    }

    byIndex(index: INDEX): Key {
        return this.keys[index]
    }

    activate(map: (zeroBasedIndex: number) => KeyState, indices: ReadonlyArray<INDEX>): void {
        indices.forEach((keyIndex: INDEX, zeroBasedIndex: number) =>
            this.byIndex(keyIndex).setState(map(zeroBasedIndex)))
    }

    deactivate(indices?: ReadonlyArray<INDEX>): void {
        if (indices === undefined) {
            this.keys.forEach(key => key.setState(KeyState.Off))
        } else {
            indices.forEach((keyIndex: INDEX) => this.byIndex(keyIndex).setState(KeyState.Off))
        }
    }
}