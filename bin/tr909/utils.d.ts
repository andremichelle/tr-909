import { ChannelIndex, Pattern, Step } from "../audio/tr909/memory.js";
import { KeyState, MainKeyIndex } from "./keys.js";
export declare class InstrumentMode {
    readonly channelIndex: ChannelIndex | undefined;
    readonly extra: boolean;
    readonly name: string;
    static None: InstrumentMode;
    static Bassdrum: InstrumentMode;
    static BassdrumFlam: InstrumentMode;
    static Snaredrum: InstrumentMode;
    static SnaredrumFlam: InstrumentMode;
    static TomLow: InstrumentMode;
    static TomLowFlam: InstrumentMode;
    static TomMid: InstrumentMode;
    static TomMidFlam: InstrumentMode;
    static TomHi: InstrumentMode;
    static TomHiFlam: InstrumentMode;
    static Rim: InstrumentMode;
    static Clap: InstrumentMode;
    static HihatClosed: InstrumentMode;
    static HihatOpened: InstrumentMode;
    static Crash: InstrumentMode;
    static Ride: InstrumentMode;
    static TotalAccent: InstrumentMode;
    constructor(channelIndex: ChannelIndex | undefined, extra: boolean, name: string);
}
export declare class Utils {
    static buttonIndicesToInstrumentMode: (keyIndices: Set<MainKeyIndex>) => InstrumentMode;
    static keyIndexToPlayInstrument(keyIndex: MainKeyIndex, other: Set<MainKeyIndex>): {
        channelIndex: ChannelIndex;
        step: Step;
    };
    static setNextStepValue(pattern: Pattern, instrumentMode: InstrumentMode, stepIndex: number): void;
    static clearPatternStep(pattern: Pattern, instrumentMode: InstrumentMode, stepIndex: number): void;
    private static modifyPatternStep;
    static createStepToStateMapping(instrumentMode: InstrumentMode): (pattern: Pattern, keyIndex: MainKeyIndex) => KeyState;
    static instrumentModeToButtonStates(instrumentMode: InstrumentMode): (keyIndex: MainKeyIndex) => KeyState;
}
