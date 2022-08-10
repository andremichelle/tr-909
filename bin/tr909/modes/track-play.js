import { DisplayObservableValueProvider } from "../display.js";
import { FunctionKeyLabel, KeyState, MainKeyIndex, ZeroBasedIndices } from "../keys.js";
import { Mode } from "../mode.js";
export default class extends Mode {
    constructor(context) {
        super(context);
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
        return true;
    }
    onMainKeyPress(label) {
        if (label.keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {
            return true;
        }
        else {
            this.context.playInstrument(label.keyIndex);
            return true;
        }
    }
    setMainKeyValue(value) {
        if (value > 0) {
            this.context.machine.processorTrackMeasure.set(value - 1);
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