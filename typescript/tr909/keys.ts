import { BankIndex, PatternGroupIndex, TrackIndex } from "../audio/tr909/memory.js"
import { StepsEditingMode } from "./mode.js"

export enum MainKeyIndex {
    Step1, Step2, Step3, Step4,
    Step5, Step6, Step7, Step8,
    Step9, Step10, Step11, Step12,
    Step13, Step14, Step15, Step16,
    CartridgeEnterTotalAccent
}

export enum FunctionKeyIndex {
    Track1, Track2, Track3, Track4,
    PatternGroup1, PatternGroup2, PatternGroup3, EmptyExtInst,
    TempoStep, BackTap, ForwardBankI, AvailableMeasuresBankII,
    CycleGuideLastMeasure, TapeSyncTempoMode, LastStep, Scale,
    ShuffleFlam, Clear, InstrumentSelect, Shift
}

export const MainKeyShortcuts = new Map<string, MainKeyIndex>([
    ['Digit1', MainKeyIndex.Step1],
    ['Digit2', MainKeyIndex.Step2],
    ['Digit3', MainKeyIndex.Step3],
    ['Digit4', MainKeyIndex.Step4],
    ['Digit5', MainKeyIndex.Step5],
    ['Digit6', MainKeyIndex.Step6],
    ['Digit7', MainKeyIndex.Step7],
    ['Digit8', MainKeyIndex.Step8],
    ['Digit9', MainKeyIndex.Step9],
    ['Digit0', MainKeyIndex.Step10],
    ['Minus', MainKeyIndex.Step11],
    ['Equal', MainKeyIndex.Step12],
    ['KeyP', MainKeyIndex.Step13],
    ['BracketLeft', MainKeyIndex.Step14],
    ['BracketRight', MainKeyIndex.Step15],
    ['Backslash', MainKeyIndex.Step16],
    ['Enter', MainKeyIndex.CartridgeEnterTotalAccent]
])

export const FunctionKeyShortcuts = new Map<string, FunctionKeyIndex>([
    ['KeyQ', FunctionKeyIndex.Track1],
    ['KeyW', FunctionKeyIndex.Track2],
    ['KeyE', FunctionKeyIndex.Track3],
    ['KeyR', FunctionKeyIndex.Track4],
    ['KeyT', FunctionKeyIndex.PatternGroup1],
    ['KeyY', FunctionKeyIndex.PatternGroup2],
    ['KeyU', FunctionKeyIndex.PatternGroup3],
    ['KeyI', FunctionKeyIndex.EmptyExtInst],
    ['ShiftLeft', FunctionKeyIndex.Shift],
    ['ShiftRight', FunctionKeyIndex.Shift],
    ['KeyA', FunctionKeyIndex.LastStep],
    ['KeyS', FunctionKeyIndex.Scale],
    ['KeyD', FunctionKeyIndex.ShuffleFlam],
    ['KeyF', FunctionKeyIndex.Clear],
    ['KeyG', FunctionKeyIndex.InstrumentSelect],
    ['KeyJ', FunctionKeyIndex.TempoStep],
    ['KeyK', FunctionKeyIndex.BackTap],
    ['KeyL', FunctionKeyIndex.ForwardBankI],
    ['Semicolon', FunctionKeyIndex.AvailableMeasuresBankII],
    ['Quote', FunctionKeyIndex.CycleGuideLastMeasure],
])

console.assert(!Array.from(FunctionKeyShortcuts.keys()).some(key => MainKeyShortcuts.has(key)))

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

export class MainKeyLabel<T> {
    static readonly Step1 = MainKeyLabel.create(MainKeyIndex.Step1, 0, false)
    static readonly Step2 = MainKeyLabel.create(MainKeyIndex.Step2, 1, false)
    static readonly Step3 = MainKeyLabel.create(MainKeyIndex.Step3, 2, false)
    static readonly Step4 = MainKeyLabel.create(MainKeyIndex.Step4, 3, false)
    static readonly Step5 = MainKeyLabel.create(MainKeyIndex.Step5, 4, false)
    static readonly Step6 = MainKeyLabel.create(MainKeyIndex.Step6, 5, false)
    static readonly Step7 = MainKeyLabel.create(MainKeyIndex.Step7, 6, false)
    static readonly Step8 = MainKeyLabel.create(MainKeyIndex.Step8, 7, false)
    static readonly Step9 = MainKeyLabel.create(MainKeyIndex.Step9, 8, false)
    static readonly Step10 = MainKeyLabel.create(MainKeyIndex.Step10, 9, false)
    static readonly Step11 = MainKeyLabel.create(MainKeyIndex.Step11, 10, false)
    static readonly Step12 = MainKeyLabel.create(MainKeyIndex.Step12, 11, false)
    static readonly Step13 = MainKeyLabel.create(MainKeyIndex.Step13, 12, false)
    static readonly Step14 = MainKeyLabel.create(MainKeyIndex.Step14, 13, false)
    static readonly Step15 = MainKeyLabel.create(MainKeyIndex.Step15, 14, false)
    static readonly Step16 = MainKeyLabel.create(MainKeyIndex.Step16, 15, false)
    static readonly EnterTotalAccent = MainKeyLabel.create(MainKeyIndex.CartridgeEnterTotalAccent, 'total-accent', false)

