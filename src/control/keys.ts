import {assert, int, isDefined, Notifier, Observer, Optional, Subscription} from "@opendaw/lib-std"
import {BankIndex, PatternGroupIndex, TrackIndex} from "@/audio/memory"

export enum StepsEditingMode {Step, Tap}

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

export const MainKeyShortcuts: ReadonlyMap<string, MainKeyIndex> = new Map<string, MainKeyIndex>([
    ["Digit1", MainKeyIndex.Step1],
    ["Digit2", MainKeyIndex.Step2],
    ["Digit3", MainKeyIndex.Step3],
    ["Digit4", MainKeyIndex.Step4],
    ["Digit5", MainKeyIndex.Step5],
    ["Digit6", MainKeyIndex.Step6],
    ["Digit7", MainKeyIndex.Step7],
    ["Digit8", MainKeyIndex.Step8],
    ["Digit9", MainKeyIndex.Step9],
    ["Digit0", MainKeyIndex.Step10],
    ["Minus", MainKeyIndex.Step11],
    ["Equal", MainKeyIndex.Step12],
    ["KeyP", MainKeyIndex.Step13],
    ["BracketLeft", MainKeyIndex.Step14],
    ["BracketRight", MainKeyIndex.Step15],
    ["Backslash", MainKeyIndex.Step16],
    ["Enter", MainKeyIndex.CartridgeEnterTotalAccent]
])

export const FunctionKeyShortcuts: ReadonlyMap<string, FunctionKeyIndex> = new Map<string, FunctionKeyIndex>([
    ["KeyQ", FunctionKeyIndex.Track1],
    ["KeyW", FunctionKeyIndex.Track2],
    ["KeyE", FunctionKeyIndex.Track3],
    ["KeyR", FunctionKeyIndex.Track4],
    ["KeyT", FunctionKeyIndex.PatternGroup1],
    ["KeyY", FunctionKeyIndex.PatternGroup2],
    ["KeyU", FunctionKeyIndex.PatternGroup3],
    ["KeyI", FunctionKeyIndex.EmptyExtInst],
    ["ShiftLeft", FunctionKeyIndex.Shift],
    ["ShiftRight", FunctionKeyIndex.Shift],
    ["KeyA", FunctionKeyIndex.LastStep],
    ["KeyS", FunctionKeyIndex.Scale],
    ["KeyD", FunctionKeyIndex.ShuffleFlam],
    ["KeyF", FunctionKeyIndex.Clear],
    ["KeyG", FunctionKeyIndex.InstrumentSelect],
    ["KeyH", FunctionKeyIndex.TempoStep],
    ["KeyJ", FunctionKeyIndex.BackTap],
    ["KeyK", FunctionKeyIndex.ForwardBankI],
    ["KeyL", FunctionKeyIndex.AvailableMeasuresBankII],
    ["Semicolon", FunctionKeyIndex.CycleGuideLastMeasure],
    ["Quote", FunctionKeyIndex.TapeSyncTempoMode]
])

assert(!Array.from(FunctionKeyShortcuts.keys()).some(key => MainKeyShortcuts.has(key)), "Shortcuts overlap")

export namespace ZeroBasedIndices {
    export const BankGroupKeys = [FunctionKeyIndex.ForwardBankI, FunctionKeyIndex.AvailableMeasuresBankII] as const
    export const TrackKeys = [
        FunctionKeyIndex.Track1, FunctionKeyIndex.Track2, FunctionKeyIndex.Track3, FunctionKeyIndex.Track4
    ] as const
    export const PatternGroupKeys = [
        FunctionKeyIndex.PatternGroup1, FunctionKeyIndex.PatternGroup2, FunctionKeyIndex.PatternGroup3
    ] as const
    export const PatternEditModes = [FunctionKeyIndex.TempoStep, FunctionKeyIndex.BackTap] as const
    export const StepKeys = [
        MainKeyIndex.Step1, MainKeyIndex.Step2, MainKeyIndex.Step3, MainKeyIndex.Step4,
        MainKeyIndex.Step5, MainKeyIndex.Step6, MainKeyIndex.Step7, MainKeyIndex.Step8,
        MainKeyIndex.Step9, MainKeyIndex.Step10, MainKeyIndex.Step11, MainKeyIndex.Step12,
        MainKeyIndex.Step13, MainKeyIndex.Step14, MainKeyIndex.Step15, MainKeyIndex.Step16
    ] as const
}

