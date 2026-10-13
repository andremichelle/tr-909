import {int, isDefined, Nullable, Subscription, Terminable} from "@opendaw/lib-std"
import {Pattern, Track} from "../memory"
import {ToMainMessage} from "../messages"
import {State} from "../state"

export interface PatternProvider extends Terminable {
    pattern(): Nullable<Pattern>
    next(): void
    reevaluate(): void
    setTrackMeasure(measure: int): void
}

export class UserPatternSelect implements PatternProvider {
    readonly #state: State
    readonly #port: MessagePort
    readonly #isMoving: () => boolean
    readonly #subscription: Subscription

    #current: Nullable<Pattern>
    #waiting: Nullable<Pattern> = null
    #respectChain: boolean = false

    constructor(state: State, port: MessagePort, isMoving: () => boolean) {
        this.#state = state
        this.#port = port
        this.#isMoving = isMoving
        this.#current = state.activePattern()
        this.#subscription = state.patternIndicesChangeNotification.subscribe((pattern: Pattern) => {
            if (this.#isMoving()) {
                this.#waiting = pattern
            } else {
                this.#current = pattern
                this.#waiting = null
            }
        })
    }

    pattern(): Nullable<Pattern> {return this.#current}

    next(): void {
        const current = this.#current
        if (!isDefined(current)) {
            this.#respectChain = false
            return
        }
        if (!isDefined(this.#waiting)) {
            if (this.#respectChain) {
                const bank = this.#state.activeBank()
                this.#current = bank.isChained(current) ? bank.nextPattern(current) : bank.firstOfChained(current)
            } else {
                this.#respectChain = true
            }
        } else {
            this.#current = this.#waiting
            this.#respectChain = true
            this.#waiting = null
        }
        if (current !== this.#current && isDefined(this.#current)) {
            this.#port.postMessage({type: "update-pattern", location: this.#current.location} satisfies ToMainMessage)
        }
    }

    reevaluate(): void {}

    setTrackMeasure(_measure: int): void {}

    terminate(): void {this.#subscription.terminate()}
}

export class TrackPatternPlay implements PatternProvider {
    readonly #state: State
    readonly #port: MessagePort

    #measure: int = 0
    #current: Nullable<Pattern> = null

    constructor(state: State, port: MessagePort) {
        this.#state = state
        this.#port = port
        this.reevaluate()
    }

    pattern(): Nullable<Pattern> {return this.#current}

    next(): void {
        const track: Track = this.#state.activeTrack()
        let increment: boolean = false
        if (track.isEmpty()) {
            this.#measure = -1
            this.#current = null
        } else {
            const memoryBank = this.#state.activeBank()
            if (this.#measure < track.size()) {
                this.#current = memoryBank.patternByLocation(track.get(this.#measure))
                increment = true
            } else if (this.#state.cycleGuideMode.getValue()) {
                this.#measure = 0
                this.#current = memoryBank.patternByLocation(track.get(this.#measure))
                increment = true
            } else {
                this.#measure = 0
                this.#current = null
                this.#port.postMessage({type: "track-complete"} satisfies ToMainMessage)
                return
            }
        }
        this.#port.postMessage({type: "update-track-measure", measure: this.#measure} satisfies ToMainMessage)
        if (increment) {this.#measure++}
    }

    reevaluate(): void {
        const track = this.#state.activeTrack()
        this.#current = track.nonEmpty() && this.#measure >= 0 && this.#measure < track.size()
            ? this.#state.activeBank().patternByLocation(track.get(this.#measure))
            : null
    }

    setTrackMeasure(measure: int): void {
        this.#measure = measure
        this.reevaluate()
    }

    terminate(): void {}
}
