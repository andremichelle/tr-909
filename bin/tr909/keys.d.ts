import { BankIndex, PatternGroupIndex, TrackIndex } from "../audio/tr909/memory.js";
import { Terminable } from "../lib/common.js";
export declare enum PatternEditMode {
    Step = 0,
    Tap = 1
}
export declare enum MainKeyIndex {
    Step1 = 0,
    Step2 = 1,
    Step3 = 2,
    Step4 = 3,
    Step5 = 4,
    Step6 = 5,
    Step7 = 6,
    Step8 = 7,
    Step9 = 8,
    Step10 = 9,
    Step11 = 10,
    Step12 = 11,
    Step13 = 12,
    Step14 = 13,
    Step15 = 14,
    Step16 = 15,
    CartridgeEnterTotalAccent = 16
}
export declare enum FunctionKeyIndex {
    Track1 = 0,
    Track2 = 1,
    Track3 = 2,
    Track4 = 3,
    PatternGroup1 = 4,
    PatternGroup2 = 5,
    PatternGroup3 = 6,
    EmptyExtInst = 7,
    TempoStep = 8,
    BackTap = 9,
    ForwardBankI = 10,
    AvailableMeasuresBankII = 11,
    CycleGuideLastMeasure = 12,
    TapeSyncTempoMode = 13,
    LastStep = 14,
    Scale = 15,
    ShuffleFlam = 16,
    Clear = 17,
    InstrumentSelect = 18,
    Shift = 19
}
export declare const FunctionKeyboardShortcuts: Map<string, FunctionKeyIndex>;
export declare class ZeroBasedIndices {
    static readonly BankGroupKeys: readonly [FunctionKeyIndex.ForwardBankI, FunctionKeyIndex.AvailableMeasuresBankII];
    static readonly TrackKeys: readonly [FunctionKeyIndex.Track1, FunctionKeyIndex.Track2, FunctionKeyIndex.Track3, FunctionKeyIndex.Track4];
    static readonly PatternGroupKeys: readonly [FunctionKeyIndex.PatternGroup1, FunctionKeyIndex.PatternGroup2, FunctionKeyIndex.PatternGroup3];
    static readonly PatternEditModes: readonly [FunctionKeyIndex.TempoStep, FunctionKeyIndex.BackTap];
    static readonly StepKeys: readonly [MainKeyIndex.Step1, MainKeyIndex.Step2, MainKeyIndex.Step3, MainKeyIndex.Step4, MainKeyIndex.Step5, MainKeyIndex.Step6, MainKeyIndex.Step7, MainKeyIndex.Step8, MainKeyIndex.Step9, MainKeyIndex.Step10, MainKeyIndex.Step11, MainKeyIndex.Step12, MainKeyIndex.Step13, MainKeyIndex.Step14, MainKeyIndex.Step15, MainKeyIndex.Step16];
}
export declare class FunctionKeyLabel<T> {
    readonly keyIndex: FunctionKeyIndex;
    readonly value: T;
    readonly multiTap: boolean;
    static readonly TrackPlay: ReadonlyArray<FunctionKeyLabel<TrackIndex>>;
    static readonly PatternPlay: ReadonlyArray<FunctionKeyLabel<PatternGroupIndex>>;
    static readonly Empty: FunctionKeyLabel<string>;
    static readonly Tempo: FunctionKeyLabel<string>;
    static readonly Back: FunctionKeyLabel<string>;
    static readonly Forward: FunctionKeyLabel<string>;
    static readonly AvailableMeasures: FunctionKeyLabel<string>;
    static readonly CycleGuide: FunctionKeyLabel<string>;
    static readonly TapeSync: FunctionKeyLabel<string>;
    static readonly LastStep: FunctionKeyLabel<string>;
    static readonly Scale: FunctionKeyLabel<string>;
    static readonly ShuffleFlam: FunctionKeyLabel<string>;
    static readonly Clear: FunctionKeyLabel<string>;
    static readonly InstrumentSelect: FunctionKeyLabel<string>;
    static readonly Shift: FunctionKeyLabel<string>;
    static readonly TrackWrite: ReadonlyArray<FunctionKeyLabel<TrackIndex>>;
    static readonly PatternWrite: ReadonlyArray<FunctionKeyLabel<PatternGroupIndex>>;
    static readonly ExtInst: FunctionKeyLabel<string>;
    static readonly PatternEditMode: ReadonlyArray<FunctionKeyLabel<PatternEditMode>>;
    static readonly BankGroup: ReadonlyArray<FunctionKeyLabel<BankIndex>>;
    static readonly LastMeasure: FunctionKeyLabel<string>;
    static readonly TempoMode: FunctionKeyLabel<string>;
    static readonly ShiftLastStep: FunctionKeyLabel<string>;
    static readonly ShiftScale: FunctionKeyLabel<string>;
    static readonly ShiftShuffleFlam: FunctionKeyLabel<string>;
    static readonly ShiftClear: FunctionKeyLabel<string>;
    static readonly ShiftInstrumentSelect: FunctionKeyLabel<string>;
    static readonly NormalKeys: ReadonlyArray<FunctionKeyLabel<any>>;
    static readonly ShiftKeys: ReadonlyArray<FunctionKeyLabel<any>>;
    private static create;
    private constructor();
}
export declare enum KeyState {
    Off = 0,
    Flash = 1,
    Blink = 2,
    On = 3
}
export declare class Key {
    readonly element: HTMLButtonElement;
    readonly type: 'main' | 'function';
    readonly keyIndex: number;
    private state;
    constructor(element: HTMLButtonElement, type: 'main' | 'function', keyIndex: number);
    bind(type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): Terminable;
    setPointerCapture(pointerId: number): void;
    setState(state: KeyState): void;
    setPressed(isPressed: boolean): void;
    applyState(): void;
    flash(): void;
    touchPoint(): {
        x: number;
        y: number;
    };
    isMainKey(): boolean;
    isFunctionKey(): boolean;
}
export declare class KeyGroup<INDEX extends number> {
    readonly keys: ReadonlyArray<Key>;
    constructor(keys: ReadonlyArray<Key>);
    forEach(fn: (key: Key, index: number) => void): void;
    byIndex(index: INDEX): Key;
    activate(map: (zeroBasedIndex: number) => KeyState, indices: ReadonlyArray<INDEX>): void;
    deactivate(indices?: ReadonlyArray<INDEX>): void;
}
