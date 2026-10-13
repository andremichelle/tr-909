import {dbToGain, decibel, Interpolator} from "../common"
import {SnaredrumPreset} from "../preset"
import {ResourceSampleRate} from "../resources"
import {isRunning, SilentGain, Voice} from "./voice"

export class SnaredrumVoice extends Voice {
    readonly #gainInterpolator: Interpolator
    readonly #tone: Float32Array
    readonly #toneRate: number
    readonly #noise: Float32Array
    readonly #noiseRate: number

    #tonePosition: number = 0.0
    #noisePosition: number = 0.0
    #noiseGain: number
    #noiseGainCoefficient: number = 1.0

    constructor(resources: { tone: Float32Array, noise: Float32Array }, preset: SnaredrumPreset, sampleRate: number, level: decibel) {
        super(sampleRate)
        this.#tone = resources.tone
        this.#noise = resources.noise
        this.#toneRate = ResourceSampleRate * this.sampleRateInv * Math.pow(2.0, preset.tune.getValue())
        this.#noiseRate = ResourceSampleRate * this.sampleRateInv
        this.#noiseGain = dbToGain(preset.snappy.getValue())
        this.#gainInterpolator = new Interpolator(sampleRate)
        let initPhase = true
        this.terminator.ownAll(
            preset.level.catchupAndSubscribe(owner => this.#gainInterpolator.set(dbToGain(owner.getValue() + level), !initPhase)),
            preset.tone.catchupAndSubscribe(owner => this.#noiseGainCoefficient = Math.exp(-1.0 / (sampleRate * owner.getValue())))
        )
        initPhase = false
    }

    stop(): void {
        this.#gainInterpolator.set(0.0, true)
        this.terminate()
    }

    process(output: Float32Array, from: number, to: number): isRunning {
        const tone = this.#tone
        const noise = this.#noise
        for (let i = from; i < to; i++) {
            const gain = this.#gainInterpolator.moveAndGet()
            const ti = this.#tonePosition | 0
            if (ti < tone.length - 1) {
                const t0 = tone[ti]
                output[i] += (t0 + (this.#tonePosition - ti) * (tone[ti + 1] - t0)) * gain
                this.#tonePosition += this.#toneRate
            }
            const ni = this.#noisePosition | 0
            if (ni < noise.length - 1) {
                const n0 = noise[ni]
                output[i] += (n0 + (this.#noisePosition - ni) * (noise[ni + 1] - n0)) * gain * this.#noiseGain
                this.#noiseGain *= this.#noiseGainCoefficient
                this.#noisePosition += this.#noiseRate
            } else {
                return false
            }
        }
        return !(this.#gainInterpolator.equals(0.0) || this.#noiseGain < SilentGain)
    }
}
