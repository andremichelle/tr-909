import { Pattern } from "../memory.js";
export interface StepSequencerEnvironment {
    currentPattern(): Pattern | null;
    onPatternStep(pattern: Pattern, stepIndex: number, position: number): void;
    nextPattern(): void;
}
export declare class StepSequencer {
    private readonly environment;
    private firstRun;
    private position;
    constructor(environment: StepSequencerEnvironment);
    sequence(increment: number): void;
    moveTo(position: number): void;
    private sequenceSection;
}
