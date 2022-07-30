import {ArrayUtils} from "../../lib/common.js"
import {Pattern, PatternLocation} from "./pattern.js"
import {State} from "./state.js"
import {Track} from "./track.js"

export enum BankIndex {I, II}

export enum TrackIndex {I, II, III, IV} // times 2 for each bank

export enum PatternGroupIndex {I, II, III} // times 2 for each bank

export enum PatternIndex {
    // noinspection JSUnusedGlobalSymbols
    Pattern1, Pattern2, Pattern3, Pattern4,
    Pattern5, Pattern6, Pattern7, Pattern8,
    Pattern9, Pattern10, Pattern11, Pattern12,
    Pattern13, Pattern14, Pattern15, Pattern16,
}

export class Memory {
    private static readonly MAX_MEASURES = 896

    readonly banks: [MemoryBank, MemoryBank] = [new MemoryBank(), new MemoryBank()]
    readonly state: State = new State(this)

    availableMeasures(): number {
        return Memory.MAX_MEASURES - this.banks.reduce((count: number, bank: MemoryBank) =>
            count + bank.tracks.reduce((count: number, track: Track) => count + track.size(), 0), 0)
    }
}

export class PatternGroup {
    static readonly NUM_PATTERNS = 16

    readonly patterns: ReadonlyArray<Pattern>

    constructor(patternGroupIndex: PatternGroupIndex) {
        this.patterns = ArrayUtils.fill(PatternGroup.NUM_PATTERNS,
            (patternIndex: PatternIndex) => new Pattern({patternGroupIndex, patternIndex}))
    }
}

export class MemoryBank {
    static readonly NUM_TRACKS = 4
    static readonly NUM_PATTERN_GROUPS = 3

    readonly tracks: ReadonlyArray<Track> = ArrayUtils.fill(MemoryBank.NUM_TRACKS, () => new Track())
    readonly patternGroups: ReadonlyArray<PatternGroup> = ArrayUtils.fill(MemoryBank.NUM_PATTERN_GROUPS,
        (index: PatternGroupIndex) => new PatternGroup(index))

    patternByIndices(patternGroupIndex: PatternGroupIndex, patternIndex: PatternIndex): Pattern {
        return this.patternGroups[patternGroupIndex].patterns[patternIndex]
    }

    patternByLocation(location: PatternLocation): Pattern {
        return this.patternByIndices(location.patternGroupIndex, location.patternIndex)
    }
}