    static readonly Digit1 = MainKeyLabel.create(MainKeyIndex.Step1, 1, true)
    static readonly Digit2 = MainKeyLabel.create(MainKeyIndex.Step2, 2, true)
    static readonly Digit3 = MainKeyLabel.create(MainKeyIndex.Step3, 3, true)
    static readonly Digit4 = MainKeyLabel.create(MainKeyIndex.Step4, 4, true)
    static readonly Digit5 = MainKeyLabel.create(MainKeyIndex.Step5, 5, true)
    static readonly Digit6 = MainKeyLabel.create(MainKeyIndex.Step6, 6, true)
    static readonly Digit7 = MainKeyLabel.create(MainKeyIndex.Step7, 7, true)
    static readonly Digit8 = MainKeyLabel.create(MainKeyIndex.Step8, 8, true)
    static readonly Digit9 = MainKeyLabel.create(MainKeyIndex.Step9, 9, true)
    static readonly Digit0 = MainKeyLabel.create(MainKeyIndex.Step10, 0, true)
    static readonly Copy = MainKeyLabel.create(MainKeyIndex.Step11, 'copy', true)
    static readonly Insert = MainKeyLabel.create(MainKeyIndex.Step12, 'insert', true)
    static readonly Delete = MainKeyLabel.create(MainKeyIndex.Step13, 'delete', true)
    static readonly Save = MainKeyLabel.create(MainKeyIndex.Step14, 'save', true)
    static readonly Verify = MainKeyLabel.create(MainKeyIndex.Step15, 'verify', true)
    static readonly Load = MainKeyLabel.create(MainKeyIndex.Step16, 'load', true)
    static readonly Enter = MainKeyLabel.create(MainKeyIndex.CartridgeEnterTotalAccent, 'enter', true)

    static readonly NormalKeys: ReadonlyArray<MainKeyLabel<any>> = [
        MainKeyLabel.Step1, MainKeyLabel.Step2, MainKeyLabel.Step3, MainKeyLabel.Step4,
        MainKeyLabel.Step5, MainKeyLabel.Step6, MainKeyLabel.Step7, MainKeyLabel.Step8,
        MainKeyLabel.Step9, MainKeyLabel.Step10, MainKeyLabel.Step11, MainKeyLabel.Step12,
        MainKeyLabel.Step13, MainKeyLabel.Step14, MainKeyLabel.Step15, MainKeyLabel.Step16,
        MainKeyLabel.EnterTotalAccent
    ]

    static readonly ShiftKeys: ReadonlyArray<MainKeyLabel<any>> = [
        MainKeyLabel.Digit1, MainKeyLabel.Digit2, MainKeyLabel.Digit3, MainKeyLabel.Digit4,
        MainKeyLabel.Digit5, MainKeyLabel.Digit6, MainKeyLabel.Digit7, MainKeyLabel.Digit8,
        MainKeyLabel.Digit9, MainKeyLabel.Digit0, MainKeyLabel.Copy, MainKeyLabel.Insert,
        MainKeyLabel.Delete, MainKeyLabel.Save, MainKeyLabel.Verify, MainKeyLabel.Load,
        MainKeyLabel.Enter
    ]

    private static create<T>(keyIndex: MainKeyIndex, value: T, shift: boolean): MainKeyLabel<T> {
        return new MainKeyLabel<T>(keyIndex, value, shift)
    }

    private constructor(readonly keyIndex: MainKeyIndex, readonly value: T, readonly shift: boolean) {
    }

    toNormal(): MainKeyLabel<any> {
        return this.shift ? MainKeyLabel.NormalKeys[this.keyIndex] : this
    }

