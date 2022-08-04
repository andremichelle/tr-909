import { Observable, ObservableValueImpl, Observer, Serializer, Terminable } from "../../lib/common.js";
import { State } from "./state.js";
import { Track } from "./track.js";
export declare enum BankIndex {
    I = 0,
    II = 1
}
export declare enum TrackIndex {
    I = 0,
    II = 1,
    III = 2,
    IV = 3
}
export declare enum PatternGroupIndex {
    I = 0,
    II = 1,
    III = 2
}
export declare enum PatternIndex {
    Pattern1 = 0,
    Pattern2 = 1,
    Pattern3 = 2,
    Pattern4 = 3,
    Pattern5 = 4,
    Pattern6 = 5,
    Pattern7 = 6,
    Pattern8 = 7,
    Pattern9 = 8,
    Pattern10 = 9,
    Pattern11 = 10,
    Pattern12 = 11,
    Pattern13 = 12,
    Pattern14 = 13,
    Pattern15 = 14,
    Pattern16 = 15
}
export declare enum Step {
    None = 0,
    Weak = 1,
    Full = 2,
    Extra = 3
}
export declare type ScaleIndex = 0 | 1 | 2 | 3;
export declare type ShuffleIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export declare type FlamIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export declare enum ChannelIndex {
    Bassdrum = 0,
    Snaredrum = 1,
    TomLow = 2,
    TomMid = 3,
    TomHi = 4,
    Rim = 5,
    Clap = 6,
    Hihat = 7,
    Crash = 8,
    Ride = 9,
    End = 10
}
export declare class Memory {
    private static readonly MAX_MEASURES;
    readonly banks: [MemoryBank, MemoryBank];
    readonly state: State;
    availableMeasures(): number;
}
export declare class MemoryBank {
    static readonly NUM_TRACKS = 4;
    static readonly NUM_PATTERN_GROUPS = 3;
    readonly tracks: ReadonlyArray<Track>;
    readonly patternGroups: ReadonlyArray<PatternGroup>;
    constructor();
    isChained(pattern: Pattern): boolean;
    firstOfChained(pattern: Pattern): Pattern;
    nextPattern(pattern: Pattern): Pattern | null;
    patternByIndices(patternGroupIndex: PatternGroupIndex, patternIndex: PatternIndex): Pattern;
    patternByLocation(location: PatternLocation): Pattern;
}
export interface PatternGroupFormat {
    patterns: PatternFormat[];
    chained: boolean[];
}
export declare class PatternGroup implements Observable<void>, Serializer<PatternGroupFormat> {
    static readonly NUM_PATTERNS = 16;
    private readonly terminator;
    private readonly observable;
    private readonly chained;
    readonly patterns: ReadonlyArray<Pattern>;
    constructor(patternGroupIndex: PatternGroupIndex);
    getChained(): ReadonlyArray<boolean>;
    writeChain(chained: boolean[]): void;
    clearChains(): void;
    isChained(patternIndex: PatternIndex): boolean;
    firstOfChained(patternIndex: PatternIndex | number): Pattern;
    nextPattern(patternIndex: PatternIndex): Pattern | null;
    deserialize(format: PatternGroupFormat): this;
    serialize(): PatternGroupFormat;
    addObserver(observer: Observer<void>, notify: boolean): Terminable;
    terminate(): void;
}
export interface PatternFormat {
    steps: Step[][];
    totalAccents: boolean[];
    lastStep: number;
    scaleIndex: ScaleIndex;
    shuffleIndex: ShuffleIndex;
    flamIndex: FlamIndex;
}
export declare type PatternLocation = {
    readonly patternGroupIndex: PatternGroupIndex;
    readonly patternIndex: PatternIndex;
};
export declare class Pattern implements Observable<void>, Serializer<PatternFormat> {
    readonly location: PatternLocation;
    static readonly ShuffleDelays: number[];
    static readonly FlamDelays: number[];
    static readonly ScaleRatios: ReadonlyArray<number>;
    private readonly terminator;
    readonly lastStep: ObservableValueImpl<number>;
    readonly flamIndex: ObservableValueImpl<FlamIndex>;
    readonly shuffleIndex: ObservableValueImpl<ShuffleIndex>;
    readonly scaleIndex: ObservableValueImpl<ScaleIndex>;
    private readonly observable;
    private readonly listener;
    private readonly steps;
    private readonly totalAccents;
    private readonly shuffle;
    constructor(location: PatternLocation);
    testA(): void;
    testB(): void;
    testC(): void;
    testD(): void;
    setStep(channelIndex: ChannelIndex, stepIndex: number, step: Step): void;
    getStep(channelIndex: ChannelIndex, stepIndex: number): Step;
    setTotalAccent(stepIndex: number, active: boolean): void;
    isTotalAccent(stepIndex: number): boolean;
    cycleToNextScale(): void;
    duration(): number;
    scaleRatio(): number;
    clear(): void;
    serialize(): PatternFormat;
    deserialize(format: PatternFormat): Serializer<PatternFormat>;
    addObserver(observer: Observer<void>, notify: boolean): Terminable;
    shuffleInverse(position: number): number;
    shuffleTransform(position: number): number;
    terminate(): void;
}
