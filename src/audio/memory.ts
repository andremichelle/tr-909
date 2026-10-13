import {Arrays, assert, DefaultObservableValue, int, Notifier, Nullable, Observer, Option, Subscription, Terminable, Terminator} from "@opendaw/lib-std"
import {State, StateFormat} from "./state"

export enum BankIndex {I, II}

export enum TrackIndex {I, II, III, IV}

export enum PatternGroupIndex {I, II, III}

export enum PatternIndex {
    Pattern1, Pattern2, Pattern3, Pattern4,
    Pattern5, Pattern6, Pattern7, Pattern8,
    Pattern9, Pattern10, Pattern11, Pattern12,
    Pattern13, Pattern14, Pattern15, Pattern16
}

// 'Extra' is 'Flam' for bassdrum, snaredrum and toms or 'Open' for hihat
export enum Step {None = 0, Weak = 1, Full = 2, Extra}

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

export interface MemoryFormat {
    state: StateFormat
    patterns: PatternGroupFormat[][]
}

export class Memory {
    static readonly MAX_MEASURES = 896

    readonly banks: [MemoryBank, MemoryBank]
    readonly state: State

    constructor() {
        this.banks = [new MemoryBank(), new MemoryBank()]
        this.state = new State(this)
    }

    availableMeasures(): int {
        return Memory.MAX_MEASURES - this.banks.reduce((count: int, bank: MemoryBank) =>
            count + bank.tracks.reduce((sum: int, track: Track) => sum + track.size(), 0), 0)
    }

    clear(): void {this.banks.forEach(bank => bank.clear())}

    hasAnyData(): boolean {
        return this.banks.some(bank => bank.patternGroups.some(group => group.patterns.some(pattern => pattern.hasAnyData())))
    }

    serialize(): MemoryFormat {
        return {
            state: this.state.serialize(),
            patterns: this.banks.map(bank => bank.patternGroups.map(group => group.serialize()))
        }
    }

    deserialize(format: MemoryFormat): this {
        this.state.deserialize(format.state)
        this.banks.forEach((bank: MemoryBank, bankIndex: BankIndex) => bank.patternGroups
            .forEach((group: PatternGroup, groupIndex: PatternGroupIndex) =>
                group.deserialize(format.patterns[bankIndex][groupIndex])))
        return this
    }
}

export class MemoryBank {
    static readonly NUM_TRACKS = 4
    static readonly NUM_PATTERN_GROUPS = 3

    readonly tracks: ReadonlyArray<Track>
    readonly patternGroups: ReadonlyArray<PatternGroup>

    constructor() {
        this.tracks = Arrays.create(() => new Track(), MemoryBank.NUM_TRACKS)
        this.patternGroups = Arrays.create((index: PatternGroupIndex) => new PatternGroup(index), MemoryBank.NUM_PATTERN_GROUPS)
    }

    isChained(pattern: Pattern): boolean {
        return this.patternGroups[pattern.location.patternGroupIndex].isChained(pattern.location.patternIndex)
    }

    firstOfChained(pattern: Pattern): Pattern {
        return this.patternGroups[pattern.location.patternGroupIndex].firstOfChained(pattern.location.patternIndex)
    }

    nextPattern(pattern: Pattern): Nullable<Pattern> {
        return this.patternGroups[pattern.location.patternGroupIndex].nextPattern(pattern.location.patternIndex)
    }

    patternByIndices(patternGroupIndex: PatternGroupIndex, patternIndex: PatternIndex): Pattern {
        return this.patternGroups[patternGroupIndex].patterns[patternIndex]
    }

    patternByLocation(location: PatternLocation): Pattern {
        return this.patternByIndices(location.patternGroupIndex, location.patternIndex)
    }

    clear(): void {
        this.tracks.forEach(track => track.clear())
        this.patternGroups.forEach(group => group.clear())
    }
}

export interface PatternGroupFormat {
    patterns: PatternFormat[]
    chained: boolean[]
}

export class PatternGroup implements Terminable {
    static readonly NUM_PATTERNS = 16

    readonly #notifier: Notifier<void>
    readonly #chained: boolean[]

    readonly patterns: ReadonlyArray<Pattern>

    constructor(patternGroupIndex: PatternGroupIndex) {
        this.#notifier = new Notifier<void>()
        this.#chained = new Array<boolean>(PatternGroup.NUM_PATTERNS - 1).fill(false)
        this.patterns = Arrays.create((patternIndex: PatternIndex) =>
            new Pattern({patternGroupIndex, patternIndex}), PatternGroup.NUM_PATTERNS)
    }

