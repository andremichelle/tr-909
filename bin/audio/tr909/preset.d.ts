import { Option, Parameter, Terminable } from "../../lib/common.js";
export declare type BassdrumPreset = {
    tune: Parameter<number>;
    level: Parameter<number>;
    attack: Parameter<number>;
    decay: Parameter<number>;
};
export declare type SnaredrumPreset = {
    tune: Parameter<number>;
    level: Parameter<number>;
    tone: Parameter<number>;
    snappy: Parameter<number>;
};
export declare type TomPreset = {
    tune: Parameter<number>;
    level: Parameter<number>;
    decay: Parameter<number>;
};
export declare type RimOrClapPreset = {
    level: Parameter<number>;
};
export declare type HihatPreset = {
    level: Parameter<number>;
    decay: Parameter<number>;
};
export declare type CrashOrRidePreset = {
    level: Parameter<number>;
    tune: Parameter<number>;
};
export declare class Preset {
    readonly tempo: Parameter<number>;
    readonly volume: Parameter<number>;
    readonly accent: Parameter<number>;
    readonly bassdrum: Readonly<BassdrumPreset>;
    readonly snaredrum: Readonly<SnaredrumPreset>;
    readonly tomLow: Readonly<TomPreset>;
    readonly tomMid: Readonly<TomPreset>;
    readonly tomHi: Readonly<TomPreset>;
    readonly rim: Readonly<RimOrClapPreset>;
    readonly clap: Readonly<RimOrClapPreset>;
    readonly hihatLevel: Parameter<number>;
    readonly closedHihat: Readonly<HihatPreset>;
    readonly openedHihat: Readonly<HihatPreset>;
    readonly crash: Readonly<CrashOrRidePreset>;
    readonly ride: Readonly<CrashOrRidePreset>;
    constructor();
    observeAll(callback: (parameter: Parameter<any>, path: string[]) => void): Terminable;
    find(path: string[]): Option<Parameter<any>>;
}
