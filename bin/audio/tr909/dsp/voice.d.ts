import { Terminable, Terminator } from "../../../lib/common.js";
export declare const SilentGain: number;
export declare type isRunning = boolean;
export declare abstract class Voice implements Terminable {
    readonly sampleRate: number;
    protected readonly terminator: Terminator;
    protected readonly sampleRateInv: number;
    protected constructor(sampleRate: number);
    abstract stop(): void;
    abstract process(output: Float32Array, from: number, to: number): isRunning;
    terminate(): void;
}
