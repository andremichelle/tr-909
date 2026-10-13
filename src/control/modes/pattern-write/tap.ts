import {Terminable} from "@opendaw/lib-std"
import {barsToSeconds} from "@/audio/common"
import type {UIContext} from "../../context"
import {Instruments} from "../../instrument"
import {FunctionKeyLabel, MainKeyIndex, MainKeyLabel} from "../../keys"
import {complete, Mode} from "../../mode"

export interface TapInputEditor {
    clearTapMode(): void
}

export class TapInputMode extends Mode {
    readonly #editor: TapInputEditor

    constructor(context: UIContext, editor: TapInputEditor) {
        super(context)
        this.#editor = editor
        context.resetMainKeys()
        context.machine.setTapMode(true)
        this.own(context.startStepRunningAnimation())
        this.own(Terminable.create(() => context.machine.setTapMode(false)))
    }

    onFunctionKeyPress(label: FunctionKeyLabel): complete {
        const context = this.context
        if (context.maySwitchPatternEditMode(label)) {return true}
        if (label === FunctionKeyLabel.Scale) {
            context.activePattern().cycleToNextScale()
            return true
        }
        if (label === FunctionKeyLabel.Clear) {
            this.#editor.clearTapMode()
            return false
        }
        context.mayToggle(label, FunctionKeyLabel.CycleGuide, context.memoryState().cycleGuideMode)
        return true
    }

    onMainKeyPress(label: MainKeyLabel): complete {
        if (label.keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {return true}
        const context = this.context
        const machine = context.machine
        const {channelIndex, step} = Instruments.playInstrument(label.keyIndex, context.concurrentMainKeys())
        machine.play(channelIndex, step)
        if (machine.transport.isPlaying()) {
            const stepIndex = machine.processorStepIndex.getValue()
            const pattern = context.activePattern()
            const delay = barsToSeconds(pattern.scaleRatio(), machine.preset.tempo.getValue()) / 1000.0
            setTimeout(() => pattern.setStep(channelIndex, stepIndex, step), delay)
        }
        return true
    }

    name(): string {return "Tap"}
}
