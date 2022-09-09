import { dbToGain, Interpolator } from "../../common.js";
import { AudioFilesSampleRate } from "../resources.js";
import { Voice } from "./voice.js";
export class BasicTuneDecayVoice extends Voice {
    constructor(array, preset, sampleRate, releaseStartTime, level) {
        super(sampleRate);
        this.array = array;
        this.releaseStartFrame = (releaseStartTime * sampleRate) | 0;
        this.gainInterpolator = new Interpolator(sampleRate);
        this.position = 0.0;
        this.frame = 0 | 0;
        this.rate = AudioFilesSampleRate / sampleRate;
        this.envelope = 1.0;
        this.envelopeCoefficient = 1.0;
        this.terminator.with(preset.level.addObserver(value => this.gainInterpolator.set(dbToGain(value + level), true), true));
        if ('tune' in preset) {
            this.terminator.with(preset.tune.addObserver(value => this.rate = AudioFilesSampleRate / sampleRate * Math.pow(2.0, value), true));
        }
        if ('decay' in preset) {
            this.terminator.with(preset.decay.addObserver(value => this.envelopeCoefficient = Math.exp(-1.0 / (sampleRate * value)), true));
        }
    }
    stop() {
        this.gainInterpolator.set(0.0, true);
        this.terminate();
    }
    process(output, from, to) {
        for (let i = from; i < to; i++) {
            const pi = this.position | 0;
            if (pi >= this.array.length - 1) {
                return false;
            }
            if (this.frame++ >= this.releaseStartFrame) {
                this.envelope *= this.envelopeCoefficient;
            }
            const v0 = this.array[pi];
            const v1 = this.array[pi + 1];
            const alpha = this.position - pi;
            output[i] += (v0 + alpha * (v1 - v0)) * this.envelope * this.gainInterpolator.moveAndGet();
            this.position += this.rate;
        }
        return !this.gainInterpolator.equals(0.0);
    }
}
//# sourceMappingURL=basic-voice.js.map