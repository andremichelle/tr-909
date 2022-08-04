import { RENDER_QUANTUM } from "../../common.js"
import { ChannelIndex, Step } from "../memory.js"
import { Voice } from "./voice.js"

class PlayEvent {
    constructor(readonly frameIndex: number, readonly step: Step, readonly totalAccent: boolean) {
    }
}

export interface VoiceFactory {
    createVoice: (channelIndex: ChannelIndex, step: Step, totalAccent: boolean) => Voice
}

export class Channel {
    private readonly events: PlayEvent[] = []
    private readonly processing: Voice[] = []

    constructor(private readonly factory: VoiceFactory, private readonly index: number) {
    }

    private active: Voice | null = null

    schedulePlay(frameIndex: number, step: Step, totalAccent: boolean): void {
        this.events.push(new PlayEvent(Math.floor(frameIndex), step, totalAccent))
        if (this.events.length > 1) {
            this.events.sort((a: PlayEvent, b: PlayEvent) => a.frameIndex - b.frameIndex)
        }
    }

    process(output: Float32Array, from: number, to: number): void {
        let frameIndex = 0
        for (const event of this.nextEvent(to)) {
            const toFrame = Math.max(0, event.frameIndex - from)
            console.assert(toFrame < RENDER_QUANTUM)
            this.advance(output, frameIndex, toFrame)
            this.active?.stop()
            const voice = this.factory.createVoice(this.index, event.step, event.totalAccent)
            this.processing.push(voice)
            this.active = voice
            frameIndex = toFrame
        }
        if (frameIndex < RENDER_QUANTUM) {
            this.advance(output, frameIndex, RENDER_QUANTUM)
        }
    }

    private * nextEvent(limit: number): Generator<PlayEvent> {
        while (this.events.length > 0 && this.events[0].frameIndex < limit) {
            yield this.events.shift()!
        }
    }

    private advance(output: Float32Array, from: number, to: number): void {
        let voiceIndex = this.processing.length
        while (--voiceIndex > -1) {
            const voice = this.processing[voiceIndex]
            if (!voice.process(output, from, to)) {
                voice.terminate()
                this.processing.splice(voiceIndex, 1)
                if (this.active === voice) {
                    this.active = null
                }
            }
        }
    }
}