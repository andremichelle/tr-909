import { Mode, StepsEditingMode } from "../mode.js";
import { ClearPatternMode, ClearStepMode, ClearTapMode } from './pattern-write/clear.js';
import { CopyPatternMode } from "./pattern-write/copy.js";
import { InstrumentSelectInput } from "./pattern-write/instrument-select.js";
import { LastStepInput } from "./pattern-write/last-step.js";
import { SelectPatternMode } from "./pattern-write/pattern-select.js";
import { ShuffleFlamInput } from "./pattern-write/shuffle-flam.js";
import { StepsMode } from "./pattern-write/steps.js";
import { TapInputMode } from "./pattern-write/tap.js";
export default class extends Mode {
    constructor(context) {
        super(context);
        this.backToSelectMode = () => {
            this.inputMode.terminate();
            this.inputMode = new SelectPatternMode(this.context, this);
        };
        this.backToStepMode = () => {
            this.inputMode.terminate();
            this.inputMode = new StepsMode(this.context, this);
        };
        this.backToTapMode = () => {
            this.inputMode.terminate();
            this.inputMode = new TapInputMode(this.context, this);
        };
        this.context.updatePatternGroupKeys(this.context.memoryState().patternGroupIndex.get(), true);
        this.inputMode = new SelectPatternMode(context, this);
        const switchInputMode = () => {
            this.inputMode.terminate();
            if (this.context.isPlaying()) {
                const mode = this.context.stepsEditMode.get();
                if (mode === StepsEditingMode.Step) {
                    this.inputMode = new StepsMode(context, this);
                }
                else if (mode === StepsEditingMode.Tap) {
                    this.inputMode = new TapInputMode(context, this);
                }
                else {
                    throw new Error(`Unknown StepsEditingMode(${mode})`);
                }
            }
            else {
                this.inputMode = new SelectPatternMode(context, this);
            }
        };
        this.with(this.context.machine.transport.addObserver(switchInputMode, false));
        this.with(this.context.stepsEditMode.addObserver(switchInputMode));
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
    clearPattern() {
        console.assert(!this.context.isPlaying());
        this.inputMode.terminate();
        this.inputMode = new ClearPatternMode(this.context, this.backToSelectMode);
    }
    copyPattern() {
        console.assert(!this.context.isPlaying());
        this.inputMode.terminate();
        this.inputMode = new CopyPatternMode(this.context, this.backToSelectMode);
    }
    clearStepMode() {
        console.assert(this.context.isPlaying());
        this.inputMode.terminate();
        this.inputMode = new ClearStepMode(this.context, this.backToStepMode);
    }
    clearTapMode() {
        console.assert(this.context.isPlaying());
        this.inputMode.terminate();
        this.inputMode = new ClearTapMode(this.context, this.backToTapMode);
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
    onMainKeyPress(label) {
        return this.inputMode.onMainKeyPress(label);
    }
    name() {
        return `Pattern Write (${this.inputMode.name()})`;
    }
}
//# sourceMappingURL=pattern-write.js.map