export class MainKeyLabel<T = unknown> {
    static readonly Step1 = new MainKeyLabel(MainKeyIndex.Step1, 0, false)
    static readonly Step2 = new MainKeyLabel(MainKeyIndex.Step2, 1, false)
    static readonly Step3 = new MainKeyLabel(MainKeyIndex.Step3, 2, false)
    static readonly Step4 = new MainKeyLabel(MainKeyIndex.Step4, 3, false)
    static readonly Step5 = new MainKeyLabel(MainKeyIndex.Step5, 4, false)
    static readonly Step6 = new MainKeyLabel(MainKeyIndex.Step6, 5, false)
    static readonly Step7 = new MainKeyLabel(MainKeyIndex.Step7, 6, false)
    static readonly Step8 = new MainKeyLabel(MainKeyIndex.Step8, 7, false)
    static readonly Step9 = new MainKeyLabel(MainKeyIndex.Step9, 8, false)
    static readonly Step10 = new MainKeyLabel(MainKeyIndex.Step10, 9, false)
    static readonly Step11 = new MainKeyLabel(MainKeyIndex.Step11, 10, false)
    static readonly Step12 = new MainKeyLabel(MainKeyIndex.Step12, 11, false)
    static readonly Step13 = new MainKeyLabel(MainKeyIndex.Step13, 12, false)
    static readonly Step14 = new MainKeyLabel(MainKeyIndex.Step14, 13, false)
    static readonly Step15 = new MainKeyLabel(MainKeyIndex.Step15, 14, false)
    static readonly Step16 = new MainKeyLabel(MainKeyIndex.Step16, 15, false)
    static readonly EnterTotalAccent = new MainKeyLabel(MainKeyIndex.CartridgeEnterTotalAccent, "total-accent", false)

    static readonly Digit1 = new MainKeyLabel(MainKeyIndex.Step1, 1, true)
    static readonly Digit2 = new MainKeyLabel(MainKeyIndex.Step2, 2, true)
    static readonly Digit3 = new MainKeyLabel(MainKeyIndex.Step3, 3, true)
    static readonly Digit4 = new MainKeyLabel(MainKeyIndex.Step4, 4, true)
    static readonly Digit5 = new MainKeyLabel(MainKeyIndex.Step5, 5, true)
    static readonly Digit6 = new MainKeyLabel(MainKeyIndex.Step6, 6, true)
    static readonly Digit7 = new MainKeyLabel(MainKeyIndex.Step7, 7, true)
    static readonly Digit8 = new MainKeyLabel(MainKeyIndex.Step8, 8, true)
    static readonly Digit9 = new MainKeyLabel(MainKeyIndex.Step9, 9, true)
    static readonly Digit0 = new MainKeyLabel(MainKeyIndex.Step10, 0, true)
    static readonly Copy = new MainKeyLabel(MainKeyIndex.Step11, "copy", true)
    static readonly Insert = new MainKeyLabel(MainKeyIndex.Step12, "insert", true)
    static readonly Delete = new MainKeyLabel(MainKeyIndex.Step13, "delete", true)
    static readonly Save = new MainKeyLabel(MainKeyIndex.Step14, "save", true)
    static readonly Verify = new MainKeyLabel(MainKeyIndex.Step15, "verify", true)
    static readonly Load = new MainKeyLabel(MainKeyIndex.Step16, "load", true)
    static readonly Enter = new MainKeyLabel(MainKeyIndex.CartridgeEnterTotalAccent, "enter", true)

    static readonly NormalKeys: ReadonlyArray<MainKeyLabel> = [
        MainKeyLabel.Step1, MainKeyLabel.Step2, MainKeyLabel.Step3, MainKeyLabel.Step4,
        MainKeyLabel.Step5, MainKeyLabel.Step6, MainKeyLabel.Step7, MainKeyLabel.Step8,
        MainKeyLabel.Step9, MainKeyLabel.Step10, MainKeyLabel.Step11, MainKeyLabel.Step12,
        MainKeyLabel.Step13, MainKeyLabel.Step14, MainKeyLabel.Step15, MainKeyLabel.Step16,
        MainKeyLabel.EnterTotalAccent
    ]

    static readonly ShiftKeys: ReadonlyArray<MainKeyLabel> = [
        MainKeyLabel.Digit1, MainKeyLabel.Digit2, MainKeyLabel.Digit3, MainKeyLabel.Digit4,
        MainKeyLabel.Digit5, MainKeyLabel.Digit6, MainKeyLabel.Digit7, MainKeyLabel.Digit8,
        MainKeyLabel.Digit9, MainKeyLabel.Digit0, MainKeyLabel.Copy, MainKeyLabel.Insert,
        MainKeyLabel.Delete, MainKeyLabel.Save, MainKeyLabel.Verify, MainKeyLabel.Load,
        MainKeyLabel.Enter
    ]

