import { decibel } from "../../common.js";
import { CrashOrRidePreset, HihatPreset, RimOrClapPreset, TomPreset } from "../preset.js";
import { isRunning, Voice } from "./voice.js";
export declare class BasicTuneDecayVoice extends Voice {
    private readonly array;
    private readonly releaseStartFrame;
    private readonly gainInterpolator;
    private position;
    private frame;
    private rate;
    private envelope;
    private envelopeCoefficient;
    constructor(array: Float32Array, preset: TomPreset | RimOrClapPreset | HihatPreset | CrashOrRidePreset, sampleRate: number, releaseStartTime: number, level: decibel);
    stop(): void;
    process(output: Float32Array, from: number, to: number): isRunning;
}
