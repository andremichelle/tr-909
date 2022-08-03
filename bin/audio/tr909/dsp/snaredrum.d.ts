import { decibel } from "../../common.js";
import { SnaredrumPreset } from "../preset.js";
import { isRunning, Voice } from "./voice.js";
export declare class SnaredrumVoice extends Voice {
    private readonly gainInterpolator;
    private readonly tune;
    private readonly tuneRate;
    private readonly noise;
    private readonly noiseRate;
    private readonly initPhase;
    private tonePosition;
    private noisePosition;
    private noiseGain;
    private noiseGainCoefficient;
    constructor(resources: {
        tone: Float32Array;
        noise: Float32Array;
    }, preset: SnaredrumPreset, sampleRate: number, level: decibel);
    stop(): void;
    process(output: Float32Array, from: number, to: number): isRunning;
}
