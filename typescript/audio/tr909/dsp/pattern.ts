import {Pattern} from "../pattern.js"
import {State} from "../state.js"
import {Track} from "../track.js"

export interface PatternProvider {
    readonly state: State

    pattern(): Pattern | null

    nextPattern(): void

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

    nextPattern(): void {
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

    nextPattern(): void {
        const track: Track = this.state.activeTrack()
        if (++this.index >= track.size()) {
            if (this.state.cycleGuideMode.get()) {
                this.current = this.state.activeBank().patterns[track.get(this.index = 0)]
            } else {
                this.current = null
            }
        } else {
            this.current = this.state.activeBank().patterns[track.get(this.index)]
        }
    }

    reevaluate(): void {
        const track = this.state.activeTrack()
        const patterns = this.state.activeBank().patterns
        this.current = track.isEmpty() ? null : patterns[track.get(this.index)]
    }
}