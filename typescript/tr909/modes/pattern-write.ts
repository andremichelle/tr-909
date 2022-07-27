import {Step} from "../../audio/tr909/pattern.js"
import {ObservableValue, ObservableValueImpl, Terminable, TerminableVoid} from "../../lib/common.js"
import {MachineContext} from "../context.js"
import {FunctionKeyLabel, Key, KeyState, MainKeyIndex, PatternEditMode, ZeroBasedIndices} from "../keys.js"
import {consumed, Mode} from "../modes.js"
import {InstrumentMode, Utils} from "../utils.js"

enum TransientEditing {
    Off, LastStep, ShuffleFlam, InstrumentSelect
}

export default class extends Mode {
    readonly transientEditing: ObservableValue<TransientEditing> = new ObservableValueImpl(TransientEditing.Off)

    private inputMode: NonNullable<Mode>

    constructor(context: MachineContext) {
        super(context)

        this.context.updateDisplay('none')
        this.context.updatePatternGroupKeys(this.context.machine.state.patternGroupIndex.get(), true)

        this.inputMode = new PatternSelectMode(context)

        const updateInputMode = () => {
            this.inputMode.terminate()

            if (this.context.isPlaying()) {
                const editing = this.transientEditing.get()
                if (editing === TransientEditing.Off) {
                    const patternEditMode = this.context.patternEditMode.get()
                    if (patternEditMode === PatternEditMode.Step) {
                        this.inputMode = new StepInputMode(context, this.transientEditing)
                    } else if (patternEditMode === PatternEditMode.Tap) {
                        this.inputMode = new TapInputMode(context, this.transientEditing)
                    } else {
                        throw new Error(`Unknown PatternInputMode(${patternEditMode})`)
                    }
                } else if (editing === TransientEditing.InstrumentSelect) {
                    this.inputMode = new InstrumentSelectInput(context, this.transientEditing)
                }
            } else {
                this.inputMode = new PatternSelectMode(context)
            }
            console.debug(`mode: ${this.context.modeName()}`)
        }

        this.with(this.transientEditing.addObserver(updateInputMode, true))
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

    onFunctionKeyRelease(label: FunctionKeyLabel<any>) {
        this.inputMode.onFunctionKeyRelease(label)
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        return this.inputMode.onMainKeyPress(keyIndex)
    }

    name(): string {
        return `Pattern Write (${this.inputMode.name()} > ${TransientEditing[this.transientEditing.get()]})`
    }
}

class PatternSelectMode extends Mode {
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
        return 'Pattern Select/Clear'
    }
}

class StepInputMode extends Mode {
    private clearSubscription: Terminable = TerminableVoid

    constructor(context: MachineContext, readonly transientEdit: ObservableValue<TransientEditing>) {
        super(context)

        this.with(this.context.watchPatternStepsKeys())
        this.with(this.context.startStepRunningAnimation())
        this.with({terminate: () => this.clearSubscription.terminate()})
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): consumed {
        if (this.context.maySwitchIndex(label, FunctionKeyLabel.PatternEditMode, this.context.patternEditMode)) {
            return true
        }
        if (label === FunctionKeyLabel.LastStep) {
            this.transientEdit.set(TransientEditing.LastStep)
            return true
        }
        if (label === FunctionKeyLabel.ShuffleFlam) {
            this.transientEdit.set(TransientEditing.ShuffleFlam)
            return true
        }
        if (label === FunctionKeyLabel.InstrumentSelect) {
            this.transientEdit.set(TransientEditing.InstrumentSelect)
            return true
        }
        if (label === FunctionKeyLabel.Clear) {
            this.clearSubscription = this.context.machine.processorStepIndex
                .addObserver(stepIndex => {
                    const instrumentMode = this.context.instrumentMode.get()
                    const pattern = this.context.machine.state.activePattern()
                    Utils.clearPatternStep(pattern, instrumentMode, stepIndex)
                }, true)
            return true
        }
        if (label === FunctionKeyLabel.InstrumentSelect) {
            // deactivate step-input
        }
        return false
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.Clear) {
            this.clearSubscription.terminate()
        }
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

class TapInputMode extends Mode {
    private clearPressed: boolean = false
    private clearSubscription: Terminable = TerminableVoid

    constructor(context: MachineContext, readonly transientEdit: ObservableValue<TransientEditing>) {
        super(context)

        this.context.resetMainKeys()
        this.with(this.context.startStepRunningAnimation())
        this.with({terminate: () => this.clearSubscription.terminate()})
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): consumed {
        if (this.context.maySwitchIndex(label, FunctionKeyLabel.PatternEditMode, this.context.patternEditMode)) {
            return true
        }
        if (label === FunctionKeyLabel.Clear) {
            this.clearPressed = true
            this.clearSubscription = this.context.machine.processorStepIndex.addObserver(stepIndex => {
                const instrumentMode = Utils.buttonIndicesToInstrumentMode(this.context.pressedMainKeys)
                if (instrumentMode === InstrumentMode.None || instrumentMode === InstrumentMode.TotalAccent) {
                    return
                }
                const pattern = this.context.machine.state.activePattern()
                Utils.clearPatternStep(pattern, instrumentMode, stepIndex)
            }, true)
            return true
        }
        if (this.context.mayToggle(label, FunctionKeyLabel.CycleGuide, this.context.machine.state.cycleGuideMode)) {
            return true
        }
        return false
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.Clear) {
            this.clearPressed = false
            this.clearSubscription.terminate()
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        if (!this.clearPressed && keyIndex !== MainKeyIndex.TotalAccent) {
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

class InstrumentSelectInput extends Mode {
    constructor(context: MachineContext, readonly transientEditor: ObservableValue<TransientEditing>) {
        super(context)

        this.with(this.context.instrumentMode.addObserver((instrumentMode: InstrumentMode) => {
            const toButtonStates = Utils.instrumentModeToButtonStates(instrumentMode)
            this.context.mainKeys.forEach((key: Key, keyIndex: MainKeyIndex) => key.setState(toButtonStates(keyIndex)))
        }, true))
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.InstrumentSelect) {
            this.transientEditor.set(TransientEditing.Off)
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        this.context.instrumentMode.set(Utils.buttonIndicesToInstrumentMode(this.context.pressedMainKeys))
        return true
    }

    name(): string {
        return 'Instrument Select'
    }
}