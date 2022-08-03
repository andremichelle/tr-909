import { decibel } from "../../common.js";
import { BassdrumPreset } from "../preset.js";
import { isRunning, Voice } from "./voice.js";
export declare class BassdrumVoice extends Voice {
    private static ReleaseStartTime;
    private static FreqStart;
    private static FreqEnd;
    private readonly cycle;
    private readonly attack;
    private readonly gainInterpolator;
    private readonly attackGain;
    private readonly attackRate;
    private gainEnvelope;
    private gainCoefficient;
    private freqEnvelope;
    private freqCoefficient;
    private time;
    private phase;
    private attackPosition;
    constructor(resources: {
        attack: Float32Array;
        cycle: Float32Array;
    }, preset: BassdrumPreset, sampleRate: number, level: decibel);
    stop(): void;
    process(output: Float32Array, from: number, to: number): isRunning;
}
