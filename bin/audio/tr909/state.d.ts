import { ObservableImpl, ObservableValue, Serializer, Terminable } from "../../lib/common.js";
import { BankIndex, Memory, MemoryBank, Pattern, PatternGroup, PatternGroupIndex, PatternIndex, TrackIndex } from "./memory.js";
import { Track } from "./track.js";
export declare enum PlayMode {
    Track = 0,
    Pattern = 1
}
export interface StateFormat {
    bankGroupIndex: BankIndex;
    patternGroupIndex: PatternGroupIndex;
    patternIndex: PatternIndex;
    trackIndex: TrackIndex;
    cycleGuideMode: boolean;
    playMode: PlayMode;
}
export declare class State implements Serializer<StateFormat>, Terminable {
    readonly memory: Memory;
    private readonly terminator;
    readonly bankGroupIndex: ObservableValue<BankIndex>;
    readonly patternGroupIndex: ObservableValue<PatternGroupIndex>;
    readonly patternIndex: ObservableValue<PatternIndex>;
    readonly trackIndex: ObservableValue<TrackIndex>;
    readonly cycleGuideMode: ObservableValue<boolean>;
    readonly playMode: ObservableValue<PlayMode>;
    readonly changeNotification: ObservableImpl<void>;
    readonly patternIndicesChangeNotification: ObservableImpl<Pattern>;
    constructor(memory: Memory);
    activeBank(): MemoryBank;
    activePatternGroup(): PatternGroup;
    activePattern(): Pattern;
    activeTrack(): Track;
    deserialize(format: StateFormat): Serializer<StateFormat>;
    serialize(): StateFormat;
    terminate(): void;
    private readonly onChange;
    private readonly onPatternIndicesChange;
}
