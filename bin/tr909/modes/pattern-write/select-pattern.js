import { FunctionKeyLabel, KeyState, MainKeyIndex, ZeroBasedIndices } from "../../keys.js";
import { Mode } from "../../mode.js";
export class SelectPatternMode extends Mode {
    constructor(context) {
        super(context);
        this.clear = false;
        console.assert(!context.machine.transport.isPlaying());
        this.with(this.context.memoryState().patternIndex
            .addObserver((patternIndex) => this.context.mainKeys
            .activate(index => patternIndex === index
            ? KeyState.Blink
            : KeyState.Off, ZeroBasedIndices.StepKeys), true));
    }
    onFunctionKeyPress(label) {
        if (this.context.maySwitchToTrackPlayMode(label)) {
            return true;
        }
        if (this.context.maySwitchToPatternPlayMode(label)) {
            return true;
        }
        if (this.context.maySwitchToTrackWriteMode(label)) {
            return true;
        }
        if (this.context.maySwitchToPatternWriteMode(label)) {
            return true;
        }
        if (this.context.maySwitchPatternEditMode(label)) {
            return true;
        }
        if (this.context.mayToggle(label, FunctionKeyLabel.CycleGuide, this.context.memoryState().cycleGuideMode)) {
            return true;
        }
        if (label === FunctionKeyLabel.Clear) {
            this.clear = true;
            return false;
        }
        return true;
    }
    onFunctionKeyRelease(label) {
        if (label === FunctionKeyLabel.Clear) {
            this.clear = false;
        }
    }
    onMainKeyPress(keyIndex) {
        if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {
            return false;
        }
        if (keyIndex === MainKeyIndex.Step11 && this.context.isShiftKeyPressed()) {
            return false;
        }
        this.context.memoryState().patternIndex.set(keyIndex);
        if (this.clear) {
            this.context.memoryState().activePattern().clear();
        }
        return true;
    }
    name() {
        return 'Select';
    }
}
//# sourceMappingURL=select-pattern.js.map