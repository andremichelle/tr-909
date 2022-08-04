import { ChannelIndex, Step } from "../memory.js";
import { Voice } from "./voice.js";
export interface VoiceFactory {
    createVoice: (channelIndex: ChannelIndex, step: Step, totalAccent: boolean) => Voice;
}
export declare class Channel {
    private readonly factory;
    private readonly index;
    private readonly events;
    private readonly processing;
    constructor(factory: VoiceFactory, index: number);
    private active;
    schedulePlay(frameIndex: number, step: Step, totalAccent: boolean): void;
    process(output: Float32Array, from: number, to: number): void;
    private nextEvent;
    private advance;
}
