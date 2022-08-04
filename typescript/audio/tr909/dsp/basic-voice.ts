import { dbToGain, decibel, Interpolator } from "../../common.js"
import { CrashOrRidePreset, HihatPreset, RimOrClapPreset, TomPreset } from "../preset.js"
import { ResourceSampleRate } from "../resources.js"
import { isRunning, Voice } from "./voice.js"

export class BasicTuneDecayVoice extends Voice {
    private readonly releaseStartFrame: number
    private readonly gainInterpolator: Interpolator

    private position: number
    private frame: number
    private rate: number
    private envelope: number
    private envelopeCoefficient: number

    constructor(private readonly array: Float32Array,
        preset: TomPreset | RimOrClapPreset | HihatPreset | CrashOrRidePreset,
        sampleRate: number,
        releaseStartTime: number,
        level: decibel) {
        super(sampleRate)

        this.releaseStartFrame = (releaseStartTime * sampleRate) | 0
        this.gainInterpolator = new Interpolator(sampleRate)
        this.position = 0.0
        this.frame = 0 | 0
        this.rate = ResourceSampleRate / sampleRate
        this.envelope = 1.0
        this.envelopeCoefficient = 1.0
        this.terminator.with(preset.level.addObserver(value =>
            this.gainInterpolator.set(dbToGain(value + level), true), true))
        if ('tune' in preset) {
            this.terminator.with(preset.tune.addObserver(value =>
                this.rate = ResourceSampleRate / sampleRate * Math.pow(2.0, value), true))
        }
        if ('decay' in preset) {
            this.terminator.with(preset.decay.addObserver(value =>
                this.envelopeCoefficient = Math.exp(-1.0 / (sampleRate * value)), true))
        }
    }

    stop(): void {
        this.gainInterpolator.set(0.0, true)
        this.terminate()
    }

    process(output: Float32Array, from: number, to: number): isRunning {
        for (let i = from; i < to; i++) {
            const pi = this.position | 0
            if (pi >= this.array.length - 1) {
                return false
            }
            if (this.frame++ >= this.releaseStartFrame) {
                this.envelope *= this.envelopeCoefficient
            }
            const v0 = this.array[pi]
            const v1 = this.array[pi + 1]
            const alpha = this.position - pi
            output[i] += (v0 + alpha * (v1 - v0)) * this.envelope * this.gainInterpolator.moveAndGet()
            this.position += this.rate
        }
        return !this.gainInterpolator.equals(0.0)
    }
}