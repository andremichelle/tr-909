import { ArrayUtils, ObservableImpl, ObservableValueImpl, Terminator } from "../../lib/common.js";
import { State } from "./state.js";
import { Track } from "./track.js";
export var BankIndex;
(function (BankIndex) {
    BankIndex[BankIndex["I"] = 0] = "I";
    BankIndex[BankIndex["II"] = 1] = "II";
})(BankIndex || (BankIndex = {}));
export var TrackIndex;
(function (TrackIndex) {
    TrackIndex[TrackIndex["I"] = 0] = "I";
    TrackIndex[TrackIndex["II"] = 1] = "II";
    TrackIndex[TrackIndex["III"] = 2] = "III";
    TrackIndex[TrackIndex["IV"] = 3] = "IV";
})(TrackIndex || (TrackIndex = {}));
export var PatternGroupIndex;
(function (PatternGroupIndex) {
    PatternGroupIndex[PatternGroupIndex["I"] = 0] = "I";
    PatternGroupIndex[PatternGroupIndex["II"] = 1] = "II";
    PatternGroupIndex[PatternGroupIndex["III"] = 2] = "III";
})(PatternGroupIndex || (PatternGroupIndex = {}));
export var PatternIndex;
(function (PatternIndex) {
    PatternIndex[PatternIndex["Pattern1"] = 0] = "Pattern1";
    PatternIndex[PatternIndex["Pattern2"] = 1] = "Pattern2";
    PatternIndex[PatternIndex["Pattern3"] = 2] = "Pattern3";
    PatternIndex[PatternIndex["Pattern4"] = 3] = "Pattern4";
    PatternIndex[PatternIndex["Pattern5"] = 4] = "Pattern5";
    PatternIndex[PatternIndex["Pattern6"] = 5] = "Pattern6";
    PatternIndex[PatternIndex["Pattern7"] = 6] = "Pattern7";
    PatternIndex[PatternIndex["Pattern8"] = 7] = "Pattern8";
    PatternIndex[PatternIndex["Pattern9"] = 8] = "Pattern9";
    PatternIndex[PatternIndex["Pattern10"] = 9] = "Pattern10";
    PatternIndex[PatternIndex["Pattern11"] = 10] = "Pattern11";
    PatternIndex[PatternIndex["Pattern12"] = 11] = "Pattern12";
    PatternIndex[PatternIndex["Pattern13"] = 12] = "Pattern13";
    PatternIndex[PatternIndex["Pattern14"] = 13] = "Pattern14";
    PatternIndex[PatternIndex["Pattern15"] = 14] = "Pattern15";
    PatternIndex[PatternIndex["Pattern16"] = 15] = "Pattern16";
})(PatternIndex || (PatternIndex = {}));
export var Step;
(function (Step) {
    Step[Step["None"] = 0] = "None";
    Step[Step["Weak"] = 1] = "Weak";
    Step[Step["Full"] = 2] = "Full";
    Step[Step["Extra"] = 3] = "Extra";
})(Step || (Step = {}));
export var ChannelIndex;
(function (ChannelIndex) {
    ChannelIndex[ChannelIndex["Bassdrum"] = 0] = "Bassdrum";
    ChannelIndex[ChannelIndex["Snaredrum"] = 1] = "Snaredrum";
    ChannelIndex[ChannelIndex["TomLow"] = 2] = "TomLow";
    ChannelIndex[ChannelIndex["TomMid"] = 3] = "TomMid";
    ChannelIndex[ChannelIndex["TomHi"] = 4] = "TomHi";
    ChannelIndex[ChannelIndex["Rim"] = 5] = "Rim";
    ChannelIndex[ChannelIndex["Clap"] = 6] = "Clap";
    ChannelIndex[ChannelIndex["Hihat"] = 7] = "Hihat";
    ChannelIndex[ChannelIndex["Crash"] = 8] = "Crash";
    ChannelIndex[ChannelIndex["Ride"] = 9] = "Ride";
    ChannelIndex[ChannelIndex["End"] = 10] = "End";
})(ChannelIndex || (ChannelIndex = {}));
export class Memory {
    constructor() {
        this.banks = [new MemoryBank(), new MemoryBank()];
        this.state = new State(this);
    }
    availableMeasures() {
        return Memory.MAX_MEASURES - this.banks.reduce((count, bank) => count + bank.tracks.reduce((count, track) => count + track.size(), 0), 0);
    }
}
Memory.MAX_MEASURES = 896;
export class MemoryBank {
    constructor() {
        this.tracks = ArrayUtils.fill(MemoryBank.NUM_TRACKS, () => new Track());
        this.patternGroups = ArrayUtils.fill(MemoryBank.NUM_PATTERN_GROUPS, (index) => new PatternGroup(index));
    }
    isChained(pattern) {
        return this.patternGroups[pattern.location.patternGroupIndex].isChained(pattern.location.patternIndex);
    }
    firstOfChained(pattern) {
        return this.patternGroups[pattern.location.patternGroupIndex].firstOfChained(pattern.location.patternIndex);
    }
    nextPattern(pattern) {
        return this.patternGroups[pattern.location.patternGroupIndex].nextPattern(pattern.location.patternIndex);
    }
    patternByIndices(patternGroupIndex, patternIndex) {
        return this.patternGroups[patternGroupIndex].patterns[patternIndex];
    }
    patternByLocation(location) {
        return this.patternByIndices(location.patternGroupIndex, location.patternIndex);
    }
}
MemoryBank.NUM_TRACKS = 4;
MemoryBank.NUM_PATTERN_GROUPS = 3;
export class PatternGroup {
    constructor(patternGroupIndex) {
        this.terminator = new Terminator();
        this.observable = this.terminator.with(new ObservableImpl());
        this.chained = new Array(PatternGroup.NUM_PATTERNS - 1).fill(false);
        this.patterns = ArrayUtils.fill(PatternGroup.NUM_PATTERNS, (patternIndex) => new Pattern({ patternGroupIndex, patternIndex }));
    }
    getChained() {
        return this.chained;
    }
    writeChain(chained) {
        console.assert(chained.length === PatternGroup.NUM_PATTERNS - 1);
        if (this.chained.some((chain, index) => chain !== chained[index])) {
            this.chained.splice(0, this.chained.length, ...chained);
            this.observable.notify();
        }
    }
    clearChains() {
        if (this.chained.some(chain => chain === true)) {
            this.chained.fill(false);
            this.observable.notify();
        }
    }
    isChained(patternIndex) {
        return this.chained[patternIndex];
    }
    firstOfChained(patternIndex) {
        console.assert(patternIndex >= 0 && patternIndex < PatternGroup.NUM_PATTERNS);
        let index = patternIndex;
        while (index > 0 && this.chained[index - 1]) {
            index--;
        }
        return this.patterns[index];
    }
    nextPattern(patternIndex) {
        return patternIndex + 1 < PatternGroup.NUM_PATTERNS ? this.patterns[patternIndex + 1] : null;
    }
    deserialize(format) {
        this.patterns.forEach((pattern, index) => pattern.deserialize(format.patterns[index]));
        this.writeChain(format.chained);
        this.observable.notify();
        return this;
    }
    serialize() {
        return { chained: this.chained, patterns: this.patterns.map(pattern => pattern.serialize()) };
    }
    addObserver(observer, notify) {
        if (notify)
            observer();
        return this.observable.addObserver(observer);
    }
    terminate() {
        this.observable.terminate();
    }
}
PatternGroup.NUM_PATTERNS = 16;
export class Pattern {
    constructor(location) {
        this.location = location;
        this.terminator = new Terminator();
        this.lastStep = new ObservableValueImpl(16);
        this.flamIndex = new ObservableValueImpl(0);
        this.shuffleIndex = new ObservableValueImpl(0);
        this.scaleIndex = new ObservableValueImpl(3);
        this.observable = this.terminator.with(new ObservableImpl());
        this.listener = () => this.observable.notify();
        this.steps = ArrayUtils.fill(ChannelIndex.End, () => ArrayUtils.fill(16, () => Step.None));
        this.totalAccents = ArrayUtils.fill(16, () => false);
        this.shuffle = this.terminator.with(new Shuffle(this.shuffleIndex, this.scaleIndex));
        this.terminator.with(this.scaleIndex.addObserver(this.listener, false));
        this.terminator.with(this.lastStep.addObserver(this.listener, false));
        this.terminator.with(this.flamIndex.addObserver(this.listener, false));
        this.terminator.with(this.shuffleIndex.addObserver(this.listener, false));
    }
    testA() {
        this.observable.mute();
        for (let i = 0; i < 16; i++) {
            if ((i + 2) % 4 !== 0) {
                this.setStep(ChannelIndex.Hihat, i, Step.Full);
            }
            else {
                this.setStep(ChannelIndex.Hihat, i, Step.Extra);
            }
            if (i % 4 === 0) {
                this.setStep(ChannelIndex.Bassdrum, i, Step.Full);
            }
        }
        this.setStep(ChannelIndex.Bassdrum, 15, Step.Extra);
        this.setStep(ChannelIndex.Clap, 4, Step.Full);
        this.setStep(ChannelIndex.Clap, 12, Step.Full);
        this.observable.unmute();
        this.observable.notify();
    }
    testB() {
        this.observable.mute();
        for (let i = 0; i < 16; i++) {
            if ((i + 2) % 4 !== 0) {
                this.setStep(ChannelIndex.Hihat, i, Step.Full);
            }
            else {
                this.setStep(ChannelIndex.Hihat, i, Step.Extra);
            }
        }
        this.setStep(ChannelIndex.Rim, 4, Step.Full);
        this.setStep(ChannelIndex.Rim, 12, Step.Full);
        this.observable.unmute();
        this.observable.notify();
    }
    testC() {
        this.observable.mute();
        for (let i = 0; i < 16; i++) {
            this.setStep(ChannelIndex.Hihat, i, Step.Full);
        }
        this.setStep(ChannelIndex.Clap, 4, Step.Full);
        this.setStep(ChannelIndex.Clap, 12, Step.Full);
        this.scaleIndex.set(2);
        this.shuffleIndex.set(6);
        this.observable.unmute();
        this.observable.notify();
    }
    testD() {
        this.observable.mute();
        for (let i = 0; i < 16; i++) {
            this.setStep(ChannelIndex.Hihat, i, Step.Full);
        }
        this.setStep(ChannelIndex.Clap, 4, Step.Full);
        this.setStep(ChannelIndex.Clap, 12, Step.Full);
        this.setStep(ChannelIndex.Clap, 15, Step.Weak);
        this.shuffleIndex.set(6);
        this.lastStep.set(6);
        this.observable.unmute();
        this.observable.notify();
    }
    setStep(channelIndex, stepIndex, step) {
        console.assert(0 <= channelIndex && channelIndex < ChannelIndex.End);
        console.assert(0 <= stepIndex && stepIndex < 16);
        if (this.steps[channelIndex][stepIndex] === step) {
            return;
        }
        this.steps[channelIndex][stepIndex] = step;
        this.observable.notify();
    }
    getStep(channelIndex, stepIndex) {
        console.assert(0 <= channelIndex && channelIndex < ChannelIndex.End);
        console.assert(0 <= stepIndex && stepIndex < 16);
        return this.steps[channelIndex][stepIndex];
    }
    setTotalAccent(stepIndex, active) {
        console.assert(0 <= stepIndex && stepIndex < 16);
        this.totalAccents[stepIndex] = active;
        this.observable.notify();
    }
    isTotalAccent(stepIndex) {
        console.assert(0 <= stepIndex && stepIndex < 16);
        return this.totalAccents[stepIndex];
    }
    cycleToNextScale() {
        this.scaleIndex.set((this.scaleIndex.get() + 5) % 4);
    }
    duration() {
        return this.lastStep.get() * this.scaleRatio();
    }
    scaleRatio() {
        return Pattern.ScaleRatios[this.scaleIndex.get()];
    }
    clear() {
        console.debug('clear pattern');
        this.observable.mute();
        this.steps.forEach(steps => steps.fill(Step.None));
        this.totalAccents.fill(false);
        this.scaleIndex.set(3);
        this.lastStep.set(16);
        this.shuffleIndex.set(0);
        this.flamIndex.set(0);
        this.observable.unmute();
        this.observable.notify();
    }
    serialize() {
        console.debug('serialize pattern');
        return {
            steps: this.steps,
            totalAccents: this.totalAccents,
            scaleIndex: this.scaleIndex.get(),
            flamIndex: this.flamIndex.get(),
            lastStep: this.lastStep.get(),
            shuffleIndex: this.shuffleIndex.get()
        };
    }
    deserialize(format) {
        console.debug('deserialize pattern');
        this.observable.mute();
        format.steps.forEach((steps, channel) => steps.forEach((step, stepIndex) => this.steps[channel][stepIndex] = step));
        this.totalAccents.splice(0, 16, ...format.totalAccents);
        this.lastStep.set(format.lastStep);
        this.scaleIndex.set(format.scaleIndex);
        this.flamIndex.set(format.flamIndex);
        this.shuffleIndex.set(format.shuffleIndex);
        this.observable.unmute();
        this.observable.notify();
        return this;
    }
    addObserver(observer, notify) {
        if (notify)
            observer();
        return this.observable.addObserver(observer);
    }
    shuffleInverse(position) {
        return this.shuffle.inverse(position);
    }
    shuffleTransform(position) {
        return this.shuffle.transform(position);
    }
    terminate() {
        this.terminator.terminate();
    }
}
Pattern.ShuffleDelays = ArrayUtils.fill(7, index => index / 32);
Pattern.FlamDelays = ArrayUtils.fill(8, index => 10 + index * 4);
Pattern.ScaleRatios = [3.0 / 16.0, 3.0 / 32.0, 1.0 / 32.0, 1.0 / 16.0];
class Shuffle {
    constructor(shuffleIndex, scale) {
        this.terminator = new Terminator();
        this.enabled = false;
        this.exponent = 1.0;
        this.duration = 1.0 / 8.0;
        const update = () => {
            switch (scale.get()) {
                case 0:
                case 1: {
                    this.enabled = false;
                    this.exponent = 1.0;
                    this.duration = 1.0 / 8.0;
                    return;
                }
                case 2: {
                    this.enabled = true;
                    this.exponent = Shuffle.computeExponent(shuffleIndex);
                    this.duration = 1.0 / 16.0;
                    return;
                }
                case 3: {
                    this.enabled = true;
                    this.exponent = Shuffle.computeExponent(shuffleIndex);
                    this.duration = 1.0 / 8.0;
                    return;
                }
            }
        };
        this.terminator.with(shuffleIndex.addObserver(update, false));
        this.terminator.with(scale.addObserver(update, false));
    }
    static computeExponent(shuffleIndex) {
        return Math.log(0.5) / Math.log(0.5 + Pattern.ShuffleDelays[shuffleIndex.get()]);
    }
    inverse(position) {
        return this.enabled ? this.map(position, this.exponent) : position;
    }
    transform(position) {
        return this.enabled ? this.map(position, 1.0 / this.exponent) : position;
    }
    terminate() {
        this.terminator.terminate();
    }
    map(position, exponent) {
        const duration = this.duration;
        const start = Math.floor(position / duration) * duration;
        const normalized = (position - start) / duration;
        const transformed = Math.pow(normalized, exponent);
        return start + transformed * duration;
    }
}
//# sourceMappingURL=memory.js.map