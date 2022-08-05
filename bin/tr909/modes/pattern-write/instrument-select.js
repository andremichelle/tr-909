import { FunctionKeyLabel } from "../../keys.js";
import { Mode } from "../../mode.js";
import { Utils } from "../../utils.js";
export class InstrumentSelectInput extends Mode {
    constructor(context, back) {
        super(context);
        this.back = back;
        this.with(this.context.instrumentMode.addObserver((instrumentMode) => {
            const toButtonStates = Utils.instrumentModeToButtonStates(instrumentMode);
            this.context.mainKeys.forEach((key, keyIndex) => key.setState(toButtonStates(keyIndex)));
        }, true));
    }
    onFunctionKeyRelease(label) {
        if (label === FunctionKeyLabel.InstrumentSelect) {
            this.back();
        }
    }
    onMainKeyPress(keyIndex) {
        const mainKeyIndices = this.context.getConcurrentMainKeys().add(keyIndex);
        this.context.instrumentMode.set(Utils.buttonIndicesToInstrumentMode(mainKeyIndices));
        return mainKeyIndices.size > 1;
    }
    name() {
        return 'Instrument Select';
    }
}
//# sourceMappingURL=instrument-select.js.map