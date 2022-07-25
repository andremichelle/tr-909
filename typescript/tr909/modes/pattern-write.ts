import {Step} from "../../audio/tr909/pattern.js"
import {MachineContext} from "../context.js"
import {FunctionKeyIndex, KeyState, MainKeyIndex} from "../keys.js"
import {MachineMode} from "../modes.js"
import {Utils} from "../utils.js"

export default class extends MachineMode {
    constructor(context: MachineContext) {
        super(context)

        this.context.activateBankGroupKeys(this.context.machine.state.bankGroupIndex.get())
        this.context.activatePatternGroupKeys(this.context.machine.state.patternGroupIndex.get(), true)
        this.context.functionKeys.byIndex(FunctionKeyIndex.BackTap).setState(KeyState.On)
    }

    onFunctionKeyPress(keyIndex: FunctionKeyIndex) {
        if (this.context.shiftMode.get()) {
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