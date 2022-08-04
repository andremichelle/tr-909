import { Observable, Observer, Serializer, Terminable } from "../../lib/common.js";
import { PatternLocation } from "./memory.js";
export declare class TrackFormat {
    sequence: PatternLocation[];
}
export declare class Track implements Serializer<TrackFormat>, Observable<void> {
    private readonly observable;
    private readonly sequence;
    addObserver(observer: Observer<void>, notify: boolean): Terminable;
    deserialize(format: TrackFormat): Serializer<TrackFormat>;
    serialize(): TrackFormat;
    writeLocation(location: PatternLocation, index?: number): void;
    get(index: number): PatternLocation;
    isEmpty(): boolean;
    nonEmpty(): boolean;
    clear(): void;
    size(): number;
    terminate(): void;
}
