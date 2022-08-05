import { FunctionKeyLabel } from '../../keys.js';
import { Mode } from "../../mode.js";
export class CopyPatternMode extends Mode {
    constructor(context, back) {
        super(context);
        this.back = back;
    }
    onFunctionKeyRelease(label) {
        if (label === FunctionKeyLabel.Shift) {
            this.back();
        }
    }
    name() {
        return 'Copy';
    }
}
//# sourceMappingURL=copy.js.map