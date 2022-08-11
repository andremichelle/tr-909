import { FunctionKeyLabel, KeyState, MainKeyLabel, ZeroBasedIndices } from "../../keys.js";
import { Mode } from "../../mode.js";
export class SelectPatternMode extends Mode {
    constructor(context, editor) {
        super(context);
        this.editor = editor;
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
            this.editor.clearPattern();
            return false;
        }
        return true;
    }
    onMainKeyPress(label) {
        if (label.isStepButton()) {
            this.context.memoryState().patternIndex.set(label.toStepIndex());
            return true;
        }
        if (label === MainKeyLabel.Copy) {
            this.editor.copyPattern();
            return true;
        }
        return true;
    }
    name() {
        return 'Select';
    }
}
//# sourceMappingURL=pattern-select.js.map