import {Step} from "../../audio/tr909/pattern.js"
import {MachineContext} from "../context.js"
import {FunctionKeyLabel, KeyState, MainKeyIndex, PatternEditMode, ZeroBasedIndices} from "../keys.js"
import {consumed, Mode} from "../modes.js"
import {Utils} from "../utils.js"

export default class extends Mode {
    private inputMode: NonNullable<Mode>

    constructor(context: MachineContext) {
        super(context)

        this.context.updateDisplay('none')
        this.context.updatePatternGroupKeys(this.context.machine.state.patternGroupIndex.get(), true)


        this.inputMode = new SelectMode(context)

        const updateInputMode = () => {
            this.inputMode.terminate()

            if (this.context.isPlaying()) {
                const patternEditMode = this.context.patternEditMode.get()
                if (patternEditMode === PatternEditMode.Step) {
                    this.inputMode = new StepInputMode(context)
                } else if (patternEditMode === PatternEditMode.Tap) {
                    this.inputMode = new TapInputMode(context)
                } else {
                    throw new Error(`Unknown PatternInputMode(${patternEditMode})`)
                }
            } else {
                this.inputMode = new SelectMode(context)
            }
            console.debug(`mode: ${this.context.modeName()}`)
        }

        this.with(this.context.patternEditMode.addObserver(updateInputMode))
        this.with(this.context.machine.transport.addObserver(updateInputMode, true))
        this.with(this.context.watchPatternEditKeys())
        this.with({
            terminate: () => {
                this.inputMode.terminate()
                this.context.clearPatternEditKeys()
            }
        })
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): consumed {
        return this.inputMode.onFunctionKeyPress(label)
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        return this.inputMode.onMainKeyPress(keyIndex)
    }

    name(): string {
        return `Pattern Write (${this.inputMode.name()})`
    }
}

class SelectMode extends Mode {
    private clear: boolean = false

    constructor(context: MachineContext) {
        super(context)

        console.assert(!context.machine.transport.isPlaying())
        this.with(this.context.machine.state.patternIndex
            .addObserver((patternIndex) => this.context.mainKeys
                .activate(index => patternIndex === index
                    ? KeyState.Blink
                    : KeyState.Off, ZeroBasedIndices.StepKeys), true))
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): consumed {
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
        if (this.context.maySwitchIndex(label, FunctionKeyLabel.PatternEditMode, this.context.patternEditMode)) {
            return true
        }
        if (label === FunctionKeyLabel.Clear) {
            this.clear = true
            return true
        }
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.Clear) {
            this.clear = false
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        if (keyIndex === MainKeyIndex.TotalAccent) return false
        this.context.machine.state.patternIndex.set(keyIndex as number)
        if (this.clear) {
            this.context.machine.state.activePattern().clear()
        }
        return true
    }

    name(): string {
        return 'Select/Clear'
    }
}

class TapInputMode extends Mode {
    constructor(context: MachineContext) {
        super(context)

        console.assert(context.machine.transport.isPlaying())
        this.with(this.context.startStepRunningAnimation())
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): consumed {
        if (this.context.mayToggle(label, FunctionKeyLabel.CycleGuide, this.context.machine.state.cycleGuideMode)) {
            return true
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

        console.assert(context.machine.transport.isPlaying())
        this.with(this.context.startStepRunningAnimation())
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