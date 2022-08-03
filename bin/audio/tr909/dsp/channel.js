import { RENDER_QUANTUM } from "../../common.js";
class PlayEvent {
    constructor(frameIndex, step, totalAccent) {
        this.frameIndex = frameIndex;
        this.step = step;
        this.totalAccent = totalAccent;
    }
}
export class Channel {
    constructor(factory, index) {
        this.factory = factory;
        this.index = index;
        this.events = [];
        this.processing = [];
        this.active = null;
    }
    schedulePlay(frameIndex, step, totalAccent) {
        this.events.push(new PlayEvent(Math.floor(frameIndex), step, totalAccent));
        if (this.events.length > 1) {
            this.events.sort((a, b) => a.frameIndex - b.frameIndex);
        }
    }
    process(output, from, to) {
        var _a;
        let frameIndex = 0;
        for (const event of this.nextEvent(to)) {
            const toFrame = Math.max(0, event.frameIndex - from);
            console.assert(toFrame < RENDER_QUANTUM);
            this.advance(output, frameIndex, toFrame);
            (_a = this.active) === null || _a === void 0 ? void 0 : _a.stop();
            const voice = this.factory.createVoice(this.index, event.step, event.totalAccent);
            this.processing.push(voice);
            this.active = voice;
            frameIndex = toFrame;
        }
        if (frameIndex < RENDER_QUANTUM) {
            this.advance(output, frameIndex, RENDER_QUANTUM);
        }
    }
    *nextEvent(limit) {
        while (this.events.length > 0 && this.events[0].frameIndex < limit) {
            yield this.events.shift();
        }
    }
    advance(output, from, to) {
        let voiceIndex = this.processing.length;
        while (--voiceIndex > -1) {
            const voice = this.processing[voiceIndex];
            if (!voice.process(output, from, to)) {
                voice.terminate();
                this.processing.splice(voiceIndex, 1);
                if (this.active === voice) {
                    this.active = null;
                }
            }
        }
    }
}
//# sourceMappingURL=channel.js.map