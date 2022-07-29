import {Pattern} from "../pattern.js"
import {State} from "../state.js"
import {Track} from "../track.js"

export interface PatternProvider {
    readonly state: State

    pattern(): Pattern | null

    next(): void

    reevaluate(): void
}

export class UserPatternSelect implements PatternProvider {
    private current: Pattern
    private waiting: Pattern = null

    constructor(readonly state: State, private readonly isMoving: () => boolean) {
        this.current = this.state.activePattern()
        this.state.patternIndicesChangeNotification.addObserver((pattern: Pattern) => {
            if (this.isMoving()) {
                this.waiting = pattern
            } else {
                this.current = pattern
                this.waiting = null
            }
        })
    }

    pattern(): Pattern | null {
        return this.current
    }

    next(): void {
        if (this.waiting === null) return
        this.current = this.waiting
        this.waiting = null
    }

    reevaluate(): void {
        // nothing to do
    }
}

export class TrackPatternPlay implements PatternProvider {
    private index: number = 0
    private current: Pattern = null

    constructor(readonly state: State) {
        this.reevaluate()
    }

    pattern(): Pattern | null {
        return this.current
    }

    next(): void {
        const track: Track = this.state.activeTrack()
        if (track.isEmpty()) {
            this.index = 0
            this.current = null
        } else {
            const patterns = this.state.activeBank().patterns
            if (this.index < track.size()) {
                this.current = patterns[track.get(this.index++)]
            } else {
                if (this.state.cycleGuideMode.get()) {
                    this.index = 0
                    this.current = track.isEmpty() ? null : patterns[track.get(this.index++)]
                } else {
                    this.current = null
                }
            }
        }
    }

    reevaluate(): void {
        const track = this.state.activeTrack()
        const patterns = this.state.activeBank().patterns
        this.current = track.isEmpty()
            ? null
            : this.index < track.size()
                ? patterns[track.get(this.index)]
                : null
    }
}