    getChained(): ReadonlyArray<boolean> {return this.#chained}

    writeChain(chained: ReadonlyArray<boolean>): void {
        assert(chained.length === PatternGroup.NUM_PATTERNS - 1, "Invalid chain length")
        if (this.#chained.some((chain: boolean, index: int) => chain !== chained[index])) {
            this.#chained.splice(0, this.#chained.length, ...chained)
            this.#notifier.notify()
        }
    }

    clearChains(): void {
        if (this.#chained.some(chain => chain)) {
            this.#chained.fill(false)
            this.#notifier.notify()
        }
    }

    isChained(patternIndex: PatternIndex): boolean {return this.#chained[patternIndex]}

    firstOfChained(patternIndex: int): Pattern {
        assert(patternIndex >= 0 && patternIndex < PatternGroup.NUM_PATTERNS, "Pattern index out of bounds")
        let index = patternIndex
        while (index > 0 && this.#chained[index - 1]) {index--}
        return this.patterns[index]
    }

    nextPattern(patternIndex: PatternIndex): Nullable<Pattern> {
        return patternIndex + 1 < PatternGroup.NUM_PATTERNS ? this.patterns[patternIndex + 1] : null
    }

    deserialize(format: PatternGroupFormat): this {
        this.patterns.forEach((pattern, index) => pattern.deserialize(format.patterns[index]))
        this.writeChain(format.chained)
        this.#notifier.notify()
        return this
    }

    serialize(): PatternGroupFormat {
        return {chained: this.#chained.slice(), patterns: this.patterns.map(pattern => pattern.serialize())}
    }

    subscribe(observer: Observer<void>): Subscription {return this.#notifier.subscribe(observer)}

    clear(): void {
        this.#chained.fill(false)
        this.patterns.forEach(pattern => pattern.clear())
    }

    terminate(): void {this.#notifier.terminate()}
}

export interface PatternFormat {
    steps: Step[][]
    totalAccents: boolean[]
    lastStep: int
    scaleIndex: ScaleIndex
    shuffleIndex: ShuffleIndex
    flamIndex: FlamIndex
}

export type PatternLocation = { readonly patternGroupIndex: PatternGroupIndex, readonly patternIndex: PatternIndex }

export class Pattern implements Terminable {
    // we divide by 32 instead of multiplying by 2/96 (too little shuffle by ear)
    static readonly ShuffleDelays: ReadonlyArray<number> = Arrays.create(index => index / 32, 7)
    static readonly FlamDelays: ReadonlyArray<number> = Arrays.create(index => 10 + index * 4, 8)
    static readonly ScaleRatios: ReadonlyArray<number> = [3.0 / 16.0, 3.0 / 32.0, 1.0 / 32.0, 1.0 / 16.0]

    readonly #terminator: Terminator
    readonly #notifier: Notifier<void>
    readonly #steps: Step[][]
    readonly #totalAccents: boolean[]
    readonly #shuffle: Shuffle

    readonly lastStep: DefaultObservableValue<int>
    readonly flamIndex: DefaultObservableValue<FlamIndex>
    readonly shuffleIndex: DefaultObservableValue<ShuffleIndex>
    readonly scaleIndex: DefaultObservableValue<ScaleIndex>

    #muted: boolean = false

    constructor(readonly location: PatternLocation) {
        this.#terminator = new Terminator()
        this.#notifier = this.#terminator.own(new Notifier<void>())
        this.#steps = Arrays.create(() => Arrays.create(() => Step.None, 16), ChannelIndex.End)
        this.#totalAccents = Arrays.create(() => false, 16)
        this.lastStep = this.#terminator.own(new DefaultObservableValue<int>(16))
        this.flamIndex = this.#terminator.own(new DefaultObservableValue<FlamIndex>(0))
        this.shuffleIndex = this.#terminator.own(new DefaultObservableValue<ShuffleIndex>(0))
        this.scaleIndex = this.#terminator.own(new DefaultObservableValue<ScaleIndex>(3))
        this.#shuffle = this.#terminator.own(new Shuffle(this.shuffleIndex, this.scaleIndex))
        const listener = () => this.#notify()
        this.#terminator.ownAll(
            this.scaleIndex.subscribe(listener),
            this.lastStep.subscribe(listener),
            this.flamIndex.subscribe(listener),
            this.shuffleIndex.subscribe(listener)
        )
    }

    hasAnyData(): boolean {return this.#steps.some(steps => steps.some(step => step !== Step.None))}

    setStep(channelIndex: ChannelIndex, stepIndex: int, step: Step): void {
        if (this.#steps[channelIndex][stepIndex] === step) {return}
        this.#steps[channelIndex][stepIndex] = step
        this.#notify()
    }

    getStep(channelIndex: ChannelIndex, stepIndex: int): Step {return this.#steps[channelIndex][stepIndex]}

    setTotalAccent(stepIndex: int, active: boolean): void {
        this.#totalAccents[stepIndex] = active
        this.#notify()
    }

    isTotalAccent(stepIndex: int): boolean {return this.#totalAccents[stepIndex]}

    cycleToNextScale(): void {this.scaleIndex.setValue((this.scaleIndex.getValue() + 5) % 4 as ScaleIndex)}

    duration(): number {return this.lastStep.getValue() * this.scaleRatio()}

    scaleRatio(): number {return Pattern.ScaleRatios[this.scaleIndex.getValue()]}

    clear(): void {
        this.#batch(() => {
            this.#steps.forEach(steps => steps.fill(Step.None))
            this.#totalAccents.fill(false)
            this.scaleIndex.setValue(3)
            this.lastStep.setValue(16)
            this.shuffleIndex.setValue(0)
            this.flamIndex.setValue(0)
        })
    }

    serialize(): PatternFormat {
        return {
            steps: this.#steps.map(steps => steps.slice()),
            totalAccents: this.#totalAccents.slice(),
            scaleIndex: this.scaleIndex.getValue(),
            flamIndex: this.flamIndex.getValue(),
            lastStep: this.lastStep.getValue(),
            shuffleIndex: this.shuffleIndex.getValue()
        }
    }

    deserialize(format: PatternFormat): this {
        this.#batch(() => {
            format.steps.forEach((steps: Step[], channel: int) =>
                steps.forEach((step: Step, stepIndex: int) => this.#steps[channel][stepIndex] = step))
            this.#totalAccents.splice(0, 16, ...format.totalAccents)
            this.lastStep.setValue(format.lastStep)
            this.scaleIndex.setValue(format.scaleIndex)
            this.flamIndex.setValue(format.flamIndex)
            this.shuffleIndex.setValue(format.shuffleIndex)
        })
        return this
    }

    subscribe(observer: Observer<void>): Subscription {return this.#notifier.subscribe(observer)}

    catchupAndSubscribe(observer: Observer<void>): Subscription {
        observer()
        return this.#notifier.subscribe(observer)
    }

    shuffleInverse(position: number): number {return this.#shuffle.inverse(position)}

    shuffleTransform(position: number): number {return this.#shuffle.transform(position)}

    terminate(): void {this.#terminator.terminate()}

    #batch(exec: () => void): void {
        this.#muted = true
        exec()
        this.#muted = false
        this.#notify()
    }

    #notify(): void {if (!this.#muted) {this.#notifier.notify()}}
}

class Shuffle implements Terminable {
    static computeExponent(shuffleIndex: ShuffleIndex): number {
        return Math.log(0.5) / Math.log(0.5 + Pattern.ShuffleDelays[shuffleIndex])
    }

    readonly #terminator: Terminator = new Terminator()

    #enabled: boolean = false
    #exponent: number = 1.0
    #duration: number = 1.0 / 8.0

    constructor(shuffleIndex: DefaultObservableValue<ShuffleIndex>, scale: DefaultObservableValue<ScaleIndex>) {
        const update = (): void => {
            switch (scale.getValue()) {
                case 0:
                case 1: {
                    this.#enabled = false
                    this.#exponent = 1.0
                    this.#duration = 1.0 / 8.0
                    return
                }
                case 2: {
                    this.#enabled = true
                    this.#exponent = Shuffle.computeExponent(shuffleIndex.getValue())
                    this.#duration = 1.0 / 16.0
                    return
                }
                case 3: {
                    this.#enabled = true
                    this.#exponent = Shuffle.computeExponent(shuffleIndex.getValue())
                    this.#duration = 1.0 / 8.0
                    return
                }
            }
        }
        this.#terminator.ownAll(shuffleIndex.subscribe(update), scale.subscribe(update))
    }

    inverse(position: number): number {return this.#enabled ? this.#map(position, this.#exponent) : position}

    transform(position: number): number {return this.#enabled ? this.#map(position, 1.0 / this.#exponent) : position}

    terminate(): void {this.#terminator.terminate()}

    #map(position: number, exponent: number): number {
        const duration = this.#duration
        const start = Math.floor(position / duration) * duration
        const normalized = (position - start) / duration
        return start + Math.pow(normalized, exponent) * duration
    }
}

export interface TrackFormat {
    sequence: PatternLocation[]
}

export class Track implements Terminable {
    readonly #notifier: Notifier<void> = new Notifier<void>()
    readonly #sequence: PatternLocation[] = []

    #tempoMemory: Option<number> = Option.None

    memorizeTempo(value: number): void {this.#tempoMemory = Option.wrap(value)}

    recallTempo(): Option<number> {return this.#tempoMemory}

    subscribe(observer: Observer<void>): Subscription {return this.#notifier.subscribe(observer)}

    deserialize(format: TrackFormat): this {
        this.#sequence.splice(0, this.#sequence.length, ...format.sequence)
        return this
    }

    serialize(): TrackFormat {return {sequence: this.#sequence.slice()}}

    writeLocation(location: PatternLocation, index: int = Number.MAX_SAFE_INTEGER): void {
        if (index >= this.#sequence.length) {
            this.#sequence.push(location)
        } else {
            this.#sequence[index] = location
        }
        this.#notifier.notify()
    }

    get(index: int): PatternLocation {return this.#sequence[index]}

    isEmpty(): boolean {return this.#sequence.length === 0}

    nonEmpty(): boolean {return this.#sequence.length > 0}

    clear(): void {
        if (this.nonEmpty()) {
            this.#sequence.length = 0
            this.#notifier.notify()
        }
    }

    size(): int {return this.#sequence.length}

    terminate(): void {this.#notifier.terminate()}
}
