import {BankIndex} from "./memory.js"
import {ChannelIndex, PatternFormat, PatternLocation, Step} from "./pattern.js"
import {Resources} from "./resources.js"
import {StateFormat} from "./state.js"
import {TrackFormat} from "./track.js"

export type ToWorkletMessage =
    | { type: "update-parameter", path: string[], unipolar: number }
    | { type: "update-memory-state", format: StateFormat }
    | { type: "update-track", bankIndex: BankIndex, arrayIndex: number, format: TrackFormat }
    | { type: "update-pattern", bankIndex: BankIndex, location: PatternLocation, format: PatternFormat }
    | { type: "play-channel", channelIndex: ChannelIndex, step: Step }

export type ToMainMessage =
    | { type: "update-step", stepIndex: number }
    | { type: "update-track-measure", measure: number }

export type ProcessorOptions = { resources: Resources }