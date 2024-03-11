import { dbToGain, Interpolator } from "../../common.js";
import { ResourceSampleRate } from "../resources.js";
import { SilentGain, Voice } from "./voice.js";
class BassdrumVoice extends Voice {
    constructor(resources, preset, sampleRate, level) {
        super(sampleRate);
        this.gainEnvelope = 1.0;
        this.gainCoefficient = 1.0;
        this.freqEnvelope = BassdrumVoice.FreqStart;
        this.freqCoefficient = 1.0;
        this.time = 0.0;
        this.phase = 0.0;
        this.attackPosition = 0.0;
        this.cycle = resources.cycle;
        this.attack = resources.attack;
        this.gainInterpolator = new Interpolator(sampleRate);
        this.gainInterpolator.set(0.0, false);
        this.terminator.with(preset.level.addObserver(value => this.gainInterpolator.set(dbToGain(value + level), true), true));
        this.terminator.with(preset.decay.addObserver(value => this.gainCoefficient = Math.exp(-1.0 / (sampleRate * value)), true));
        this.terminator.with(preset.tune.addObserver(value => this.freqCoefficient = Math.exp(-1.0 / (sampleRate * value)), true));
        this.attackGain = dbToGain(preset.attack.get() + preset.level.get() + level);
        this.attackRate = ResourceSampleRate / sampleRate;
    }
    stop() {
        this.gainInterpolator.set(0.0, true);
        this.terminate();
    }
    process(output, from, to) {
        for (let i = from; i < to; i++) {
            if (this.time > BassdrumVoice.ReleaseStartTime) {
                this.gainEnvelope *= this.gainCoefficient;
            }
            const pos = this.phase * this.cycle.length;
            const posInt = Math.floor(pos);
            const alpha = pos - posInt;
            const p0 = this.cycle[posInt % this.cycle.length];
            const value = p0 + alpha * (this.cycle[(posInt + 1) % this.cycle.length] - p0);
            output[i] += value * this.gainEnvelope * this.gainInterpolator.moveAndGet();
            if (this.attackPosition < this.attack.length - 1) {
                const pi = this.attackPosition | 0;
                const p0 = this.attack[pi];
                output[i] += (p0 + (this.attackPosition - pi) * (this.attack[pi + 1] - p0)) * this.attackGain;
                this.attackPosition += this.attackRate;
            }
            this.time += this.sampleRateInv;
            this.phase += this.freqEnvelope * this.sampleRateInv;
            this.phase -= Math.floor(this.phase);
            this.freqEnvelope = BassdrumVoice.FreqEnd + this.freqCoefficient * (this.freqEnvelope - BassdrumVoice.FreqEnd);
        }
        return this.gainEnvelope > SilentGain && !this.gainInterpolator.equals(0.0);
    }
}
BassdrumVoice.ReleaseStartTime = 0.060;
BassdrumVoice.FreqStart = 274.0;
BassdrumVoice.FreqEnd = 53.0;
export { BassdrumVoice };
//# sourceMappingURL=bassdrum.js.map