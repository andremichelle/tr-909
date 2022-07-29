import {Pattern} from "./pattern.js"

export interface StepSequencerEnv {
    onStep(stepIndex: number, position: number): void

    nextPattern(): Pattern | null
}

export class StepSequencer {
    private pattern: Pattern
    private position: number = 0.0
    private stepIndex: number = 0 | 0

    constructor(private readonly env: StepSequencerEnv) {
    }

    // Patterns in TR-909 are always starting from phase zero
    // example with pattern duration = 1.0
    // 0.8...0.9 > [0.8...0.9]
    // 0.9...1.1 > [0.9...1.0 | next pattern | 0.0...0.1]

    sequence(increment: number): void {
        if (this.stepIndex === 0) {
            console.assert(this.position === 0.0) // only possible on begin condition
            this.pattern = this.env.nextPattern()
            if (this.pattern !== null) {
                this.env.onStep(this.stepIndex, this.position)
            }
            this.stepIndex++ // we increase step-index to leave start condition
        }
        if (this.pattern === null) {
            return
        }
        const p0 = this.position
        const p1 = p0 + increment
        const duration = this.pattern.duration()
        if (p1 >= duration) {
            this.sequenceSection(p0, duration, 0.0)
            this.position = 0.0
            this.stepIndex = 0 | 0
            this.pattern = this.env.nextPattern()
            this.sequenceSection(0.0, p1 - duration, duration)
            this.position = p1 - duration
        } else {
            this.sequenceSection(p0, p1, 0.0)
            this.position = p1
        }
    }

    private sequenceSection(p0: number, p1: number, delta: number): void {
        const scale = this.pattern.scale.get().value()
        const searchStart = this.pattern.shuffleInverse(p0)
        const searchLimit = this.pattern.shuffleInverse(p1)
        let searchIndex = this.stepIndex
        let searchPosition = searchIndex * scale
        while (searchPosition < searchLimit) {
            if (searchPosition >= searchStart) {
                this.env.onStep(this.stepIndex, this.pattern.shuffleTransform(searchPosition) + delta)
                this.stepIndex++
            }
            searchPosition = ++searchIndex * scale
        }
    }
}