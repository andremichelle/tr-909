import { ObservableValue, Terminable, TerminableVoid } from "../../../lib/common.js"
import { UIContext } from "../../context.js"
import { FunctionKeyLabel, MainKeyIndex } from "../../keys.js"
import { complete, Mode } from "../../mode.js"
import { Utils } from "../../utils.js"
import { WhileStepEdit } from "../pattern-write.js"

export class StepsMode extends Mode {
    private clearSubscription: Terminable = TerminableVoid

    constructor(context: UIContext, readonly editing: ObservableValue<WhileStepEdit>) {
        super(context)

        this.with(this.context.watchPatternStepsKeys())
        this.with(this.context.startStepRunningAnimation())
        this.with({ terminate: () => this.clearSubscription.terminate() })
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): complete {
        if (this.context.maySwitchPatternEditMode(label)) {
            return true
        }
        if (label === FunctionKeyLabel.LastStep) {
            this.editing.set(WhileStepEdit.LastStep)
            return false
        }
        if (label === FunctionKeyLabel.Scale) {
            this.context.memoryState().activePattern().cycleToNextScale()
            return true
        }
        if (label === FunctionKeyLabel.ShuffleFlam) {
            this.editing.set(WhileStepEdit.ShuffleFlam)
            return false
        }
        if (label === FunctionKeyLabel.InstrumentSelect) {
            this.editing.set(WhileStepEdit.InstrumentSelect)
            return false
        }
        if (label === FunctionKeyLabel.Clear) {
            this.clearSubscription = this.context.machine.processorStepIndex
                .addObserver(stepIndex => {
                    const instrumentMode = this.context.instrumentMode.get()
                    const pattern = this.context.memoryState().activePattern()
                    Utils.clearPatternStep(pattern, instrumentMode, stepIndex)
                }, true)
            return true
        }
        return true
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.Clear) {
            this.clearSubscription.terminate()
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex): complete {
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