    private constructor(readonly keyIndex: MainKeyIndex, readonly value: T, readonly shift: boolean) {}

    toNormal(): MainKeyLabel {return this.shift ? MainKeyLabel.NormalKeys[this.keyIndex] : this}
    isStepButton(): boolean {return !this.shift && this.keyIndex <= MainKeyIndex.Step16}
    toStepIndex(): int {return this.keyIndex}
    isTotalAccent(): boolean {return !this.shift && this.keyIndex === MainKeyIndex.CartridgeEnterTotalAccent}
    isDigit(): boolean {return this.shift && this.keyIndex <= MainKeyIndex.Step10}
    toDigit(): int {return (this.keyIndex + 1) % 10}
    isEnter(): boolean {return this.shift && this.keyIndex === MainKeyIndex.CartridgeEnterTotalAccent}
}

export class FunctionKeyLabel<T = unknown> {
    static readonly TrackPlay: ReadonlyArray<FunctionKeyLabel<TrackIndex>> = [
        new FunctionKeyLabel(FunctionKeyIndex.Track1, TrackIndex.I),
        new FunctionKeyLabel(FunctionKeyIndex.Track2, TrackIndex.II),
        new FunctionKeyLabel(FunctionKeyIndex.Track3, TrackIndex.III),
        new FunctionKeyLabel(FunctionKeyIndex.Track4, TrackIndex.IV)
    ]
    static readonly PatternPlay: ReadonlyArray<FunctionKeyLabel<PatternGroupIndex>> = [
        new FunctionKeyLabel(FunctionKeyIndex.PatternGroup1, PatternGroupIndex.I),
        new FunctionKeyLabel(FunctionKeyIndex.PatternGroup2, PatternGroupIndex.II),
        new FunctionKeyLabel(FunctionKeyIndex.PatternGroup3, PatternGroupIndex.III)
    ]
    static readonly Empty = new FunctionKeyLabel(FunctionKeyIndex.EmptyExtInst, "empty")
    static readonly Tempo = new FunctionKeyLabel(FunctionKeyIndex.TempoStep, "tempo")
    static readonly Back = new FunctionKeyLabel(FunctionKeyIndex.BackTap, "back")
    static readonly Forward = new FunctionKeyLabel(FunctionKeyIndex.ForwardBankI, "forward")
    static readonly AvailableMeasures = new FunctionKeyLabel(FunctionKeyIndex.AvailableMeasuresBankII, "available measure")
    static readonly CycleGuide = new FunctionKeyLabel(FunctionKeyIndex.CycleGuideLastMeasure, "cycle/guide")
    static readonly TapeSync = new FunctionKeyLabel(FunctionKeyIndex.TapeSyncTempoMode, "tape sync")
    static readonly LastStep = new FunctionKeyLabel(FunctionKeyIndex.LastStep, "last step")
    static readonly Scale = new FunctionKeyLabel(FunctionKeyIndex.Scale, "scale")
    static readonly ShuffleFlam = new FunctionKeyLabel(FunctionKeyIndex.ShuffleFlam, "shuffle/flam")
    static readonly Clear = new FunctionKeyLabel(FunctionKeyIndex.Clear, "clear")
    static readonly InstrumentSelect = new FunctionKeyLabel(FunctionKeyIndex.InstrumentSelect, "instrument select")
    static readonly Shift = new FunctionKeyLabel(FunctionKeyIndex.Shift, "shift")

