import {
    ArrayUtils,
    Observable,
    ObservableImpl,
    ObservableValueImpl,
    Observer,
    Terminable,
    Terminator
} from "../../lib/common.js"
import {State} from "./state.js"
import {Track} from "./track.js"

export enum BankIndex {I, II}

export enum TrackIndex {I, II, III, IV} // times 2 for each bank

export enum PatternGroupIndex {I, II, III} // times 2 for each bank

export enum PatternIndex {
    // noinspection JSUnusedGlobalSymbols
    Pattern1, Pattern2, Pattern3, Pattern4,
    Pattern5, Pattern6, Pattern7, Pattern8,
    Pattern9, Pattern10, Pattern11, Pattern12,
    Pattern13, Pattern14, Pattern15, Pattern16,
}

/**
 * 'Extra' is either 'Flam' for Bassdrum, Snaredrum and Toms or 'Open' for Hihat.
 * Rim shot, hand clap and cymbals are supposed only to be 'Full' in the original machine.
 */
export enum Step {
    None = 0, Weak = 1, Full = 2, Extra
}

export type ScaleIndex = 0 | 1 | 2 | 3
export type ShuffleIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type FlamIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export enum ChannelIndex {
    Bassdrum, Snaredrum,
    TomLow, TomMid, TomHi,
    Rim, Clap,
    Hihat, Crash, Ride,
    End
}

export class Memory {
    private static readonly MAX_MEASURES = 896

    readonly banks: [MemoryBank, MemoryBank] = [new MemoryBank(), new MemoryBank()]
    readonly state: State = new State(this)

    availableMeasures(): number {
        return Memory.MAX_MEASURES - this.banks.reduce((count: number, bank: MemoryBank) =>
            count + bank.tracks.reduce((count: number, track: Track) => count + track.size(), 0), 0)
    }
}

export class MemoryBank {
    static readonly NUM_TRACKS = 4
    static readonly NUM_PATTERN_GROUPS = 3

    readonly tracks: ReadonlyArray<Track>
    readonly patternGroups: ReadonlyArray<PatternGroup>

    constructor() {
        this.tracks = ArrayUtils.fill(MemoryBank.NUM_TRACKS,
            () => new Track())
        this.patternGroups = ArrayUtils.fill(MemoryBank.NUM_PATTERN_GROUPS,
            (index: PatternGroupIndex) => new PatternGroup(index))
    }

    nextPattern(pattern: Pattern): Pattern | null {
        if (pattern.location.patternIndex < PatternGroup.NUM_PATTERNS - 1) {
            return this.patternByIndices(
                pattern.location.patternGroupIndex,
                pattern.location.patternIndex + 1)
        } else {
            return null
        }
    }

    patternByIndices(patternGroupIndex: PatternGroupIndex, patternIndex: PatternIndex): Pattern {
        return this.patternGroups[patternGroupIndex].patterns[patternIndex]
    }

    patternByLocation(location: PatternLocation): Pattern {
        return this.patternByIndices(location.patternGroupIndex, location.patternIndex)
    }
}

export class PatternGroup {
    static readonly NUM_PATTERNS = 16

    readonly patterns: ReadonlyArray<Pattern>
    readonly chained: boolean[] = new Array(PatternGroup.NUM_PATTERNS - 1).fill(false)

    constructor(patternGroupIndex: PatternGroupIndex) {
        this.patterns = ArrayUtils.fill(PatternGroup.NUM_PATTERNS,
            (patternIndex: PatternIndex) => new Pattern({patternGroupIndex, patternIndex}))
    }
}

export interface PatternFormat {
    steps: Step[][]
    totalAccents: boolean[]
    lastStep: number
    scaleIndex: ScaleIndex
    shuffleIndex: ShuffleIndex
    flamIndex: FlamIndex
    chained: boolean
}

export type PatternLocation = { readonly patternGroupIndex: PatternGroupIndex, readonly patternIndex: PatternIndex }

export class Pattern implements Observable<void> {
    // https://www.kvraudio.com/forum/viewtopic.php?p=3740195&sid=89d14cd241a916781a274f424c4d92a0#p3740195
    // aM: However from my hearing we divide by 32 and not multiply by 2/96 (too less shuffle)
    static readonly ShuffleDelays = ArrayUtils.fill(7, index => index / 32)

    // http://www.e-licktronic.com/forum/viewtopic.php?f=25&t=1430
    static readonly FlamDelays = ArrayUtils.fill(8, index => 10 + index * 4)

