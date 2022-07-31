import {ToMainMessage} from "../messages.js"
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
        if (this.waiting === null) {
            if (this.current?.chained.get() === true) {
                this.current = this.state.activeBank().nextPattern(this.current)
            }
        } else {
            this.current = this.waiting
            this.waiting = null
        }
    }

    reevaluate(): void {
        // nothing to do
    }
}

export class TrackPatternPlay implements PatternProvider {
    private measure: number = 0
    private current: Pattern = null

    constructor(readonly state: State, readonly port: MessagePort) {
        this.reevaluate()
    }

    pattern(): Pattern | null {
        return this.current
    }

    next(): void {
        const track: Track = this.state.activeTrack()
        let increment: boolean = false
        if (track.isEmpty()) {
            this.measure = 0
            this.current = null
        } else {
            const memoryBank = this.state.activeBank()
            if (this.measure < track.size()) {
                this.current = memoryBank.patternByLocation(track.get(this.measure))
                increment = true
            } else {
                if (this.state.cycleGuideMode.get()) {
                    this.measure = 0
                    this.current = track.isEmpty() ? null : memoryBank.patternByLocation(track.get(this.measure))
                    increment = true
                } else {
                    this.measure = 0
                    this.current = null
                }
            }
        }
        this.postMeasure()
        if (increment) {
            this.measure++
        }
    }

    reevaluate(): void {
        const track = this.state.activeTrack()
        this.current = track.isEmpty()
            ? null
            : this.measure < track.size()
                ? this.state.activeBank().patternByLocation(track.get(this.measure))
                : null
    }

    private postMeasure() {
        this.port.postMessage({type: "update-track-measure", measure: this.measure} as ToMainMessage)
    }
}