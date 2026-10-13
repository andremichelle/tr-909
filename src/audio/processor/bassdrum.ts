import {dbToGain, decibel, Interpolator} from "../common"
import {BassdrumPreset} from "../preset"
import {ResourceSampleRate} from "../resources"
import {isRunning, SilentGain, Voice} from "./voice"

export class BassdrumVoice extends Voice {
    static readonly ReleaseStartTime: number = 0.060
    static readonly FreqStart: number = 274.0
    static readonly FreqEnd: number = 53.0

    readonly #cycle: Float32Array
    readonly #attack: Float32Array
    readonly #gainInterpolator: Interpolator
    readonly #attackGain: number
    readonly #attackRate: number

    #gainEnvelope: number = 1.0
    #gainCoefficient: number = 1.0
    #freqEnvelope: number = BassdrumVoice.FreqStart
    #freqCoefficient: number = 1.0
    #time: number = 0.0
    #phase: number = 0.0
    #attackPosition: number = 0.0

    constructor(resources: { attack: Float32Array, cycle: Float32Array }, preset: BassdrumPreset, sampleRate: number, level: decibel) {
        super(sampleRate)
        this.#cycle = resources.cycle
        this.#attack = resources.attack
        this.#gainInterpolator = new Interpolator(sampleRate)
        this.#gainInterpolator.set(0.0, false)
        this.terminator.ownAll(
            preset.level.catchupAndSubscribe(owner => this.#gainInterpolator.set(dbToGain(owner.getValue() + level), true)),
            preset.decay.catchupAndSubscribe(owner => this.#gainCoefficient = Math.exp(-1.0 / (sampleRate * owner.getValue()))),
            preset.tune.catchupAndSubscribe(owner => this.#freqCoefficient = Math.exp(-1.0 / (sampleRate * owner.getValue())))
        )
        this.#attackGain = dbToGain(preset.attack.getValue() + preset.level.getValue() + level)
        this.#attackRate = ResourceSampleRate / sampleRate
    }

    stop(): void {
        this.#gainInterpolator.set(0.0, true)
        this.terminate()
    }

    process(output: Float32Array, from: number, to: number): isRunning {
        const cycle = this.#cycle
        const attack = this.#attack
        for (let i = from; i < to; i++) {
            if (this.#time > BassdrumVoice.ReleaseStartTime) {this.#gainEnvelope *= this.#gainCoefficient}
            const pos = this.#phase * cycle.length
            const posInt = Math.floor(pos)
            const alpha = pos - posInt
            const c0 = cycle[posInt % cycle.length]
            const value = c0 + alpha * (cycle[(posInt + 1) % cycle.length] - c0)
            output[i] += value * this.#gainEnvelope * this.#gainInterpolator.moveAndGet()
            if (this.#attackPosition < attack.length - 1) {
                const pi = this.#attackPosition | 0
                const a0 = attack[pi]
                output[i] += (a0 + (this.#attackPosition - pi) * (attack[pi + 1] - a0)) * this.#attackGain
                this.#attackPosition += this.#attackRate
            }
            this.#time += this.sampleRateInv
            this.#phase += this.#freqEnvelope * this.sampleRateInv
            this.#phase -= Math.floor(this.#phase)
            this.#freqEnvelope = BassdrumVoice.FreqEnd + this.#freqCoefficient * (this.#freqEnvelope - BassdrumVoice.FreqEnd)
        }
        return this.#gainEnvelope > SilentGain && !this.#gainInterpolator.equals(0.0)
    }
}
