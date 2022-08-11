import { Terminator } from "../lib/common.js";
export var StepsEditingMode;
(function (StepsEditingMode) {
    StepsEditingMode[StepsEditingMode["Step"] = 0] = "Step";
    StepsEditingMode[StepsEditingMode["Tap"] = 1] = "Tap";
})(StepsEditingMode || (StepsEditingMode = {}));
export class Mode {
    constructor(context) {
        this.context = context;
        this.terminator = new Terminator();
        this.with = (terminable) => this.terminator.with(terminable);
        this.terminate = () => this.terminator.terminate();
    }
    onFunctionKeyPress(label) {
        return true;
    }
    onFunctionKeyRelease(label) {
    }
    onMainKeyPress(label) {
        return true;
    }
    allowMainKeyValueInput() {
        return false;
    }
    setMainKeyValue(value) {
    }
}
//# sourceMappingURL=mode.js.map