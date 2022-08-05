import { Mode } from "../../mode.js";
import { FunctionKeyLabel, MainKeyIndex } from '../../keys.js';
export class LastStepInput extends Mode {
    constructor(context, back) {
        super(context);
        this.back = back;
    }
    onMainKeyPress(keyIndex) {
        if (keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            const pattern = this.context.memoryState().activePattern();
            pattern.lastStep.set(keyIndex + 1);
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