    static readonly TrackWrite: ReadonlyArray<FunctionKeyLabel<TrackIndex>> = [
        new FunctionKeyLabel(FunctionKeyIndex.Track1, TrackIndex.I),
        new FunctionKeyLabel(FunctionKeyIndex.Track2, TrackIndex.II),
        new FunctionKeyLabel(FunctionKeyIndex.Track3, TrackIndex.III),
        new FunctionKeyLabel(FunctionKeyIndex.Track4, TrackIndex.IV)
    ]
    static readonly PatternWrite: ReadonlyArray<FunctionKeyLabel<PatternGroupIndex>> = [
        new FunctionKeyLabel(FunctionKeyIndex.PatternGroup1, PatternGroupIndex.I),
        new FunctionKeyLabel(FunctionKeyIndex.PatternGroup2, PatternGroupIndex.II),
        new FunctionKeyLabel(FunctionKeyIndex.PatternGroup3, PatternGroupIndex.III)
    ]
    static readonly ExtInst = new FunctionKeyLabel(FunctionKeyIndex.EmptyExtInst, "external instrument")
    static readonly StepsEditingModes: ReadonlyArray<FunctionKeyLabel<StepsEditingMode>> = [
        new FunctionKeyLabel(FunctionKeyIndex.TempoStep, StepsEditingMode.Step),
        new FunctionKeyLabel(FunctionKeyIndex.BackTap, StepsEditingMode.Tap)
    ]
    static readonly BankGroup: ReadonlyArray<FunctionKeyLabel<BankIndex>> = [
        new FunctionKeyLabel(FunctionKeyIndex.ForwardBankI, BankIndex.I),
        new FunctionKeyLabel(FunctionKeyIndex.AvailableMeasuresBankII, BankIndex.II)
    ]
    static readonly LastMeasure = new FunctionKeyLabel(FunctionKeyIndex.CycleGuideLastMeasure, "last measure")
    static readonly TempoMode = new FunctionKeyLabel(FunctionKeyIndex.TapeSyncTempoMode, "tempo mode")
    static readonly ShiftLastStep = new FunctionKeyLabel(FunctionKeyIndex.LastStep, "")
    static readonly ShiftScale = new FunctionKeyLabel(FunctionKeyIndex.Scale, "")
    static readonly ShiftShuffleFlam = new FunctionKeyLabel(FunctionKeyIndex.ShuffleFlam, "")
    static readonly ShiftClear = new FunctionKeyLabel(FunctionKeyIndex.Clear, "")
    static readonly ShiftInstrumentSelect = new FunctionKeyLabel(FunctionKeyIndex.InstrumentSelect, "")

    static readonly NormalKeys: ReadonlyArray<FunctionKeyLabel> = [
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

    static readonly ShiftKeys: ReadonlyArray<FunctionKeyLabel> = [
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

    private constructor(readonly keyIndex: FunctionKeyIndex, readonly value: T) {}
}

export enum KeyState {Off, Flash, Blink, On}

export type KeyLight = "off" | "on" | "blink" | "flash"

export class Key {
    readonly #notifier: Notifier<Key> = new Notifier<Key>()

    #state: KeyState = KeyState.Off
    #pressed: boolean = false
    #running: boolean = false
    #highlighted: boolean = false

    constructor(readonly type: "main" | "function", readonly keyIndex: int, readonly shortcut: Optional<string>) {}

    get state(): KeyState {return this.#state}
    get pressed(): boolean {return this.#pressed}
    get highlighted(): boolean {return this.#highlighted}

    setState(state: KeyState): void {
        if (this.#state === state) {return}
        this.#state = state
        this.#notifier.notify(this)
    }

    setPressed(value: boolean): void {
        if (this.#pressed === value) {return}
        this.#pressed = value
        this.#notifier.notify(this)
    }

    setRunning(value: boolean): void {
        if (this.#running === value) {return}
        this.#running = value
        this.#notifier.notify(this)
    }

    setHighlighted(value: boolean): void {
        if (this.#highlighted === value) {return}
        this.#highlighted = value
        this.#notifier.notify(this)
    }

    // the running step indicator inverts the lamp like the original hardware
    light(): KeyLight {
        if (this.#running) {return this.#state === KeyState.Flash ? "blink" : "flash"}
        switch (this.#state) {
            case KeyState.Off:
                return "off"
            case KeyState.On:
                return "on"
            case KeyState.Blink:
                return "blink"
            case KeyState.Flash:
                return "flash"
        }
    }

    subscribe(observer: Observer<Key>): Subscription {return this.#notifier.subscribe(observer)}

    catchupAndSubscribe(observer: Observer<Key>): Subscription {
        observer(this)
        return this.#notifier.subscribe(observer)
    }
}

export class KeyGroup<INDEX extends int> {
    constructor(readonly keys: ReadonlyArray<Key>) {}

    forEach(procedure: (key: Key, index: INDEX) => void): void {
        this.keys.forEach((key, index) => procedure(key, index as INDEX))
    }

    byIndex(index: INDEX): Key {return this.keys[index]}

    activate(map: (zeroBasedIndex: int) => KeyState, indices: ReadonlyArray<INDEX>): void {
        indices.forEach((keyIndex: INDEX, zeroBasedIndex: int) => this.byIndex(keyIndex).setState(map(zeroBasedIndex)))
    }

    deactivate(indices?: ReadonlyArray<INDEX>): void {
        if (isDefined(indices)) {
            indices.forEach((keyIndex: INDEX) => this.byIndex(keyIndex).setState(KeyState.Off))
        } else {
            this.keys.forEach(key => key.setState(KeyState.Off))
        }
    }
}
