import { Step } from "../../../audio/tr909/memory.js"
import { ToWorkletMessage } from "../../../audio/tr909/messages.js"
import { UIContext } from "../../context.js"
import { FunctionKeyLabel, MainKeyIndex } from "../../keys.js"
import { complete, Mode } from "../../mode.js"
import { Utils } from "../../utils.js"

export interface TapInputEditor {
    clearTapMode(): void
}

export class TapInputMode extends Mode {
    constructor(context: UIContext, private readonly editor: TapInputEditor) {
        super(context)

        this.context.resetMainKeys()
        this.postMessage(true)
        this.with(this.context.startStepRunningAnimation())
        this.with({ terminate: () => this.postMessage(false) })
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): complete {
        if (this.context.maySwitchPatternEditMode(label)) {
            return true
        }
        if (label === FunctionKeyLabel.Scale) {
            this.context.memoryState().activePattern().cycleToNextScale()
            return true
        }
        if (label === FunctionKeyLabel.Clear) {
            this.editor.clearTapMode()
            return false
        }
        if (this.context.mayToggle(label, FunctionKeyLabel.CycleGuide, this.context.memoryState().cycleGuideMode)) {
            return true
        }
        return true
    }

    onMainKeyPress(keyIndex: MainKeyIndex): complete {
        if (keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            const machine = this.context.machine
            const playInstrument = Utils.keyIndexToPlayInstrument(keyIndex, this.context.getConcurrentMainKeys())
            const channelIndex = playInstrument.channelIndex
            const step = playInstrument.step
            machine.play(channelIndex, step)
            if (machine.transport.isPlaying()) {
                this.context.memoryState().activePattern()
                    .setStep(channelIndex, machine.processorStepIndex.get(), step ? Step.Full : Step.Weak)
            }
            return true
        }
        return true
    }

    name(): string {
        return 'Tap'
    }

    private postMessage(enabled: boolean) {
        this.context.machine.worklet.port.postMessage({
            type: 'set-tap-mode',
            enabled
        } as ToWorkletMessage)
    }
}