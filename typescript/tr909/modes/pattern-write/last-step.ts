import { FunctionKeyLabel, MainKeyIndex, MainKeyLabel } from '../../keys.js'
import { Mode } from "../../mode.js"
import { UIContext } from './../../context'

export class LastStepInput extends Mode {
    constructor(context: UIContext, private readonly back: () => void) {
        super(context)
    }

    onMainKeyPress(label: MainKeyLabel<any>): boolean {
        if (label.keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            const pattern = this.context.memoryState().activePattern()
            pattern.lastStep.set(label.keyIndex + 1)
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