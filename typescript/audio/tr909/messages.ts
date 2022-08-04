import { BankIndex, ChannelIndex, PatternFormat, PatternGroupIndex, PatternLocation, Step } from "./memory.js"
import { Resources } from "./resources.js"
import { StateFormat } from "./state.js"
import { TrackFormat } from "./track.js"

export type ToWorkletMessage =
    | { type: 'update-parameter', path: string[], unipolar: number }
    | { type: 'update-memory-state', format: StateFormat }
    | { type: 'update-track-measure', measure: number }
    | { type: 'update-track', bankIndex: BankIndex, arrayIndex: number, format: TrackFormat }
    | { type: 'update-pattern', bankIndex: BankIndex, location: PatternLocation, format: PatternFormat }
    | { type: 'update-pattern-group-chained', bankIndex: BankIndex, patternGroupIndex: PatternGroupIndex, chained: boolean[] }
    | { type: 'play-channel', channelIndex: ChannelIndex, step: Step }
    | { type: 'set-tap-mode', enabled: boolean }

export type ToMainMessage =
    | { type: 'update-step', stepIndex: number }
    | { type: 'update-track-measure', measure: number }
    | { type: 'update-pattern', location: PatternLocation }
    | { type: 'track-complete' }

export type ProcessorOptions = { resources: Resources<Float32Array> }