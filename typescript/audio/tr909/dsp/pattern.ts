import { Pattern, Track } from "../memory.js"
import { ToMainMessage } from "../messages.js"
import { State } from "../state.js"

export interface PatternProvider {
    readonly state: State

    pattern(): Pattern | null

    next(): void

    reevaluate(): void

    setTrackMeasure(measure: number): void
}

export class UserPatternSelect implements PatternProvider {
    private current: Pattern | null
    private waiting: Pattern | null = null
    private respectChain: boolean = false

    constructor(readonly state: State, private readonly port: MessagePort, private readonly isMoving: () => boolean) {
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

    // 0  1  2  3  4
    // +  +  +
    // |----------<
    next(): void {
        const current = this.current
        if (current === null) {
            this.respectChain = false
            return
        }
        if (this.waiting === null) {
            if (this.respectChain) {
                const bank = this.state.activeBank()
                if (bank.isChained(current)) {
                    this.current = bank.nextPattern(current)
                } else {
                    this.current = bank.firstOfChained(current)
                }
            } else {
                this.respectChain = true
            }
        } else {
            this.current = this.waiting
            this.respectChain = true
            this.waiting = null
        }
        if (current !== this.current && this.current !== null) {
            this.port.postMessage({ type: "update-pattern", location: this.current.location } as ToMainMessage)
        }
    }

    reevaluate(): void {
        // nothing to do
    }

    setTrackMeasure(measure: number): void {
        // nothing to do
    }
}

export class TrackPatternPlay implements PatternProvider {
    private measure: number = 0
    private current: Pattern | null = null

    constructor(readonly state: State, private readonly port: MessagePort) {
        this.reevaluate()
    }

    pattern(): Pattern | null {
        return this.current
    }

    next(): void {
        const track: Track = this.state.activeTrack()
        let increment: boolean = false
        if (track.isEmpty()) {
            this.measure = -1
            this.current = null
        } else {
            const memoryBank = this.state.activeBank()
            console.assert(this.measure >= 0)
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
                    this.postTrackComplete()
                    return
                }
            }
        }
        this.postUpdateTrackMeasure()
        if (increment) {
            this.measure++
        }
    }

    reevaluate(): void {
        const track = this.state.activeTrack()
        this.current = track.isEmpty()
            ? null
            : this.measure >= 0 && this.measure < track.size()
                ? this.state.activeBank().patternByLocation(track.get(this.measure))
                : null
    }

    setTrackMeasure(measure: number): void {
        console.debug("setTrackMeasure", measure)
        this.measure = measure
        this.reevaluate()
    }

    private postUpdateTrackMeasure() {
        this.port.postMessage({ type: "update-track-measure", measure: this.measure } as ToMainMessage)
    }

    private postTrackComplete() {
        this.port.postMessage({ type: "track-complete" } as ToMainMessage)
    }
}