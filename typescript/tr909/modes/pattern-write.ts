import {Step} from "../../audio/tr909/pattern.js"
import {MachineContext, PatternEditMode} from "../context.js"
import {FunctionKeyIndex, MainKeyIndex, PatternEditModeIndices} from "../keys.js"
import {consumed, Mode} from "../modes.js"
import {Utils} from "../utils.js"

export default class extends Mode {
    private inputMode: Mode = null

    constructor(context: MachineContext) {
        super(context)

        this.context.display.show('none')
        this.with(this.context.patternEditMode.addObserver((mode: PatternEditMode) => {
            if (this.inputMode !== null) {
                this.inputMode.terminate()
                this.inputMode = null
            }
            this.context.resetMainKeys()
            if (mode === PatternEditMode.Step) {
                this.inputMode = new StepInputMode(context)
            } else if (mode === PatternEditMode.Tap) {
                this.inputMode = new TapInputMode(context)
            } else {
                throw new Error(`Unknown PatternInputMode(${mode})`)
            }
            this.context.updatePatternEditKeys()
        }, true))
        this.with(this.context.startStepRunningAnimation())
        this.with({
            terminate: () => {
                this.inputMode!.terminate()
                this.context.clearPatternEditKeys()
            }
        })
    }

    onFunctionKeyPress(keyIndex: FunctionKeyIndex, shift: boolean): consumed {
        if (this.inputMode.onFunctionKeyPress(keyIndex, shift)) {
            return true
        }
        if (!this.context.isPlaying()) {
            if (shift) {
                if (this.context.maySwitchToTrackWriteMode(keyIndex)) {
                    return true
                }
                if (this.context.maySwitchToPatternWriteMode(keyIndex)) {
                    return true
                }
                if (this.context.maySwitchIndex(keyIndex, PatternEditModeIndices, this.context.patternEditMode)) {
                    return true
                }
            } else {
                if (this.context.maySwitchToTrackPlayMode(keyIndex)) {
                    return true
                }
                if (this.context.maySwitchToPatternPlayMode(keyIndex)) {
                    return true
                }
            }
        }
        return false
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        return this.inputMode.onMainKeyPress(keyIndex)
    }

    name(): string {
        return 'Pattern Write'
    }
}

class TapInputMode extends Mode {
    constructor(context: MachineContext) {
        super(context)
    }

    onFunctionKeyPress(keyIndex: FunctionKeyIndex, shift: boolean): consumed {
        if (shift) {
        } else {
            if (this.context.mayToggle(keyIndex, FunctionKeyIndex.CycleGuideLastMeasure, this.context.machine.state.cycleGuideMode)) {
                return true
            }
        }
        return false
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        if (keyIndex !== MainKeyIndex.TotalAccent) {
            const machine = this.context.machine
            const playInstrument = Utils.keyIndexToPlayInstrument(keyIndex, this.context.pressedMainKeys)
            const channelIndex = playInstrument.channelIndex
            const step = playInstrument.step
            machine.play(channelIndex, step)
            if (machine.transport.isPlaying()) {
                machine.state.activePattern()
                    .setStep(channelIndex, machine.processorStepIndex.get(), step ? Step.Full : Step.Weak)
            }
            return true
        }
        return false
    }

    name(): string {
        return 'Tap'
    }
}

class StepInputMode extends Mode {
    constructor(context: MachineContext) {
        super(context)

        this.with(this.context.watchPatternStepsKeys())
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        if (keyIndex !== MainKeyIndex.TotalAccent) {
            const pattern = this.context.machine.state.activePattern()
            const instrumentMode = this.context.instrumentMode.get()
            Utils.setNextStepValue(pattern, instrumentMode, keyIndex)
            return true
        }
        return false
    }

    name(): string {
        return 'Step'
    }
}