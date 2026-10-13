import {int} from "@opendaw/lib-std"

export type decibel = number

export const RENDER_QUANTUM: int = 128 | 0
export const LOG_DB = Math.log(10.0) / 20.0
export const dbToGain = (db: decibel): number => Math.exp(db * LOG_DB)
export const numFramesToBars = (numFrames: number, bpm: number, sampleRate: number): number => (numFrames * bpm) / (sampleRate * 240.0)
export const secondsToBars = (seconds: number, bpm: number): number => (seconds * bpm) / 240.0
export const barsToNumFrames = (bars: number, bpm: number, sampleRate: number): number => (bars * sampleRate * 240.0) / bpm
export const barsToSeconds = (bars: number, bpm: number): number => (bars * 240.0) / bpm

export class Interpolator {
    static readonly DefaultSeconds = 0.007

    readonly #length: int

    #value: number = NaN
    #target: number = NaN
    #delta: number = 0.0
    #remaining: int = 0 | 0

    constructor(sampleRate: number) {this.#length = (Interpolator.DefaultSeconds * sampleRate) | 0}

    set(target: number, smooth: boolean): void {
        if (target === this.#value) {return}
        if (!smooth || isNaN(this.#value)) {
            this.#value = this.#target = target
            this.#delta = 0.0
            this.#remaining = 0 | 0
        } else {
            this.#target = target
            this.#delta = (target - this.#value) / this.#length
            this.#remaining = this.#length
        }
    }

    moveAndGet(): number {
        if (0 < this.#remaining) {
            this.#value += this.#delta
            if (0 === --this.#remaining) {
                this.#delta = 0.0
                this.#value = this.#target
            }
        }
        return this.#value
    }

    equals(value: number): boolean {return this.#value === value}
}
