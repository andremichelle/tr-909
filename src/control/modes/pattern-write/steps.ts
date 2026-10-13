import type {UIContext} from "../../context"
import {Instruments} from "../../instrument"
import {FunctionKeyLabel, MainKeyIndex, MainKeyLabel} from "../../keys"
import {complete, Mode} from "../../mode"

export interface StepModeEditor {
    editLastStep(): void
    editShuffleFlam(): void
    selectInstrument(): void
    clearStepMode(): void
}

export class StepsMode extends Mode {
    readonly #editor: StepModeEditor

    constructor(context: UIContext, editor: StepModeEditor) {
        super(context)
        this.#editor = editor
        this.own(context.watchPatternStepsKeys())
        this.own(context.startStepRunningAnimation())
    }

    onFunctionKeyPress(label: FunctionKeyLabel): complete {
        if (this.context.maySwitchPatternEditMode(label)) {return true}
        switch (label) {
            case FunctionKeyLabel.LastStep:
                this.#editor.editLastStep()
                return false
            case FunctionKeyLabel.Scale:
                this.context.activePattern().cycleToNextScale()
                return true
            case FunctionKeyLabel.ShuffleFlam:
                this.#editor.editShuffleFlam()
                return false
            case FunctionKeyLabel.InstrumentSelect:
                this.#editor.selectInstrument()
                return false
            case FunctionKeyLabel.Clear:
                this.#editor.clearStepMode()
                return true
        }
        return true
    }

    onMainKeyPress(label: MainKeyLabel): complete {
        if (label.keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            Instruments.setNextStepValue(this.context.activePattern(), this.context.instrumentMode.getValue(), label.keyIndex)
        }
        return false
    }

    name(): string {return "Step"}
}
