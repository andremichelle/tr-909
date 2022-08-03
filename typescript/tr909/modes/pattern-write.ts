import {FlamIndex, Pattern, ShuffleIndex, Step} from "../../audio/tr909/memory.js"
import {ObservableValue, ObservableValueImpl, Terminable, TerminableVoid, Terminator} from "../../lib/common.js"
import {UIContext} from "../context.js"
import {FunctionKeyLabel, Key, KeyState, MainKeyIndex, PatternEditMode, ZeroBasedIndices} from "../keys.js"
import {complete, Mode} from "../mode.js"
import {InstrumentMode, Utils} from "../utils.js"

enum TransientEditing {
    Off, ShuffleFlam, InstrumentSelect
}

export default class extends Mode {
    readonly transientEditing: ObservableValue<TransientEditing> = new ObservableValueImpl(TransientEditing.Off)

    private inputMode: NonNullable<Mode>

    constructor(context: UIContext) {
        super(context)

        this.context.updatePatternGroupKeys(this.context.memoryState().patternGroupIndex.get(), true)

        this.inputMode = new Idle(context)

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
                } else if (editing === TransientEditing.ShuffleFlam) {
                    this.inputMode = new ShuffleFlamInput(context, this.transientEditing)
                } else if (editing === TransientEditing.InstrumentSelect) {
                    this.inputMode = new InstrumentSelectInput(context, this.transientEditing)
                } else {
                    throw new Error(`Unknown TransientEditing(${TransientEditing[editing]})`)
                }
            } else {
                this.inputMode = new SelectMode(context)
            }
            console.debug(`mode: ${this.context.modeName()}`)
        }
        updateInputMode()

        this.with(this.transientEditing.addObserver(updateInputMode, false))
        this.with(this.context.machine.transport.addObserver(updateInputMode, false))
        this.with(this.context.patternEditMode.addObserver(updateInputMode))
        this.with(this.context.watchPatternEditKeys())
        this.with({
            terminate: () => {
                this.inputMode.terminate()
                this.context.clearPatternEditKeys()
            }
        })
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): complete {
        return this.inputMode.onFunctionKeyPress(label)
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>) {
        this.inputMode.onFunctionKeyRelease(label)
    }

    onMainKeyPress(keyIndex: MainKeyIndex): complete {
        return this.inputMode.onMainKeyPress(keyIndex)
    }

    name(): string {
        return `Pattern Write (${this.inputMode.name()})`
    }
}

class Idle extends Mode {
    name(): string {
        return 'Idle'
    }
}

class SelectMode extends Mode {
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

    onMainKeyPress(keyIndex: MainKeyIndex): complete {
        if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) return false
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

class CopyMode extends Mode {
    constructor(context: UIContext) {
        super(context)
    }

    name(): string {
        return 'copy'
    }
}

class StepInputMode extends Mode {
    private editLastStep: boolean = false
    private clearSubscription: Terminable = TerminableVoid

