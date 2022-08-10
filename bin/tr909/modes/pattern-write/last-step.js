import { FunctionKeyLabel, MainKeyIndex } from '../../keys.js';
import { Mode } from "../../mode.js";
export class LastStepInput extends Mode {
    constructor(context, back) {
        super(context);
        this.back = back;
    }
    onMainKeyPress(label) {
        if (label.keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            const pattern = this.context.memoryState().activePattern();
            pattern.lastStep.set(label.keyIndex + 1);
            return true;
        }
        return false;
    }
    onFunctionKeyRelease(label) {
        if (label === FunctionKeyLabel.LastStep) {
            this.back();
        }
    }
    name() {
        return 'Last Step';
    }
}
//# sourceMappingURL=last-step.js.map