import { ObservableImpl, ObservableValueImpl, Terminator } from "../../lib/common.js";
import { BankIndex, PatternGroupIndex, PatternIndex, TrackIndex } from "./memory.js";
export var PlayMode;
(function (PlayMode) {
    PlayMode[PlayMode["Track"] = 0] = "Track";
    PlayMode[PlayMode["Pattern"] = 1] = "Pattern";
})(PlayMode || (PlayMode = {}));
export class State {
    constructor(memory) {
        this.memory = memory;
        this.terminator = new Terminator();
        this.bankGroupIndex = new ObservableValueImpl(BankIndex.I);
        this.patternGroupIndex = new ObservableValueImpl(PatternGroupIndex.I);
        this.patternIndex = new ObservableValueImpl(PatternIndex.Pattern1);
        this.trackIndex = new ObservableValueImpl(TrackIndex.I);
        this.cycleGuideMode = new ObservableValueImpl(false);
        this.playMode = new ObservableValueImpl(PlayMode.Track);
        this.changeNotification = new ObservableImpl();
        this.patternIndicesChangeNotification = new ObservableImpl();
        this.onChange = () => this.changeNotification.notify();
        this.onPatternIndicesChange = () => this.patternIndicesChangeNotification.notify(this.activePattern());
        this.terminator.with(this.bankGroupIndex.addObserver(this.onPatternIndicesChange, false));
        this.terminator.with(this.patternGroupIndex.addObserver(this.onPatternIndicesChange, false));
        this.terminator.with(this.patternIndex.addObserver(this.onPatternIndicesChange, false));
        this.terminator.with(this.bankGroupIndex.addObserver(this.onChange, false));
        this.terminator.with(this.patternGroupIndex.addObserver(this.onChange, false));
        this.terminator.with(this.patternIndex.addObserver(this.onChange, false));
        this.terminator.with(this.trackIndex.addObserver(this.onChange, false));
        this.terminator.with(this.cycleGuideMode.addObserver(this.onChange, false));
        this.terminator.with(this.playMode.addObserver(this.onChange, false));
    }
    activeBank() {
        const banks = this.memory.banks;
        const bankIndex = this.bankGroupIndex.get();
        console.assert(bankIndex >= 0 && bankIndex < banks.length);
        return banks[bankIndex];
    }
    activePatternGroup() {
        const patternGroups = this.activeBank().patternGroups;
        const patternGroupIndex = this.patternGroupIndex.get();
        console.assert(patternGroupIndex >= 0 && patternGroupIndex < patternGroups.length);
        return patternGroups[patternGroupIndex];
    }
    activePattern() {
        const patterns = this.activePatternGroup().patterns;
        const patternIndex = this.patternIndex.get();
        console.assert(patternIndex >= 0 && patternIndex < patterns.length);
        return patterns[patternIndex];
    }
    activeTrack() {
        const tracks = this.activeBank().tracks;
        const trackIndex = this.trackIndex.get();
        console.assert(trackIndex >= 0 && trackIndex < tracks.length);
        return tracks[trackIndex];
    }
    deserialize(format) {
        this.bankGroupIndex.set(format.bankGroupIndex);
        this.patternGroupIndex.set(format.patternGroupIndex);
        this.patternIndex.set(format.patternIndex);
        this.trackIndex.set(format.trackIndex);
        this.cycleGuideMode.set(format.cycleGuideMode);
        this.playMode.set(format.playMode);
        return this;
    }
    serialize() {
        return {
            bankGroupIndex: this.bankGroupIndex.get(),
            patternGroupIndex: this.patternGroupIndex.get(),
            patternIndex: this.patternIndex.get(),
            trackIndex: this.trackIndex.get(),
            cycleGuideMode: this.cycleGuideMode.get(),
            playMode: this.playMode.get()
        };
    }
    terminate() {
        this.terminator.terminate();
    }
}
//# sourceMappingURL=state.js.map