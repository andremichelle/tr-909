import { FunctionKeyLabel, MainKeyIndex } from '../../keys.js';
import { Mode } from "../../mode.js";
import { InstrumentMode, Utils } from '../../utils.js';
export class ClearPatternMode extends Mode {
    constructor(context, back) {
        super(context);
        this.back = back;
    }
    onFunctionKeyRelease(label) {
        if (label === FunctionKeyLabel.Clear) {
            this.back();
        }
    }
    onMainKeyPress(label) {
        if (label.keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            this.context.memoryState().activePatternGroup().patterns[label.keyIndex].clear();
        }
        return true;
    }
    name() {
        return 'Clear';
    }
}
export class ClearStepMode extends Mode {
    constructor(context, back) {
        super(context);
        this.back = back;
        this.with(this.context.startStepRunningAnimation());
        this.with(this.context.machine.processorStepIndex.addObserver(stepIndex => {
            const instrumentMode = this.context.instrumentMode.get();
            const pattern = this.context.memoryState().activePattern();
            Utils.clearPatternStep(pattern, instrumentMode, stepIndex);
        }, true));
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
export class ClearTapMode extends Mode {
    constructor(context, back) {
        super(context);
        this.back = back;
        this.with(this.context.startStepRunningAnimation());
        this.with(this.context.machine.processorStepIndex.addObserver(stepIndex => {
            const instrumentMode = Utils.buttonIndicesToInstrumentMode(this.context.getConcurrentMainKeys());
            if (instrumentMode !== InstrumentMode.None && instrumentMode !== InstrumentMode.TotalAccent) {
                const pattern = this.context.memoryState().activePattern();
                Utils.clearPatternStep(pattern, instrumentMode, stepIndex);
            }
        }, true));
    }
    onFunctionKeyRelease(label) {
        if (label === FunctionKeyLabel.Clear) {
            this.back();
        }
    }
    onMainKeyPress(label) {
        return false;
    }
    name() {
        return 'Clear';
    }
}
//# sourceMappingURL=clear.js.map