    isStepButton(): boolean {
        return !this.shift && this.keyIndex <= MainKeyIndex.Step16
    }

    toStepIndex(): number {
        console.assert(this.isStepButton())
        return this.keyIndex
    }

    isTotalAccent(): boolean {
        return !this.shift && this.keyIndex === MainKeyIndex.CartridgeEnterTotalAccent
    }

    isDigit(): boolean {
        return this.shift && this.keyIndex <= MainKeyIndex.Step10
    }

    toDigit(): number {
        console.assert(this.isDigit())
        return (this.keyIndex + 1) % 10
    }

    isEnter(): boolean {
        return this.shift && this.keyIndex === MainKeyIndex.CartridgeEnterTotalAccent
    }
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
    static readonly LastStep: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.LastStep, 'last step', true)
    static readonly Scale: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.Scale, 'scale')
    static readonly ShuffleFlam: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.ShuffleFlam, 'shuffle/flam', true)
    static readonly Clear: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.Clear, 'clear', true)
    static readonly InstrumentSelect: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.InstrumentSelect, 'instrument select', true)
    static readonly Shift: FunctionKeyLabel<string> = FunctionKeyLabel.create(FunctionKeyIndex.Shift, 'shift', true)

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
    static readonly StepsEditingModes: ReadonlyArray<FunctionKeyLabel<StepsEditingMode>> = [
        FunctionKeyLabel.create(FunctionKeyIndex.TempoStep, StepsEditingMode.Step),
        FunctionKeyLabel.create(FunctionKeyIndex.BackTap, StepsEditingMode.Tap)
    ] as const
    static readonly BankGroup: ReadonlyArray<FunctionKeyLabel<BankIndex>> = [
        FunctionKeyLabel.create(FunctionKeyIndex.ForwardBankI, BankIndex.I),
        FunctionKeyLabel.create(FunctionKeyIndex.AvailableMeasuresBankII, BankIndex.II)
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
        FunctionKeyLabel.InstrumentSelect,
        FunctionKeyLabel.Shift
    ]
    static readonly ShiftKeys: ReadonlyArray<FunctionKeyLabel<any>> = [
        ...FunctionKeyLabel.TrackWrite,
        ...FunctionKeyLabel.PatternWrite,
        FunctionKeyLabel.ExtInst,
        ...FunctionKeyLabel.StepsEditingModes,
        ...FunctionKeyLabel.BankGroup,
        FunctionKeyLabel.LastMeasure,
        FunctionKeyLabel.TempoMode,
        FunctionKeyLabel.ShiftLastStep,
        FunctionKeyLabel.ShiftScale,
        FunctionKeyLabel.ShiftShuffleFlam,
        FunctionKeyLabel.ShiftClear,
        FunctionKeyLabel.ShiftInstrumentSelect
    ]

    private static create<T>(keyIndex: FunctionKeyIndex, value: T, multiTap: boolean = false): FunctionKeyLabel<T> {
        return new FunctionKeyLabel<T>(keyIndex, value, multiTap)
    }

    private constructor(readonly keyIndex: FunctionKeyIndex, readonly value: T, readonly multiTap: boolean) {
    }
}

export enum KeyState {
    Off, Flash, Blink, On
}

export class Key {
    private state: KeyState = KeyState.Off

    constructor(readonly element: HTMLButtonElement,
        readonly type: 'main' | 'function',
        readonly keyIndex: number) {
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

    setPressed(isPressed: boolean): void {
        this.element.classList.toggle('active', isPressed)
    }

    applyState(): void {
        this.element.classList.toggle('enabled', this.state === KeyState.On)
        this.element.classList.toggle('blink-enabled', this.state === KeyState.Blink)
        this.element.classList.toggle('flash-enabled', this.state === KeyState.Flash)
    }

    flash(): void {
        this.element.classList.toggle('enabled', this.state !== KeyState.On)
        this.element.classList.toggle('blink-enabled', this.state !== KeyState.Blink)
        this.element.classList.toggle('flash-enabled', this.state !== KeyState.Flash)
    }

    touchPoint(): { x: number, y: number } {
        const rect = this.element.getBoundingClientRect()
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
    }

    isMainKey() {
        return this.type === 'main'
    }

    isFunctionKey() {
        return this.type === 'function'
    }
}

export class KeyGroup<INDEX extends number> {
    constructor(readonly keys: ReadonlyArray<Key>) {
    }

    forEach(fn: (key: Key, index: number) => void): void {
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