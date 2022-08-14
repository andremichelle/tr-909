import { Options } from "../../lib/common.js";
import { DisplayObservableValueProvider } from "../display.js";
import { FunctionKeyLabel, KeyState, MainKeyIndex, MainKeyLabel, ZeroBasedIndices } from "../keys.js";
import { Mode } from "../mode.js";
import { MemoryBank } from './../../audio/tr909/memory.js';
import { TerminableVoid, Terminator } from './../../lib/common.js';
class TempoMemoryMode extends Mode {
    constructor(context) {
        super(context);
        this.subscriptions = new Terminator();
    }
    onFunctionKeyPress(label) {
        for (let trackIndex = 0; trackIndex < MemoryBank.NUM_TRACKS; trackIndex++) {
            if (label === FunctionKeyLabel.TrackPlay[trackIndex]) {
                const track = this.context.activeBank().tracks[trackIndex];
                track.recallTempo().ifPresent(tempo => this.context.machine.preset.tempo.set(tempo));
                this.subscriptions.with(this.context.display.pushProvider(new class {
                    constructor(measure) {
                        this.measure = measure;
                    }
                    addObserver(observer, notify) {
                        if (notify)
                            observer(this.displayValue());
                        return TerminableVoid;
                    }
                    displayValue() { return this.measure; }
                    terminate() { }
                }(track.isEmpty() ? 0 : 1)));
                return true;
            }
        }
        return true;
    }
    onFunctionKeyRelease(label) {
        this.subscriptions.terminate();
    }
    onMainKeyPress(label) {
        if (label === MainKeyLabel.EnterTotalAccent) {
            this.context.activeTrack().memorizeTempo(this.context.machine.preset.tempo.get());
        }
        return true;
    }
    name() {
        return 'Tempo Memory';
    }
}
export default class extends Mode {
    constructor(context) {
        super(context);
        this.tempoMemoryMode = Options.None;
        this.with(this.context.startStepRunningAnimation());
        this.with({ terminate: () => this.context.functionKeys.deactivate(ZeroBasedIndices.TrackKeys) });
        this.with(this.context.memoryState().trackIndex.addObserver(() => this.initButtons(), false));
        this.with(this.context.display.pushProvider(new DisplayObservableValueProvider(this.context.machine.processorTrackMeasure, DisplayObservableValueProvider.PlusOne)));
        this.with(this.context.memoryState().bankGroupIndex
            .addObserver((bankGroupIndex) => {
            this.context.updateBankGroupKeys(bankGroupIndex);
            this.initButtons();
        }, true));
    }
    onFunctionKeyPress(label) {
        if (this.tempoMemoryMode.nonEmpty()) {
            return this.tempoMemoryMode.get().onFunctionKeyPress(label);
        }
        if (this.context.maySwitchBankGroupIndex(label)) {
            return true;
        }
        if (this.context.maySwitchTrackIndex(label)) {
            return true;
        }
        if (this.context.maySwitchToTrackWriteMode(label)) {
            return true;
        }
        if (this.context.maySwitchToPatternPlayMode(label)) {
            return true;
        }
        if (this.context.maySwitchToPatternWriteMode(label)) {
            return true;
        }
        if (this.context.mayToggle(label, FunctionKeyLabel.CycleGuide, this.context.memoryState().cycleGuideMode)) {
            return true;
        }
        if (label === FunctionKeyLabel.LastMeasure) {
            this.context.digitInput.start();
            this.context.digitInput.setValue(this.context.memoryState().activeTrack().size());
            return true;
        }
        if (label === FunctionKeyLabel.Tempo) {
            this.tempoMemoryMode = Options.valueOf(new TempoMemoryMode(this.context));
            return false;
        }
        return true;
    }
    onFunctionKeyRelease(label) {
        if (label === FunctionKeyLabel.Tempo) {
            this.tempoMemoryMode.ifPresent(mode => mode.terminate());
            this.tempoMemoryMode = Options.None;
        }
        else if (this.tempoMemoryMode.nonEmpty()) {
            this.tempoMemoryMode.get().onFunctionKeyRelease(label);
        }
    }
    onMainKeyPress(label) {
        if (this.tempoMemoryMode.nonEmpty()) {
            return this.tempoMemoryMode.get().onMainKeyPress(label);
        }
        else if (label.keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            this.context.playInstrument(label.keyIndex);
        }
        return true;
    }
    allowMainKeyValueInput() {
        return true;
    }
    setMainKeyValue(value) {
        if (value > 0) {
            this.context.machine.processorTrackMeasure.set(Math.min(value - 1, this.context.memoryState().activeTrack().size() - 1));
        }
    }
    name() {
        return 'Track Play';
    }
    initButtons() {
        const trackIndex = this.context.memoryState().trackIndex.get();
        const track = this.context.memoryState().activeTrack();
        if (track.isEmpty()) {
            this.context.updatePatternGroupKeys(0, false);
            this.context.mainKeys.byIndex(0).setState(KeyState.Blink);
            this.context.machine.processorTrackMeasure.set(-1);
        }
        else {
            this.context.updatePatternLocationKeys(track.get(0));
            this.context.machine.processorTrackMeasure.set(0);
        }
        this.context.updateTrackKeys(trackIndex, false);
    }
}
//# sourceMappingURL=track-play.js.map