import {ArrayUtils} from "../../lib/common.js"
import {Pattern} from "./pattern.js"
import {Track} from "./track.js"

export enum BankGroupIndex {I, II}

export enum TrackIndex {I, II, III, IV} // times 2 for each bank

export enum PatternGroupIndex {I, II, III} // times 2 for each bank

export enum PatternIndex {
    Pattern1, Pattern2, Pattern3, Pattern4,
    Pattern5, Pattern6, Pattern7, Pattern8,
    Pattern9, Pattern10, Pattern11, Pattern12,
    Pattern13, Pattern14, Pattern15, Pattern16,
}

export type Memory = [MemoryBank, MemoryBank]

export type PatternLocation = { patternGroupIndex: PatternGroupIndex, patternIndex: PatternIndex }

export class MemoryBank {
    static readonly NUM_TRACKS = 4
    static readonly NUM_PATTERN_GROUPS = 3
    static readonly NUM_PATTERNS = 16
    static readonly PATTERNS_COUNT = MemoryBank.NUM_PATTERNS * MemoryBank.NUM_PATTERN_GROUPS

    readonly tracks: Track[] = ArrayUtils.fill(MemoryBank.NUM_TRACKS, () => new Track())
    readonly patterns: Pattern[] = ArrayUtils.fill(MemoryBank.PATTERNS_COUNT, () => new Pattern())

    toIndex(patternGroupIndex: PatternGroupIndex, patternIndex: PatternIndex): number {
        return patternGroupIndex * MemoryBank.NUM_PATTERNS + patternIndex
    }

    indexOf(pattern: Pattern): number {
        const index = this.patterns.indexOf(pattern)
        console.assert(-1 < index)
        return index
    }

    patternBy(patternGroupIndex: PatternGroupIndex, patternIndex: PatternIndex): Pattern {
        return this.patterns[patternGroupIndex * MemoryBank.NUM_PATTERNS + patternIndex]
    }

    toLocation(pattern: Pattern | number): PatternLocation {
        if (pattern instanceof Pattern) {
            pattern = this.indexOf(pattern)
        }
        return {
            patternGroupIndex: Math.floor(pattern / MemoryBank.NUM_PATTERNS) % MemoryBank.NUM_PATTERN_GROUPS,
            patternIndex: pattern % MemoryBank.NUM_PATTERNS
        }
    }
}