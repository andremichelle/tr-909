import { ObservableValueImpl, TerminableVoid } from "../../lib/common.js";
import { DisplayObservableValueProvider } from "../display.js";
import { FunctionKeyLabel, MainKeyIndex } from "../keys.js";
import { Mode } from "../mode.js";
export default class extends Mode {
    constructor(context) {
        super(context);
        this.terminableAvailableMeasureDisplay = TerminableVoid;
        this.writeIndex = new ObservableValueImpl(0);
        this.context.updateBankGroupKeys(this.context.memoryState().bankGroupIndex.get());
        this.context.updateTrackKeys(this.context.memoryState().trackIndex.get(), true);
        this.with(this.context.startStepRunningAnimation());
        this.with(this.context.watchPatternLocationKeys());
        this.with(this.context.display
            .push(new DisplayObservableValueProvider(this.writeIndex, 'write-index', DisplayObservableValueProvider.PlusOne)));
        this.availableMeasures = new class {
            constructor(memory) {
                this.memory = memory;
                this.debugName = 'available measures';
            }
            addObserver(observer, notify) {
                if (notify) {
                    observer(this.displayValue());
                }
                return TerminableVoid;
            }
            displayValue() {
                return this.memory.availableMeasures();
            }
            terminate() {
            }
        }(context.machine.memory);
    }
    onFunctionKeyPress(label) {
        if (this.context.maySwitchToTrackPlayMode(label)) {
            return true;
        }
        if (this.context.maySwitchPatternGroupIndex(label)) {
            return true;
        }
        if (label === FunctionKeyLabel.AvailableMeasures) {
            this.terminableAvailableMeasureDisplay = this.context.display.push(this.availableMeasures);
            return true;
        }
        if (label == FunctionKeyLabel.Back) {
            const index = this.writeIndex.get();
            if (index > 0) {
                this.writeIndex.set(index - 1);
                this.context.updatePatternLocationKeys(this.context.activeTrack().get(this.writeIndex.get()));
            }
            return true;
        }
        if (label == FunctionKeyLabel.Forward) {
            const index = this.writeIndex.get();
            if (index < this.context.activeTrack().size() - 1) {
                this.writeIndex.set(index + 1);
                this.context.updatePatternLocationKeys(this.context.activeTrack().get(this.writeIndex.get()));
            }
            return true;
        }
        return true;
    }
    onFunctionKeyRelease(key) {
        if (key === FunctionKeyLabel.AvailableMeasures) {
            this.terminableAvailableMeasureDisplay.terminate();
        }
    }
    onMainKeyPress(label) {
        if (label.keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {
            this.context.activeTrack().writeLocation(this.context.memoryState().activePattern().location, this.writeIndex.get());
            this.writeIndex.set(this.writeIndex.get() + 1);
        }
        else {
            this.context.memoryState().patternIndex.set(label.keyIndex);
        }
        return true;
    }
    allowMainKeyValueInput() {
        return true;
    }
    setMainKeyValue(value) {
        if (value === 0)
            return;
        this.writeIndex.set(Math.min(value - 1, this.context.activeTrack().size() - 1));
    }
    name() {
        return 'Track Write';
    }
}
//# sourceMappingURL=track-write.js.map