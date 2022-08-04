import { Boot } from "../../lib/boot.js";
export declare const ResourceSampleRate = 44100;
export declare type Resources<T> = {
    bassdrum: {
        attack: T;
        cycle: T;
    };
    snaredrum: {
        tone: T;
        noise: T;
    };
    tomLow: T;
    tomMid: T;
    tomHi: T;
    rim: T;
    clap: T;
    closedHihat: T;
    openedHihat: T;
    crash: T;
    ride: T;
};
export declare const loadResources: (boot: Boot) => () => Resources<Float32Array>;
