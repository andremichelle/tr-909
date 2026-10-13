import {int, isDefined, Nullable} from "@opendaw/lib-std"
import {RENDER_QUANTUM} from "../common"
import {ChannelIndex, Step} from "../memory"
import {Voice} from "./voice"

type PlayEvent = { readonly frameIndex: int, readonly step: Step, readonly totalAccent: boolean }

export interface VoiceFactory {
    createVoice(channelIndex: ChannelIndex, step: Step, totalAccent: boolean): Voice
}

export class Channel {
    readonly #factory: VoiceFactory
    readonly #index: ChannelIndex
    readonly #events: Array<PlayEvent> = []
    readonly #processing: Array<Voice> = []

    #active: Nullable<Voice> = null

    constructor(factory: VoiceFactory, index: ChannelIndex) {
        this.#factory = factory
        this.#index = index
    }

    schedulePlay(frameIndex: number, step: Step, totalAccent: boolean): void {
        this.#events.push({frameIndex: Math.floor(frameIndex), step, totalAccent})
        if (this.#events.length > 1) {this.#events.sort((a, b) => a.frameIndex - b.frameIndex)}
    }

    process(output: Float32Array, from: int, to: int): void {
        let frameIndex = 0
        for (let event = this.#events.at(0); isDefined(event) && event.frameIndex < to; event = this.#events.at(0)) {
            this.#events.shift()
            const toFrame = Math.max(0, event.frameIndex - from)
            this.#advance(output, frameIndex, toFrame)
            this.#active?.stop()
            const voice = this.#factory.createVoice(this.#index, event.step, event.totalAccent)
            this.#processing.push(voice)
            this.#active = voice
            frameIndex = toFrame
        }
        if (frameIndex < RENDER_QUANTUM) {this.#advance(output, frameIndex, RENDER_QUANTUM)}
    }

    #advance(output: Float32Array, from: int, to: int): void {
        let voiceIndex = this.#processing.length
        while (--voiceIndex > -1) {
            const voice = this.#processing[voiceIndex]
            if (!voice.process(output, from, to)) {
                voice.terminate()
                this.#processing.splice(voiceIndex, 1)
                if (this.#active === voice) {this.#active = null}
            }
        }
    }
}