    constructor(context: UIContext, readonly transientEdit: ObservableValue<TransientEditing>) {
        super(context)

        this.with(this.context.watchPatternStepsKeys())
        this.with(this.context.startStepRunningAnimation())
        this.with({terminate: () => this.clearSubscription.terminate()})
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): complete {
        if (this.context.maySwitchPatternEditMode(label)) {
            return true
        }
        if (label === FunctionKeyLabel.LastStep) {
            this.editLastStep = true
            return false
        }
        if (label === FunctionKeyLabel.Scale) {
            this.context.memoryState().activePattern().cycleToNextScale()
            return true
        }
        if (label === FunctionKeyLabel.ShuffleFlam) {
            this.transientEdit.set(TransientEditing.ShuffleFlam)
            return false
        }
        if (label === FunctionKeyLabel.InstrumentSelect) {
            this.transientEdit.set(TransientEditing.InstrumentSelect)
            return false
        }
        if (label === FunctionKeyLabel.Clear) {
            this.clearSubscription = this.context.machine.processorStepIndex
                .addObserver(stepIndex => {
                    const instrumentMode = this.context.instrumentMode.get()
                    const pattern = this.context.memoryState().activePattern()
                    Utils.clearPatternStep(pattern, instrumentMode, stepIndex)
                }, true)
            return true
        }
        return true
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.Clear) {
            this.clearSubscription.terminate()
        } else if (label === FunctionKeyLabel.LastStep) {
            this.editLastStep = false
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex): complete {
        if (keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            const pattern = this.context.memoryState().activePattern()
            if (this.editLastStep) {
                pattern.lastStep.set(keyIndex + 1)
            } else {
                const instrumentMode = this.context.instrumentMode.get()
                Utils.setNextStepValue(pattern, instrumentMode, keyIndex)
            }
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

    constructor(context: UIContext, readonly transientEdit: ObservableValue<TransientEditing>) {
        super(context)

        this.context.resetMainKeys()
        this.with(this.context.startStepRunningAnimation())
        this.with({terminate: () => this.clearSubscription.terminate()})
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
            this.clearPressed = true
            this.clearSubscription = this.context.machine.processorStepIndex.addObserver(stepIndex => {
                const instrumentMode = Utils.buttonIndicesToInstrumentMode(this.context.getConcurrentMainKeys())
                if (instrumentMode !== InstrumentMode.None && instrumentMode !== InstrumentMode.TotalAccent) {
                    const pattern = this.context.memoryState().activePattern()
                    Utils.clearPatternStep(pattern, instrumentMode, stepIndex)
                }
            }, true)
            return true
        }
        if (this.context.mayToggle(label, FunctionKeyLabel.CycleGuide, this.context.memoryState().cycleGuideMode)) {
            return true
        }
        return true
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.Clear) {
            this.clearPressed = false
            this.clearSubscription.terminate()
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex): complete {
        if (!this.clearPressed && keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
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
        return false
    }

    name(): string {
        return 'Tap'
    }
}

class ShuffleFlamInput extends Mode {
    private readonly subscriptions: Terminator = this.with(new Terminator())

    constructor(context: UIContext, readonly transientEditor: ObservableValue<TransientEditing>) {
        super(context)

        const state = this.context.memoryState()
        const update = (): void => {
            context.mainKeys.deactivate()
            const pattern = state.activePattern()
            const shuffleIndex = pattern.shuffleIndex.get()
            if (shuffleIndex >= 0 && shuffleIndex < 7) {
                this.context.mainKeys.byIndex(shuffleIndex).setState(KeyState.On)
            }
            const flamIndex = pattern.flamIndex.get()
            if (flamIndex >= 0 && flamIndex <= 7) {
                this.context.mainKeys.byIndex(MainKeyIndex.Step9 + flamIndex).setState(KeyState.On)
            }
        }
        const watch = (pattern: Pattern): void => {
            this.subscriptions.terminate()
            this.subscriptions.with(pattern.shuffleIndex.addObserver(() => update(), false))
            this.subscriptions.with(pattern.flamIndex.addObserver(() => update(), false))
            update()
        }
        this.with(state.patternIndicesChangeNotification.addObserver((pattern: Pattern) => watch(pattern)))
        watch(state.activePattern())
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.ShuffleFlam) {
            this.transientEditor.set(TransientEditing.Off)
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex): complete {
        const pattern = this.context.memoryState().activePattern()
        if (keyIndex <= MainKeyIndex.Step7) {
            pattern.shuffleIndex.set(keyIndex as ShuffleIndex)
            return true
        } else if (keyIndex >= MainKeyIndex.Step9 && keyIndex <= MainKeyIndex.Step16) {
            const flamIndex = keyIndex - MainKeyIndex.Step9
            pattern.flamIndex.set(flamIndex as FlamIndex)
            return true
        }
        return false
    }

    name(): string {
        return 'Shuffle/Flam'
    }
}

class InstrumentSelectInput extends Mode {
    constructor(context: UIContext, readonly transientEditor: ObservableValue<TransientEditing>) {
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

    onMainKeyPress(keyIndex: MainKeyIndex): complete {
        const mainKeyIndices = this.context.getConcurrentMainKeys().add(keyIndex)
        this.context.instrumentMode.set(Utils.buttonIndicesToInstrumentMode(mainKeyIndices))
        return mainKeyIndices.size > 1
    }

    name(): string {
        return 'Instrument Select'
    }
}