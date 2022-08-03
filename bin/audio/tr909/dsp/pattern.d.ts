import { Pattern } from "../memory.js";
import { State } from "../state.js";
export interface PatternProvider {
    readonly state: State;
    pattern(): Pattern | null;
    next(): void;
    reevaluate(): void;
    setTrackMeasure(measure: number): void;
}
export declare class UserPatternSelect implements PatternProvider {
    readonly state: State;
    private readonly port;
    private readonly isMoving;
    private current;
    private waiting;
    private respectChain;
    constructor(state: State, port: MessagePort, isMoving: () => boolean);
    pattern(): Pattern | null;
    next(): void;
    reevaluate(): void;
    setTrackMeasure(measure: number): void;
}
export declare class TrackPatternPlay implements PatternProvider {
    readonly state: State;
    private readonly port;
    private measure;
    private current;
    constructor(state: State, port: MessagePort);
    pattern(): Pattern | null;
    next(): void;
    reevaluate(): void;
    setTrackMeasure(measure: number): void;
    private postUpdateTrackMeasure;
    private postTrackComplete;
}
