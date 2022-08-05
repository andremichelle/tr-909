import { FunctionKeyLabel } from '../../keys.js';
import { Mode } from "../../mode.js";
import { Utils } from '../../utils.js';
export class ClearStepsInput extends Mode {
    constructor(context, back) {
        super(context);
        this.back = back;
        this.with(this.context.machine.processorStepIndex.addObserver(stepIndex => {
            const instrumentMode = this.context.instrumentMode.get();
            const pattern = this.context.memoryState().activePattern();
            Utils.clearPatternStep(pattern, instrumentMode, stepIndex);
        }, true));
    }
    onMainKeyPress(keyIndex) {
        return true;
    }
    onFunctionKeyRelease(label) {
        if (label === FunctionKeyLabel.Clear) {
            this.back();
        }
    }
    name() {
        return 'Clear';
    }
}
//# sourceMappingURL=clear-steps.js.map