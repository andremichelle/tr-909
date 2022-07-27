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

export class ZeroBasedIndices {
    static BankGroupKeys = [FunctionKeyIndex.ForwardBankI, FunctionKeyIndex.AvailableMeasuresBankII]
    static TrackKeys = [FunctionKeyIndex.Track1, FunctionKeyIndex.Track2, FunctionKeyIndex.Track3, FunctionKeyIndex.Track4]
    static PatternGroupKeys = [FunctionKeyIndex.PatternGroup1, FunctionKeyIndex.PatternGroup2, FunctionKeyIndex.PatternGroup3]
    static PatternEditModes = [FunctionKeyIndex.TempoStep, FunctionKeyIndex.BackTap]
}

export class FunctionKeyLabel<T> {
    static TrackPlay: FunctionKeyLabel<TrackIndex>[] = [
        FunctionKeyLabel.create(TrackIndex.I),
        FunctionKeyLabel.create(TrackIndex.II),
        FunctionKeyLabel.create(TrackIndex.III),
        FunctionKeyLabel.create(TrackIndex.IV)
    ]
    static PatternPlay: FunctionKeyLabel<PatternGroupIndex>[] = [
        FunctionKeyLabel.create(PatternGroupIndex.I),
        FunctionKeyLabel.create(PatternGroupIndex.II),
        FunctionKeyLabel.create(PatternGroupIndex.III)
    ]
    static Empty: FunctionKeyLabel<string> = FunctionKeyLabel.create('empty')
    static Tempo: FunctionKeyLabel<string> = FunctionKeyLabel.create('tempo')
    static Back: FunctionKeyLabel<string> = FunctionKeyLabel.create('back')
    static Forward: FunctionKeyLabel<string> = FunctionKeyLabel.create('fwd')
    static AvailableMeasures: FunctionKeyLabel<string> = FunctionKeyLabel.create('available measure')
    static CycleGuide: FunctionKeyLabel<string> = FunctionKeyLabel.create('cycle/guide')
    static TapeSync: FunctionKeyLabel<string> = FunctionKeyLabel.create('tape sync')
    static LastStep: FunctionKeyLabel<string> = FunctionKeyLabel.create('last step')
    static Scale: FunctionKeyLabel<string> = FunctionKeyLabel.create('scale')
    static ShuffleFlam: FunctionKeyLabel<string> = FunctionKeyLabel.create('shuffle/flam')
    static Clear: FunctionKeyLabel<string> = FunctionKeyLabel.create('clear')
    static InstrumentSelect: FunctionKeyLabel<string> = FunctionKeyLabel.create('instrument select')

    static TrackWrite: FunctionKeyLabel<TrackIndex>[] = [
        FunctionKeyLabel.create(TrackIndex.I),
        FunctionKeyLabel.create(TrackIndex.II),
        FunctionKeyLabel.create(TrackIndex.III),
        FunctionKeyLabel.create(TrackIndex.IV)
    ]
    static PatternWrite: FunctionKeyLabel<PatternGroupIndex>[] = [
        FunctionKeyLabel.create(PatternGroupIndex.I),
        FunctionKeyLabel.create(PatternGroupIndex.II),
        FunctionKeyLabel.create(PatternGroupIndex.III)
    ]
    static ExtInst: FunctionKeyLabel<string> = FunctionKeyLabel.create('external instrument')
    static PatternEditMode: FunctionKeyLabel<PatternEditMode>[] = [
        FunctionKeyLabel.create(PatternEditMode.Step),
        FunctionKeyLabel.create(PatternEditMode.Tap)
    ]
    static BankGroup: FunctionKeyLabel<BankGroupIndex>[] = [
        FunctionKeyLabel.create(BankGroupIndex.I),
        FunctionKeyLabel.create(BankGroupIndex.II)
    ]
    static LastMeas: FunctionKeyLabel<string> = FunctionKeyLabel.create('last measure')
    static TempoMode: FunctionKeyLabel<string> = FunctionKeyLabel.create('tempo mode')
    static Void: FunctionKeyLabel<string> = FunctionKeyLabel.create('')

    static NormalKeys: FunctionKeyLabel<any>[] = [
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
    static ShiftKeys: FunctionKeyLabel<any>[] = [
        ...FunctionKeyLabel.TrackWrite,
        ...FunctionKeyLabel.PatternWrite,
        FunctionKeyLabel.ExtInst,
        ...FunctionKeyLabel.PatternEditMode,
        ...FunctionKeyLabel.BankGroup,
        FunctionKeyLabel.LastMeas,
        FunctionKeyLabel.TempoMode,
        FunctionKeyLabel.Void,
        FunctionKeyLabel.Void,
        FunctionKeyLabel.Void,
        FunctionKeyLabel.Void,
        FunctionKeyLabel.Void
    ]

    private static create<T>(value: T): FunctionKeyLabel<T> {
        return new FunctionKeyLabel<T>(value)
    }

    private constructor(readonly value: T) {
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
    constructor(readonly keys: Key[]) {
    }

    forEach(fn: (key: Key, index: INDEX) => void): void {
        this.keys.forEach(fn)
    }

    byIndex(index: INDEX): Key {
        return this.keys[index]
    }

    activate(map: (zeroBasedIndex: number) => KeyState, indices: INDEX[]): void {
        indices.forEach((keyIndex: INDEX, zeroBasedIndex: number) =>
            this.byIndex(keyIndex).setState(map(zeroBasedIndex)))
    }

    deactivate(indices?: INDEX[]): void {
        if (indices === undefined) {
            this.keys.forEach(key => key.setState(KeyState.Off))
        } else {
            indices.forEach((keyIndex: INDEX) => this.byIndex(keyIndex).setState(KeyState.Off))
        }
    }
}