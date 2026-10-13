import {int, isDefined, Nullable} from "@opendaw/lib-std"
import {Pattern} from "../memory"

export interface StepSequencerEnvironment {
    currentPattern(): Nullable<Pattern>
    onPatternStep(pattern: Pattern, stepIndex: int, position: number): void
    onRoundStep(stepIndex: int): void
    nextPattern(): void
}

// TR-909 patterns always start from phase zero
export class StepSequencer {
    readonly #environment: StepSequencerEnvironment

    #firstRun: boolean = true
    #position: number = 0.0

    constructor(environment: StepSequencerEnvironment) {this.#environment = environment}

    sequence(increment: number): void {
        const environment = this.#environment
        if (this.#firstRun) {
            environment.nextPattern()
            const first = environment.currentPattern()
            if (isDefined(first)) {environment.onPatternStep(first, 0, 0.0)}
            this.#firstRun = false
        }
        let pattern = environment.currentPattern()
        if (!isDefined(pattern)) {return}
        const p0 = this.#position
        const p1 = p0 + increment
        const duration = pattern.duration()
        if (p1 >= duration) {
            this.#sequenceSection(pattern, p0, duration)
            this.#position = 0.0
            environment.nextPattern()
            pattern = environment.currentPattern()
            if (isDefined(pattern)) {
                const target = p1 % duration
                this.#sequenceSection(pattern, this.#position, target)
                this.#position = target
            }
        } else {
            this.#sequenceSection(pattern, p0, p1)
            this.#position = p1
        }
    }

    rewind(): void {
        this.#firstRun = true
        this.#position = 0.0
    }

    #sequenceSection(pattern: Pattern, p0: number, p1: number): void {
        const scale = pattern.scaleRatio()
        const lastStep = pattern.lastStep.getValue()
        this.#search(pattern, p0, p1, scale, (index, position) =>
            this.#environment.onPatternStep(pattern, index, pattern.shuffleTransform(position) - p0))
        const shift = scale * 0.5
        this.#search(pattern, p0 + shift, p1 + shift, scale, index =>
            this.#environment.onRoundStep((index + lastStep) % lastStep))
    }

    #search(pattern: Pattern, p0: number, p1: number, scale: number, callback: (index: int, position: number) => void): void {
        const searchStart = pattern.shuffleInverse(p0)
        const searchLimit = pattern.shuffleInverse(p1)
        let searchIndex = Math.floor(searchStart / scale)
        let searchPosition = searchIndex * scale
        while (searchPosition < searchLimit) {
            if (searchPosition >= searchStart) {callback(searchIndex, searchPosition)}
            searchPosition = ++searchIndex * scale
        }
    }
}
