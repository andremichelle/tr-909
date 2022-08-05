import { UIContext } from "../../context.js"
import { FunctionKeyLabel, KeyState, MainKeyIndex, ZeroBasedIndices } from "../../keys.js"
import { complete, Mode } from "../../mode.js"

export interface PatternEditor {
    clearPattern(): void

    copyPattern(): void
}

export class SelectPatternMode extends Mode {
    constructor(context: UIContext, private readonly editor: PatternEditor) {
        super(context)

        console.assert(!context.machine.transport.isPlaying())
        this.with(this.context.memoryState().patternIndex
            .addObserver((patternIndex) => this.context.mainKeys
                .activate(index => patternIndex === index
                    ? KeyState.Blink
                    : KeyState.Off, ZeroBasedIndices.StepKeys), true))
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): complete {
        if (this.context.maySwitchToTrackPlayMode(label)) {
            return true
        }
        if (this.context.maySwitchToPatternPlayMode(label)) {
            return true
        }
        if (this.context.maySwitchToTrackWriteMode(label)) {
            return true
        }
        if (this.context.maySwitchToPatternWriteMode(label)) {
            return true
        }
        if (this.context.maySwitchPatternEditMode(label)) {
            return true
        }
        if (this.context.mayToggle(label, FunctionKeyLabel.CycleGuide, this.context.memoryState().cycleGuideMode)) {
            return true
        }
        if (label === FunctionKeyLabel.Clear) {
            this.editor.clearPattern()
            return false
        }
        return true
    }

    onMainKeyPress(keyIndex: MainKeyIndex): complete {
        if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {
            return false
        }
        if (keyIndex === MainKeyIndex.Step11 && this.context.isShiftKeyPressed()) {
            this.editor.copyPattern()
            return false
        }
        this.context.memoryState().patternIndex.set(keyIndex as number)
        return true
    }

    name(): string {
        return 'Select'
    }
}