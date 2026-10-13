import type {UIContext} from "../../context"
import {FunctionKeyLabel, KeyState, MainKeyLabel, ZeroBasedIndices} from "../../keys"
import {complete, Mode} from "../../mode"

export interface PatternEditor {
    clearPattern(): void
    copyPattern(): void
}

export class SelectPatternMode extends Mode {
    readonly #editor: PatternEditor

    constructor(context: UIContext, editor: PatternEditor) {
        super(context)
        this.#editor = editor
        this.own(context.memoryState().patternIndex.catchupAndSubscribe(owner => context.mainKeys
            .activate(index => owner.getValue() === index ? KeyState.Blink : KeyState.Off, ZeroBasedIndices.StepKeys)))
    }

    onFunctionKeyPress(label: FunctionKeyLabel): complete {
        const context = this.context
        if (context.maySwitchToTrackPlayMode(label)) {return true}
        if (context.maySwitchToPatternPlayMode(label)) {return true}
        if (context.maySwitchToTrackWriteMode(label)) {return true}
        if (context.maySwitchToPatternWriteMode(label)) {return true}
        if (context.maySwitchPatternEditMode(label)) {return true}
        if (context.mayToggle(label, FunctionKeyLabel.CycleGuide, context.memoryState().cycleGuideMode)) {return true}
        if (label === FunctionKeyLabel.Clear) {
            this.#editor.clearPattern()
            return false
        }
        return true
    }

    onMainKeyPress(label: MainKeyLabel): complete {
        if (label.isStepButton()) {
            this.context.memoryState().patternIndex.setValue(label.toStepIndex())
        } else if (label === MainKeyLabel.Copy) {
            this.#editor.copyPattern()
        }
        return true
    }

    name(): string {return "Select"}
}
