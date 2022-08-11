import { FunctionKeyLabel, KeyState } from '../../keys.js';
import { Mode } from "../../mode.js";
import { UIContext } from './../../context.js';
export class CopyPatternMode extends Mode {
    constructor(context, back) {
        super(context);
        this.back = back;
        const state = this.context.memoryState();
        this.bankGroupIndex = state.bankGroupIndex.get();
        this.patternGroupIndex = state.patternGroupIndex.get();
        this.patternIndex = this.context.memoryState().patternIndex.get();
        this.with({ terminate: () => this.reset() });
    }
    onFunctionKeyRelease(label) {
        if (label === FunctionKeyLabel.Shift) {
            this.back();
        }
        else if (UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.BankGroup, index => this.bankGroupIndex = index)) {
            this.context.updateBankGroupKeys(this.bankGroupIndex);
        }
        else if (UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.PatternWrite, index => this.patternGroupIndex = index)) {
            this.context.updatePatternGroupKeys(this.patternGroupIndex, true);
        }
    }
    onMainKeyPress(label) {
        if (label.toNormal().isStepButton()) {
            this.patternIndex = label.toNormal().toStepIndex();
            this.context.resetMainKeys();
            this.context.mainKeys.byIndex(this.patternIndex).setState(KeyState.Blink);
        }
        else if (label.isEnter()) {
            const bank = this.context.machine.memory.banks[this.bankGroupIndex];
            const format = bank.patternByIndices(this.patternGroupIndex, this.patternIndex).serialize();
            this.reset();
            this.context.activePattern().deserialize(format);
        }
        return true;
    }
    name() {
        return 'Copy';
    }
    reset() {
        const state = this.context.memoryState();
        this.context.updateBankGroupKeys(state.bankGroupIndex.get());
        this.context.updatePatternLocationKeys(state.activePattern().location, true);
    }
}
//# sourceMappingURL=copy.js.map