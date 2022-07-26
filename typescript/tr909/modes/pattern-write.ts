import {Step} from "../../audio/tr909/pattern.js"
import {MachineContext} from "../context.js"
import {FunctionKeyIndex, KeyState, MainKeyIndex} from "../keys.js"
import {MachineMode} from "../modes.js"
import {Utils} from "../utils.js"

export default class extends MachineMode {
    constructor(context: MachineContext) {
        super(context)

        this.with(this.context.startStepRunningAnimation())
        this.with(this.context.machine.state.guideMode
            .addObserver(mode => this.context.functionKeys.byIndex(FunctionKeyIndex.CycleGuideLastMeasure)
                .setState(mode ? KeyState.On : KeyState.Off), true))
        this.context.updateBankGroupKeys(this.context.machine.state.bankGroupIndex.get())
        this.context.updatePatternGroupKeys(this.context.machine.state.patternGroupIndex.get(), true)
        this.context.functionKeys.byIndex(FunctionKeyIndex.BackTap).setState(KeyState.On)
    }

    onFunctionKeyPress(keyIndex: FunctionKeyIndex, shift: boolean): void {
        if (shift) {
            if (this.context.maySwitchToTrackWriteMode(keyIndex)) {
                return
            }
            if (this.context.maySwitchToPatternWriteMode(keyIndex)) {
                return
            }
        } else {
            if (this.context.maySwitchToTrackPlayMode(keyIndex)) {
                return
            }
            if (this.context.maySwitchToPatternPlayMode(keyIndex)) {
                return
            }
            if (this.context.mayToggle(keyIndex, FunctionKeyIndex.CycleGuideLastMeasure, this.context.machine.state.guideMode)) {
                return
            }
        }
    }

    onFunctionKeyRelease(keyIndex: FunctionKeyIndex) {
    }

    onMainKeyPress(keyIndex: MainKeyIndex) {
        if (keyIndex === MainKeyIndex.TotalAccent) return
        const machine = this.context.machine
        const playInstrument = Utils.keyIndexToPlayInstrument(keyIndex, this.context.pressedMainKeys)
        const channelIndex = playInstrument.channelIndex
        const step = playInstrument.step
        machine.play(channelIndex, step)
        if (machine.transport.isPlaying()) {
            machine.state.activePattern()
                .setStep(channelIndex, machine.processorStepIndex.get(), step ? Step.Full : Step.Weak)
        }
    }

    name(): string {
        return 'Pattern Write'
    }
}