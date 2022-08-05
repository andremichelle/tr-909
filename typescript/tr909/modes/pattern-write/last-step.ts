import { UIContext } from './../../context'
import { Mode } from "../../mode.js";
import { FunctionKeyLabel, MainKeyIndex } from '../../keys.js';

export class LastStepInput extends Mode {
    constructor(context: UIContext, private readonly back: () => void) {
        super(context)
    }

    onMainKeyPress(keyIndex: MainKeyIndex): boolean {
        if (keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            const pattern = this.context.memoryState().activePattern()
            pattern.lastStep.set(keyIndex + 1)
            return true
        }
        return false
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.LastStep) {
            this.back()
        }
    }

    name(): string {
        return 'Last Step'
    }
}