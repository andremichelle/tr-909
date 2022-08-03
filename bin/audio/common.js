export const RENDER_QUANTUM = 128 | 0;
export const LOG_DB = Math.log(10.0) / 20.0;
export const dbToGain = (db) => Math.exp(db * LOG_DB);
export const gainToDb = (gain) => Math.log(gain) / LOG_DB;
export const midiToHz = (note = 60.0, baseFrequency = 440.0) => baseFrequency * Math.pow(2.0, (note + 3.0) / 12.0 - 6.0);
export const numFramesToBars = (numFrames, bpm, samplingRate) => (numFrames * bpm) / (samplingRate * 240.0);
export const secondsToBars = (seconds, bpm) => (seconds * bpm) / 240.0;
export const barsToNumFrames = (bars, bpm, samplingRate) => (bars * samplingRate * 240.0) / bpm;
export const barsToSeconds = (bars, bpm) => (bars * 240.0) / bpm;
export const SILENCE_GAIN = dbToGain(-192.0);
export class RMS {
    constructor(n) {
        this.n = n;
        this.values = new Float32Array(n);
        this.inv = 1.0 / n;
        this.sum = 0.0;
        this.index = 0 | 0;
    }
    pushPop(squared) {
        this.sum -= this.values[this.index];
        this.sum += squared;
        this.values[this.index] = squared;
        if (++this.index === this.n)
            this.index = 0;
        return 0.0 >= this.sum ? 0.0 : Math.sqrt(this.sum * this.inv);
    }
}
export class Interpolator {
    constructor(sampleRate) {
        this.value = NaN;
        this.target = NaN;
        this.delta = 0.0;
        this.remaining = 0 | 0;
        this.length = (Interpolator.DefaultSeconds * sampleRate) | 0;
    }
    set(target, smooth) {
        if (target === this.value) {
            return;
        }
        if (!smooth || isNaN(this.value)) {
            this.value = this.target = target;
            this.delta = 0.0;
            this.remaining = 0 | 0;
        }
        else {
            this.target = target;
            this.delta = (target - this.value) / this.length;
            this.remaining = this.length;
        }
    }
    moveAndGet() {
        if (0 < this.remaining) {
            this.value += this.delta;
            if (0 == --this.remaining) {
                this.delta = 0.0;
                this.value = this.target;
            }
        }
        return this.value;
    }
    equals(value) {
        return this.value === value;
    }
}
Interpolator.DefaultSeconds = 0.007;
import { ObservableImpl } from "../lib/common.js";
export class Transport {
    constructor() {
        this.observable = new ObservableImpl();
        this.moving = false;
    }
    addObserver(observer, notify) {
        return this.observable.addObserver(observer);
    }
    play() {
        if (this.moving)
            return;
        this.moving = true;
        this.observable.notify({ type: "transport-play" });
    }
    restart() {
        this.observable.notify({ type: "transport-move", position: 0.0 });
        this.play();
    }
    pause() {
        if (!this.moving)
            return;
        this.moving = false;
        this.observable.notify({ type: "transport-pause" });
    }
    togglePlayback() {
        if (this.moving) {
            this.pause();
        }
        else {
            this.play();
        }
    }
    stop() {
        this.pause();
        this.moveTo(0.0);
    }
    moveTo(position) {
        this.observable.notify({ type: "transport-move", position: position });
    }
    isPlaying() {
        return this.moving;
    }
    terminate() {
        this.observable.terminate();
    }
}
export const encodeWavFloat = (audio) => {
    const MAGIC_RIFF = 0x46464952;
    const MAGIC_WAVE = 0x45564157;
    const MAGIC_FMT = 0x20746d66;
    const MAGIC_DATA = 0x61746164;
    const bytesPerChannel = Float32Array.BYTES_PER_ELEMENT;
    const sampleRate = audio.sampleRate;
    let numFrames;
    let numberOfChannels;
    let channels;
    if (audio instanceof AudioBuffer) {
        channels = [];
        numFrames = audio.length;
        numberOfChannels = audio.numberOfChannels;
        for (let i = 0; i < numberOfChannels; ++i) {
            channels[i] = audio.getChannelData(i);
        }
    }
    else {
        channels = audio.channels;
        numFrames = audio.numFrames;
        numberOfChannels = audio.channels.length;
    }
    const size = 44 + numFrames * numberOfChannels * bytesPerChannel;
    const buf = new ArrayBuffer(size);
    const view = new DataView(buf);
    view.setUint32(0, MAGIC_RIFF, true);
    view.setUint32(4, size - 8, true);
    view.setUint32(8, MAGIC_WAVE, true);
    view.setUint32(12, MAGIC_FMT, true);
    view.setUint32(16, 16, true);
    view.setUint16(20, 3, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * bytesPerChannel, true);
    view.setUint16(32, numberOfChannels * bytesPerChannel, true);
    view.setUint16(34, 8 * bytesPerChannel, true);
    view.setUint32(36, MAGIC_DATA, true);
    view.setUint32(40, numberOfChannels * numFrames * bytesPerChannel, true);
    let w = 44;
    for (let i = 0; i < numFrames; ++i) {
        for (let j = 0; j < numberOfChannels; ++j) {
            view.setFloat32(w, channels[j][i], true);
            w += bytesPerChannel;
        }
    }
    return view.buffer;
};
//# sourceMappingURL=common.js.map