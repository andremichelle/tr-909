import { UIContext } from "../../context.js"
import { FunctionKeyLabel, KeyState, MainKeyIndex, ZeroBasedIndices } from "../../keys.js"
import { complete, Mode } from "../../mode.js"

export class PatternMode extends Mode {
    private clear: boolean = false

    constructor(context: UIContext) {
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
            this.clear = true
            return false
        }
        return true
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.Clear) {
            this.clear = false
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex): complete {
        if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {
            return false
        }
        if (keyIndex === MainKeyIndex.Step11 && this.context.isShiftKeyPressed()) {
            return false
        }
        this.context.memoryState().patternIndex.set(keyIndex as number)
        if (this.clear) {
            this.context.memoryState().activePattern().clear()
        }
        return true
    }

    name(): string {
        return 'Select'
    }
}