import { dbToGain, Interpolator } from "../../common.js";
import { AudioFilesSampleRate } from "../resources.js";
import { SilentGain, Voice } from "./voice.js";
export class SnaredrumVoice extends Voice {
    constructor(resources, preset, sampleRate, level) {
        super(sampleRate);
        this.initPhase = true;
        this.tonePosition = 0.0;
        this.noisePosition = 0.0;
        this.noiseGain = 1.0;
        this.noiseGainCoefficient = 1.0;
        this.tune = resources.tone;
        this.noise = resources.noise;
        this.tuneRate = AudioFilesSampleRate * this.sampleRateInv * Math.pow(2.0, preset.tune.get());
        this.noiseRate = AudioFilesSampleRate * this.sampleRateInv;
        this.noiseGain = dbToGain(preset.snappy.get());
        this.gainInterpolator = new Interpolator(sampleRate);
        this.terminator.with(preset.level.addObserver(value => this.gainInterpolator.set(dbToGain(value + level), !this.initPhase), true));
        this.terminator.with(preset.tone.addObserver(value => this.noiseGainCoefficient = Math.exp(-1.0 / (sampleRate * value)), true));
        this.initPhase = false;
    }
    stop() {
        this.gainInterpolator.set(0.0, true);
        this.terminate();
    }
    process(output, from, to) {
        let pi;
        for (let i = from; i < to; i++) {
            const gain = this.gainInterpolator.moveAndGet();
            pi = this.tonePosition | 0;
            if (pi < this.tune.length - 1) {
                const p0 = this.tune[pi];
                output[i] += (p0 + (this.tonePosition - pi) * (this.tune[pi + 1] - p0)) * gain;
                this.tonePosition += this.tuneRate;
            }
            pi = this.noisePosition | 0;
            if (pi < this.noise.length - 1) {
                const p0 = this.noise[pi];
                output[i] += (p0 + (this.noisePosition - pi) * (this.noise[pi + 1] - p0)) * gain * this.noiseGain;
                this.noiseGain *= this.noiseGainCoefficient;
                this.noisePosition += this.noiseRate;
            }
            else {
                return false;
            }
        }
        return !(this.gainInterpolator.equals(0.0) || this.noiseGain < SilentGain);
    }
}
//# sourceMappingURL=snaredrum.js.map