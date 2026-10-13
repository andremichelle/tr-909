import {isDefined} from "@opendaw/lib-std"
import {dbToGain, decibel, Interpolator} from "../common"
import {BasicVoicePreset} from "../preset"
import {ResourceSampleRate} from "../resources"
import {isRunning, Voice} from "./voice"

export class BasicTuneDecayVoice extends Voice {
    readonly #array: Float32Array
    readonly #releaseStartFrame: number
    readonly #gainInterpolator: Interpolator

    #position: number = 0.0
    #frame: number = 0 | 0
    #rate: number
    #envelope: number = 1.0
    #envelopeCoefficient: number = 1.0

    constructor(array: Float32Array, preset: BasicVoicePreset, sampleRate: number, releaseStartTime: number, level: decibel) {
        super(sampleRate)
        this.#array = array
        this.#releaseStartFrame = (releaseStartTime * sampleRate) | 0
        this.#gainInterpolator = new Interpolator(sampleRate)
        this.#rate = ResourceSampleRate / sampleRate
        this.terminator.own(preset.level.catchupAndSubscribe(owner =>
            this.#gainInterpolator.set(dbToGain(owner.getValue() + level), true)))
        const {tune, decay} = preset
        if (isDefined(tune)) {
            this.terminator.own(tune.catchupAndSubscribe(owner =>
                this.#rate = ResourceSampleRate / sampleRate * Math.pow(2.0, owner.getValue())))
        }
        if (isDefined(decay)) {
            this.terminator.own(decay.catchupAndSubscribe(owner =>
                this.#envelopeCoefficient = Math.exp(-1.0 / (sampleRate * owner.getValue()))))
        }
    }

    stop(): void {
        this.#gainInterpolator.set(0.0, true)
        this.terminate()
    }

    process(output: Float32Array, from: number, to: number): isRunning {
        const array = this.#array
        for (let i = from; i < to; i++) {
            const pi = this.#position | 0
            if (pi >= array.length - 1) {return false}
            if (this.#frame++ >= this.#releaseStartFrame) {this.#envelope *= this.#envelopeCoefficient}
            const v0 = array[pi]
            const v1 = array[pi + 1]
            const alpha = this.#position - pi
            output[i] += (v0 + alpha * (v1 - v0)) * this.#envelope * this.#gainInterpolator.moveAndGet()
            this.#position += this.#rate
        }
        return !this.#gainInterpolator.equals(0.0)
    }
}
