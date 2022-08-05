import { StepsEditingMode as StepsEditingMode } from "../keys.js";
import { Mode } from "../mode.js";
import { ClearStepsInput } from './pattern-write/clear-steps.js';
import { InstrumentSelectInput } from "./pattern-write/instrument-select.js";
import { LastStepInput } from "./pattern-write/last-step.js";
import { SelectPatternMode } from "./pattern-write/select-pattern.js";
import { ShuffleFlamInput } from "./pattern-write/shuffle-flam.js";
import { StepsMode } from "./pattern-write/steps.js";
import { TapInputMode } from "./pattern-write/tap.js";
export var PatternEditing;
(function (PatternEditing) {
    PatternEditing[PatternEditing["Select"] = 0] = "Select";
    PatternEditing[PatternEditing["Clear"] = 1] = "Clear";
})(PatternEditing || (PatternEditing = {}));
export default class extends Mode {
    constructor(context) {
        super(context);
        this.backToStepMode = () => this.inputMode = new StepsMode(this.context, this);
        this.context.updatePatternGroupKeys(this.context.memoryState().patternGroupIndex.get(), true);
        this.inputMode = new class extends Mode {
            name() { return ''; }
        }(context);
        const updateInputMode = () => {
            this.inputMode.terminate();
            if (this.context.isPlaying()) {
                const patternEditMode = this.context.stepsEditMode.get();
                if (patternEditMode === StepsEditingMode.Step) {
                    this.inputMode = new StepsMode(context, this);
                }
                else if (patternEditMode === StepsEditingMode.Tap) {
                    this.inputMode = new TapInputMode(context);
                }
                else {
                    throw new Error(`Unknown PatternInputMode(${patternEditMode})`);
                }
            }
            else {
                this.inputMode = new SelectPatternMode(context);
            }
            console.debug(`mode: ${this.context.modeName()}`);
        };
        updateInputMode();
        this.with(this.context.machine.transport.addObserver(updateInputMode, false));
        this.with(this.context.stepsEditMode.addObserver(updateInputMode));
        this.with(this.context.watchPatternEditKeys());
        this.with({
            terminate: () => {
                this.inputMode.terminate();
                this.context.clearPatternEditKeys();
            }
        });
    }
    editLastStep() {
        console.assert(this.context.isPlaying());
        this.inputMode.terminate();
        this.inputMode = new LastStepInput(this.context, this.backToStepMode);
    }
    editShuffleFlam() {
        console.assert(this.context.isPlaying());
        this.inputMode.terminate();
        this.inputMode = new ShuffleFlamInput(this.context, this.backToStepMode);
    }
    clearSteps() {
        console.assert(this.context.isPlaying());
        this.inputMode.terminate();
        this.inputMode = new ClearStepsInput(this.context, this.backToStepMode);
    }
    selectInstrument() {
        console.assert(this.context.isPlaying());
        this.inputMode.terminate();
        this.inputMode = new InstrumentSelectInput(this.context, this.backToStepMode);
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
//# sourceMappingURL=pattern-write.js.map