    static readonly ScaleRatios: ReadonlyArray<number> = [3.0 / 16.0, 3.0 / 32.0, 1.0 / 32.0, 1.0 / 16.0]

    private readonly terminator: Terminator = new Terminator()

    readonly lastStep = new ObservableValueImpl<number>(16)
    readonly flamIndex = new ObservableValueImpl<FlamIndex>(0)
    readonly shuffleIndex = new ObservableValueImpl<ShuffleIndex>(0)
    readonly scaleIndex = new ObservableValueImpl<ScaleIndex>(3)
    readonly chained = new ObservableValueImpl<boolean>(false)

    private readonly observable
    private readonly listener: () => void
    private readonly steps: Step[][]
    private readonly totalAccents: boolean[]
    private readonly shuffle: Shuffle

    constructor(readonly location: PatternLocation) {
        this.observable = this.terminator.with(new ObservableImpl<void>())
        this.listener = () => this.observable.notify()
        this.steps = ArrayUtils.fill(ChannelIndex.End, () => ArrayUtils.fill(16, () => Step.None))
        this.totalAccents = ArrayUtils.fill(16, () => false)
        this.shuffle = this.terminator.with(new Shuffle(this.shuffleIndex, this.scaleIndex))

        this.terminator.with(this.scaleIndex.addObserver(this.listener, false))
        this.terminator.with(this.lastStep.addObserver(this.listener, false))
        this.terminator.with(this.flamIndex.addObserver(this.listener, false))
        this.terminator.with(this.shuffleIndex.addObserver(this.listener, false))
        this.terminator.with(this.chained.addObserver(this.listener, false))
    }

    testA() {
        this.observable.mute()
        for (let i = 0; i < 16; i++) {
            if ((i + 2) % 4 !== 0) {
                this.setStep(ChannelIndex.Hihat, i, Step.Full)
            } else {
                this.setStep(ChannelIndex.Hihat, i, Step.Extra)
            }
            if (i % 4 === 0) {
                this.setStep(ChannelIndex.Bassdrum, i, Step.Full)
            }
        }
        this.setStep(ChannelIndex.Bassdrum, 15, Step.Extra)
        this.setStep(ChannelIndex.Clap, 4, Step.Full)
        this.setStep(ChannelIndex.Clap, 12, Step.Full)
        this.observable.unmute()
        this.observable.notify()
    }

    testB(): void {
        this.observable.mute()
        for (let i = 0; i < 16; i++) {
            if ((i + 2) % 4 !== 0) {
                this.setStep(ChannelIndex.Hihat, i, Step.Full)
            } else {
                this.setStep(ChannelIndex.Hihat, i, Step.Extra)
            }
        }
        this.setStep(ChannelIndex.Rim, 4, Step.Full)
        this.setStep(ChannelIndex.Rim, 12, Step.Full)
        this.observable.unmute()
        this.observable.notify()
    }

    testC(): void {
        this.observable.mute()
        for (let i = 0; i < 16; i++) {
            this.setStep(ChannelIndex.Hihat, i, Step.Full)
        }
        this.setStep(ChannelIndex.Clap, 4, Step.Full)
        this.setStep(ChannelIndex.Clap, 12, Step.Full)
        this.scaleIndex.set(2)
        this.shuffleIndex.set(6)
        this.observable.unmute()
        this.observable.notify()
    }

    testD(): void {
        this.observable.mute()
        for (let i = 0; i < 16; i++) {
            this.setStep(ChannelIndex.Hihat, i, Step.Full)
        }
        this.setStep(ChannelIndex.Clap, 4, Step.Full)
        this.setStep(ChannelIndex.Clap, 12, Step.Full)
        this.setStep(ChannelIndex.Clap, 15, Step.Weak)
        this.shuffleIndex.set(6)
        this.lastStep.set(6)
        this.observable.unmute()
        this.observable.notify()
    }

    setStep(channelIndex: ChannelIndex, stepIndex: number, step: Step): void {
        console.assert(0 <= channelIndex && channelIndex < ChannelIndex.End)
        console.assert(0 <= stepIndex && stepIndex < 16)
        if (this.steps[channelIndex][stepIndex] === step) {
            return
        }
        this.steps[channelIndex][stepIndex] = step
        this.observable.notify()
    }

    getStep(channelIndex: ChannelIndex, stepIndex: number): Step {
        console.assert(0 <= channelIndex && channelIndex < ChannelIndex.End)
        console.assert(0 <= stepIndex && stepIndex < 16)
        return this.steps[channelIndex][stepIndex]
    }

