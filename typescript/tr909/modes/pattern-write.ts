import {Step} from "../../audio/tr909/pattern.js"
import {MachineContext} from "../context.js"
import {FunctionKeyIndex, KeyState, MainKeyIndex} from "../keys.js"
import {consumed, Mode} from "../modes.js"
import {Utils} from "../utils.js"

export default class extends Mode {
    private readonly inputMode: Mode

    constructor(context: MachineContext) {
        super(context)

        this.inputMode = this.with(new TapInputMode(context))
        // this.inputMode = this.with(new StepInputMode(context))

        this.with(this.context.startStepRunningAnimation())
        this.context.updateBankGroupKeys(this.context.machine.state.bankGroupIndex.get())
        this.context.updatePatternGroupKeys(this.context.machine.state.patternGroupIndex.get(), true)
        this.with(this.context.machine.state.guideMode
            .addObserver(mode => this.context.functionKeys.byIndex(FunctionKeyIndex.CycleGuideLastMeasure)
                .setState(mode ? KeyState.On : KeyState.Off), true))
    }

    onFunctionKeyPress(keyIndex: FunctionKeyIndex, shift: boolean): consumed {
        if (shift) {
            if (this.context.maySwitchToTrackWriteMode(keyIndex)) {
                return true
            }
            if (this.context.maySwitchToPatternWriteMode(keyIndex)) {
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

        this.context.functionKeys.byIndex(FunctionKeyIndex.BackTap).setState(KeyState.On)
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
        this.context.functionKeys.byIndex(FunctionKeyIndex.TempoStep).setState(KeyState.On)
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