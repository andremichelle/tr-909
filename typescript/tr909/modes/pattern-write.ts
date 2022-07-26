import {Step} from "../../audio/tr909/pattern.js"
import {MachineContext, PatternEditMode} from "../context.js"
import {FunctionKeyIndex, KeyState, MainKeyIndex, PatternEditModeIndices} from "../keys.js"
import {consumed, Mode} from "../modes.js"
import {Utils} from "../utils.js"

export default class extends Mode {
    private inputMode: Mode = null

    constructor(context: MachineContext) {
        super(context)

        this.with(this.context.patternEditMode.addObserver((mode: PatternEditMode) => {
            if (this.inputMode !== null) {
                this.inputMode.terminate()
                this.inputMode = null
            }
            this.context.resetKeys()
            if (mode === PatternEditMode.Step) {
                this.inputMode = new StepInputMode(context)
            } else if (mode === PatternEditMode.Tap) {
                this.inputMode = new TapInputMode(context)
            } else {
                throw new Error(`Unknown PatternInputMode(${mode})`)
            }
            this.context.updatePatternEditKeys()
            this.context.updateBankGroupKeys(this.context.machine.state.bankGroupIndex.get())
            this.context.updatePatternGroupKeys(this.context.machine.state.patternGroupIndex.get(), true)
        }, true))

        this.with({terminate: () => this.inputMode!.terminate()})
    }

    onFunctionKeyPress(keyIndex: FunctionKeyIndex, shift: boolean): consumed {
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
            if (this.context.mayToggle(keyIndex, FunctionKeyIndex.CycleGuideLastMeasure, this.context.machine.state.guideMode)) {
                return true
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

        this.with(this.context.startStepRunningAnimation())
        this.with(this.context.machine.state.guideMode
            .addObserver(mode => this.context.functionKeys.byIndex(FunctionKeyIndex.CycleGuideLastMeasure)
                .setState(mode ? KeyState.On : KeyState.Off), true))
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
        this.with(this.context.startStepRunningAnimation())
        this.with(this.context.machine.state.guideMode
            .addObserver(mode => this.context.functionKeys.byIndex(FunctionKeyIndex.CycleGuideLastMeasure)
                .setState(mode ? KeyState.On : KeyState.Off), true))
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