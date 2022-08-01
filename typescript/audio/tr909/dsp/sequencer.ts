import {ifDefined} from "../../../lib/common.js"
import {Pattern} from "../memory.js"

export interface StepSequencerEnv {
    currentPattern(): Pattern | null

    onPatternStep(pattern: Pattern, stepIndex: number, position: number): void

    nextPattern(): void
}

export class StepSequencer {
    private firstRun: boolean = true
    private position: number = 0.0

    constructor(private readonly environment: StepSequencerEnv) {
    }

    // Patterns in TR-909 are always starting from phase zero
    // example with pattern duration = 1.0
    // 0.8...0.9 > [0.8...0.9]
    // 0.9...1.1 > [0.9...1.0 | next pattern | 0.0...0.1]
    sequence(increment: number): void {
        const env: StepSequencerEnv = this.environment
        if (this.firstRun) {
            console.assert(this.position === 0.0) // only possible on begin condition
            env.nextPattern()
            ifDefined(env.currentPattern(), pattern => env.onPatternStep(pattern, 0, 0.0))
            this.firstRun = false
        }
        if (env.currentPattern() === null) {
            return
        }
        const p0 = this.position
        const p1 = p0 + increment
        const duration = env.currentPattern().duration()
        if (p1 >= duration) {
            this.sequenceSection(p0, duration)
            this.position = 0.0
            env.nextPattern()
            if (env.currentPattern() === null) {
                this.position = 0.0
            } else {
                this.sequenceSection(0.0, p1 - duration)
                this.position = p1 - duration
            }
        } else {
            this.sequenceSection(p0, p1)
            this.position = p1
        }
    }

    moveTo(position: number): void {
        this.position = position
    }

    reset(): void {
        this.firstRun = true
        this.position = 0.0
    }

    private sequenceSection(p0: number, p1: number): void {
        const pattern = this.environment.currentPattern()
        const scale = pattern.scaleRatio()
        const searchStart = pattern.shuffleInverse(p0)
        const searchLimit = pattern.shuffleInverse(p1)
        let searchIndex = Math.floor(searchStart / scale)
        let searchPosition = searchIndex * scale
        while (searchPosition < searchLimit) {
            if (searchPosition >= searchStart) {
                this.environment.onPatternStep(pattern, searchIndex, pattern.shuffleTransform(searchPosition) - p0)
            }
            searchPosition = ++searchIndex * scale
        }
    }
}