    setTotalAccent(stepIndex: number, active: boolean): void {
        console.assert(0 <= stepIndex && stepIndex < 16)
        this.totalAccents[stepIndex] = active
        this.observable.notify()
    }

    isTotalAccent(stepIndex: number): boolean {
        console.assert(0 <= stepIndex && stepIndex < 16)
        return this.totalAccents[stepIndex]
    }

    cycleToNextScale(): void {
        this.scaleIndex.set((this.scaleIndex.get() + 5) % 4 as ScaleIndex)
    }

    duration(): number {
        return this.lastStep.get() * this.scaleRatio()
    }

    scaleRatio(): number {
        return Pattern.ScaleRatios[this.scaleIndex.get()]
    }

    clear() {
        console.debug('clear pattern')
        this.observable.mute()
        this.steps.forEach(steps => steps.fill(Step.None))
        this.totalAccents.fill(false)
        this.scaleIndex.set(3)
        this.lastStep.set(16)
        this.shuffleIndex.set(0)
        this.flamIndex.set(0)
        this.observable.unmute()
        this.observable.notify()
    }

    serialize(): PatternFormat {
        console.debug('serialize pattern')
        return {
            steps: this.steps,
            totalAccents: this.totalAccents,
            scaleIndex: this.scaleIndex.get(),
            flamIndex: this.flamIndex.get(),
            lastStep: this.lastStep.get(),
            shuffleIndex: this.shuffleIndex.get(),
            chained: this.chained.get()
        }
    }

    deserialize(format: PatternFormat): void {
        console.debug('deserialize pattern')
        this.observable.mute()
        format.steps.forEach((steps: Step[], channel: number) =>
            steps.forEach((step: Step, stepIndex: number) =>
                this.steps[channel][stepIndex] = step))
        this.totalAccents.splice(0, 16, ...format.totalAccents)
        this.lastStep.set(format.lastStep)
        this.scaleIndex.set(format.scaleIndex)
        this.flamIndex.set(format.flamIndex)
        this.shuffleIndex.set(format.shuffleIndex)
        this.chained.set(format.chained)
        this.observable.unmute()
        this.observable.notify()
    }

    addObserver(observer: Observer<void>, notify: boolean): Terminable {
        if (notify) observer()
        return this.observable.addObserver(observer)
    }

    shuffleInverse(position: number): number {
        return this.shuffle.inverse(position)
    }

    shuffleTransform(position: number): number {
        return this.shuffle.transform(position)
    }

    terminate(): void {
        this.terminator.terminate()
    }
}

class Shuffle implements Terminable {
    static computeExponent(shuffleIndex: ObservableValueImpl<ShuffleIndex>): number {
        return Math.log(0.5) / Math.log(0.5 + Pattern.ShuffleDelays[shuffleIndex.get()])
    }

    private readonly terminator: Terminator = new Terminator()

    private enabled: boolean = false
    private exponent: number = 1.0
    private duration: number = 1.0 / 8.0

    constructor(shuffleIndex: ObservableValueImpl<ShuffleIndex>,
                scale: ObservableValueImpl<ScaleIndex>) {
        const update = () => {
            switch (scale.get()) {
                case 0: // N6D16
                case 1: { // N3D8
                    this.enabled = false
                    this.exponent = 1.0
                    this.duration = 1.0 / 8.0
                    return
                }
                case 2: { // D32
                    this.enabled = true
                    this.exponent = Shuffle.computeExponent(shuffleIndex)
                    this.duration = 1.0 / 16.0
                    return
                }
                case 3: { // D16
                    this.enabled = true
                    this.exponent = Shuffle.computeExponent(shuffleIndex)
                    this.duration = 1.0 / 8.0
                    return
                }
            }
        }
        this.terminator.with(shuffleIndex.addObserver(update, false))
        this.terminator.with(scale.addObserver(update, false))
    }

    inverse(position: number): number {
        return this.enabled ? this.map(position, this.exponent) : position
    }

    transform(position: number): number {
        return this.enabled ? this.map(position, 1.0 / this.exponent) : position
    }

    terminate() {
        this.terminator.terminate()
    }

    private map(position: number, exponent: number): number {
        const duration = this.duration
        const start = Math.floor(position / duration) * duration
        const normalized = (position - start) / duration
        const transformed = Math.pow(normalized, exponent)
        return start + transformed * duration
    }
}