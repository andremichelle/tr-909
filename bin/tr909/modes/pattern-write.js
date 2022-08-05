import { ObservableValueImpl } from "../../lib/common.js";
import { PatternEditingMode } from "../keys.js";
import { Mode } from "../mode.js";
import { InstrumentSelectInput } from "./pattern-write/instrument-select.js";
import { LastStepInput } from "./pattern-write/last-step.js";
import { SelectPatternMode } from "./pattern-write/select-pattern.js";
import { ShuffleFlamInput } from "./pattern-write/shuffle-flam.js";
import { StepsMode } from "./pattern-write/steps.js";
import { TapInputMode } from "./pattern-write/tap.js";
export var WhileStepEdit;
(function (WhileStepEdit) {
    WhileStepEdit[WhileStepEdit["Off"] = 0] = "Off";
    WhileStepEdit[WhileStepEdit["LastStep"] = 1] = "LastStep";
    WhileStepEdit[WhileStepEdit["ShuffleFlam"] = 2] = "ShuffleFlam";
    WhileStepEdit[WhileStepEdit["InstrumentSelect"] = 3] = "InstrumentSelect";
})(WhileStepEdit || (WhileStepEdit = {}));
export default class extends Mode {
    constructor(context) {
        super(context);
        this.quickEdit = new ObservableValueImpl(WhileStepEdit.Off);
        this.back = () => this.quickEdit.set(WhileStepEdit.Off);
        this.context.updatePatternGroupKeys(this.context.memoryState().patternGroupIndex.get(), true);
        this.inputMode = new Idle(context);
        const updateInputMode = () => {
            this.inputMode.terminate();
            if (this.context.isPlaying()) {
                const editing = this.quickEdit.get();
                if (editing === WhileStepEdit.Off) {
                    const patternEditMode = this.context.patternEditMode.get();
                    if (patternEditMode === PatternEditingMode.StepEditing) {
                        this.inputMode = new StepsMode(context, this.quickEdit);
                    }
                    else if (patternEditMode === PatternEditingMode.TapInput) {
                        this.inputMode = new TapInputMode(context, this.quickEdit);
                    }
                    else {
                        throw new Error(`Unknown PatternInputMode(${patternEditMode})`);
                    }
                }
                else if (editing === WhileStepEdit.LastStep) {
                    this.inputMode = new LastStepInput(context, this.back);
                }
                else if (editing === WhileStepEdit.ShuffleFlam) {
                    this.inputMode = new ShuffleFlamInput(context, this.back);
                }
                else if (editing === WhileStepEdit.InstrumentSelect) {
                    this.inputMode = new InstrumentSelectInput(context, this.back);
                }
                else {
                    throw new Error(`Unknown TransientEditing(${WhileStepEdit[editing]})`);
                }
            }
            else {
                this.inputMode = new SelectPatternMode(context);
            }
            console.debug(`mode: ${this.context.modeName()}`);
        };
        updateInputMode();
        this.with(this.quickEdit.addObserver(updateInputMode, false));
        this.with(this.context.machine.transport.addObserver(updateInputMode, false));
        this.with(this.context.patternEditMode.addObserver(updateInputMode));
        this.with(this.context.watchPatternEditKeys());
        this.with({
            terminate: () => {
                this.inputMode.terminate();
                this.context.clearPatternEditKeys();
            }
        });
    }
    onFunctionKeyPress(label) {
        return this.inputMode.onFunctionKeyPress(label);
    }
    onFunctionKeyRelease(label) {
        this.inputMode.onFunctionKeyRelease(label);
    }
    onMainKeyPress(keyIndex) {
        return this.inputMode.onMainKeyPress(keyIndex);
    }
    name() {
        return `Pattern Write (${this.inputMode.name()})`;
    }
}
class Idle extends Mode {
    name() {
        return 'Idle';
    }
}
//# sourceMappingURL=pattern-write.js.map