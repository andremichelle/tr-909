import { FunctionKeyLabel, MainKeyIndex } from '../../keys.js'
import { Mode } from "../../mode.js"
import { Utils } from '../../utils.js'
import { UIContext } from './../../context.js'

export class ClearStepsInput extends Mode {
    constructor(context: UIContext, private readonly back: () => void) {
        super(context)

        this.with(this.context.machine.processorStepIndex.addObserver(stepIndex => {
            const instrumentMode = this.context.instrumentMode.get()
            const pattern = this.context.memoryState().activePattern()
            Utils.clearPatternStep(pattern, instrumentMode, stepIndex)
        }, true))
    }

    onMainKeyPress(keyIndex: MainKeyIndex): boolean {
        return true
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.Clear) {
            this.back()
        }
    }

    name(): string {
        return 'Clear'
    }
}