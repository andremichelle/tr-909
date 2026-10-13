import {int, unitValue} from "@opendaw/lib-std"
import {BankIndex, ChannelIndex, PatternFormat, PatternGroupIndex, PatternLocation, Step, TrackFormat} from "./memory"
import {Resources} from "./resources"
import {StateFormat} from "./state"
import {TransportMessage} from "./transport"

export type ToWorkletMessage =
    | TransportMessage
    | { type: "update-parameter", path: string, unitValue: unitValue }
    | { type: "update-memory-state", format: StateFormat }
    | { type: "update-track-measure", measure: int }
    | { type: "update-track", bankIndex: BankIndex, arrayIndex: int, format: TrackFormat }
    | { type: "update-pattern", bankIndex: BankIndex, location: PatternLocation, format: PatternFormat }
    | { type: "update-pattern-group-chained", bankIndex: BankIndex, patternGroupIndex: PatternGroupIndex, chained: ReadonlyArray<boolean> }
    | { type: "play-channel", channelIndex: ChannelIndex, step: Step }
    | { type: "set-tap-mode", enabled: boolean }

export type ToMainMessage =
    | { type: "update-step", stepIndex: int }
    | { type: "update-track-measure", measure: int }
    | { type: "update-pattern", location: PatternLocation }
    | { type: "track-complete" }

export type ProcessorOptions = { resources: Resources<Float32Array> }

export const ProcessorName = "tr-909"
