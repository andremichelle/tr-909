import { UIContext } from "../../context.js"
import { FunctionKeyLabel, MainKeyIndex, MainKeyLabel } from "../../keys.js"
import { complete, Mode } from "../../mode.js"
import { Utils } from "../../utils.js"

export interface StepModeEditor {
    editLastStep(): void

    editShuffleFlam(): void

    selectInstrument(): void

    clearStepMode(): void
}

export class StepsMode extends Mode {
    constructor(context: UIContext, private readonly editor: StepModeEditor) {
        super(context)

        this.with(this.context.watchPatternStepsKeys())
        this.with(this.context.startStepRunningAnimation())
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): complete {
        if (this.context.maySwitchPatternEditMode(label)) {
            return true
        }
        if (label === FunctionKeyLabel.LastStep) {
            this.editor.editLastStep()
            return false
        }
        if (label === FunctionKeyLabel.Scale) {
            this.context.memoryState().activePattern().cycleToNextScale()
            return true
        }
        if (label === FunctionKeyLabel.ShuffleFlam) {
            this.editor.editShuffleFlam()
            return false
        }
        if (label === FunctionKeyLabel.InstrumentSelect) {
            this.editor.selectInstrument()
            return false
        }
        if (label === FunctionKeyLabel.Clear) {
            this.editor.clearStepMode()
            return true
        }
        return true
    }

    onMainKeyPress(label: MainKeyLabel<any>): complete {
        const keyIndex = label.keyIndex
        if (keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            const pattern = this.context.memoryState().activePattern()
            const instrumentMode = this.context.instrumentMode.get()
            Utils.setNextStepValue(pattern, instrumentMode, keyIndex)
            return false
        }
        return false
    }

    name(): string {
        return 'Step'
    }
}