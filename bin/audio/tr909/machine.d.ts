import { ObservableValueImpl, Terminable } from "../../lib/common.js";
import { Transport } from "../common.js";
import { MeterWorklet } from "../meter/worklet.js";
import { ChannelIndex, Memory, Step } from "./memory.js";
import { Preset } from "./preset.js";
import { Resources } from "./resources.js";
export declare class Machine implements Terminable {
    readonly context: any;
    static loadModule(context: AudioContext): Promise<void>;
    private readonly terminator;
    private readonly scheduleUpdates;
    private readonly bundledUpdates;
    private running;
    readonly worklet: AudioWorkletNode;
    readonly preset: Preset;
    readonly memory: Memory;
    readonly transport: Transport;
    readonly meterWorklet: MeterWorklet;
    readonly master: GainNode;
    readonly processorStepIndex: ObservableValueImpl<number>;
    readonly processorTrackMeasure: ObservableValueImpl<number>;
    constructor(context: any, resources: Resources<Float32Array>);
    stepAbsoluteDuration(): number;
    play(channelIndex: ChannelIndex, step: Step): void;
    terminate(): void;
    private bundledUpdate;
    private startScheduler;
}
