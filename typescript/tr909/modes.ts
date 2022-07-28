import {FlamIndex, Pattern, ShuffleIndex, Step} from "../audio/tr909/pattern.js"
import {ArrayUtils, Terminable, Terminator} from "../lib/common.js"
import {MachineContext} from "./context.js"
import {DisplayValue} from "./display.js"
import {FunctionKeyLabel, Key, KeyState, MainKeyIndex} from "./keys.js"
import {InstrumentMode, Utils} from "./utils.js"

export type consumed = boolean

// noinspection JSUnusedLocalSymbols
export abstract class Mode implements Terminable {
    private readonly terminator: Terminator = new Terminator()

    protected constructor(readonly context: MachineContext) {
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): consumed {
        return false
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        return false
    }

    onMainKeyRelease(keyIndex: MainKeyIndex): void {
    }

    getDisplayValue(): DisplayValue {
        return 'none'
    }

    abstract name(): string

    readonly with = <T extends Terminable>(terminable: T): T => this.terminator.with(terminable)
    readonly terminate = (): void => this.terminator.terminate()
}

export class StepModeState extends Mode {
    constructor(context: MachineContext) {
        super(context)

        this.with(this.context.watchPatternStepsKeys())
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        if (keyIndex === MainKeyIndex.TotalAccent) {
            const pattern = this.context.machine.state.activePattern()
            const instrumentMode = this.context.instrumentMode.get()
            Utils.setNextStepValue(pattern, instrumentMode, keyIndex)
            return true
        }
        return false
    }

    name(): string {
        return 'Step Mode'
    }
}

export class ClearStepsState extends Mode {
    constructor(context: MachineContext) {
        super(context)

        this.with(this.context.watchPatternStepsKeys())
        this.with(this.context.machine.processorStepIndex.addObserver(stepIndex => {
            const instrumentMode = this.context.instrumentMode.get()
            const pattern = this.context.machine.state.activePattern()
            Utils.clearPatternStep(pattern, instrumentMode, stepIndex)
        }, true))
    }

    name(): string {
        return 'Step Clear'
    }
}

export class TapModeState extends Mode {
    constructor(context: MachineContext) {
        super(context)

        this.with(this.context.startStepRunningAnimation())
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
        return 'Tap Mode'
    }
}

export class ClearTapState extends Mode {
    constructor(context: MachineContext) {
        super(context)

        this.with(this.context.startStepRunningAnimation())
        this.with(this.context.machine.processorStepIndex.addObserver(stepIndex => {
            const instrumentMode = Utils.buttonIndicesToInstrumentMode(this.context.pressedMainKeys)
            if (instrumentMode === InstrumentMode.None || instrumentMode === InstrumentMode.TotalAccent) {
                return
            }
            const pattern = this.context.machine.state.activePattern()
            Utils.clearPatternStep(pattern, instrumentMode, stepIndex)
        }, true))
    }

    name(): string {
        return 'Tap Clear'
    }
}

export class InstrumentSelectState extends Mode {
    private readonly update = (instrumentMode: InstrumentMode) => {
        const toButtonStates = Utils.instrumentModeToButtonStates(instrumentMode)
        this.context.mainKeys.forEach((key: Key, keyIndex: MainKeyIndex) => key.setState(toButtonStates(keyIndex)))
    }

    constructor(context: MachineContext) {
        super(context)

        this.with(this.context.instrumentMode.addObserver(this.update, true))
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        this.context.instrumentMode.set(Utils.buttonIndicesToInstrumentMode(this.context.pressedMainKeys))
        return true
    }

    name(): string {
        return 'Instrument Select'
    }
}

export class ShuffleFlamState extends Mode {
    private static GrooveExp: number[] = ArrayUtils.fill(7, index => 1.0 + index * 0.2)

    private readonly subscriptions = this.with(new Terminator())

    constructor(context: MachineContext) {
        super(context)

        const state = this.context.machine.state
        this.with(state.patternIndicesChangeNotification.addObserver((pattern: Pattern) => {
            this.subscriptions.terminate()
            this.subscriptions.with(pattern.shuffleIndex.addObserver(() => this.update(), false))
            this.subscriptions.with(pattern.flamIndex.addObserver(() => this.update(), false))
            this.update()
        }))
        this.update()
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        const pattern = this.context.machine.state.activePattern()
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
        return 'Flam Shuffle'
    }

    private update(): void {
        this.context.mainKeys.deactivate()
        const pattern = this.context.machine.state.activePattern()
        const shuffleIndex = pattern.shuffleIndex.get()
        if (shuffleIndex >= 0 && shuffleIndex < 7) {
            this.context.mainKeys[shuffleIndex].setState(KeyState.On)
        }
        const flamIndex = Pattern.FlamDelays.indexOf(pattern.flamIndex.get())
        if (flamIndex >= 0 && flamIndex <= 7) {
            this.context.mainKeys[MainKeyIndex.Step9 + flamIndex].setState(KeyState.On)
        }
    }
}

export class LastStepSelectState extends Mode {
    private readonly subscriptions = this.with(new Terminator())

    constructor(context: MachineContext) {
        super(context)

        const state = this.context.machine.state
        this.with(state.patternIndicesChangeNotification.addObserver((pattern: Pattern) => {
            this.subscriptions.terminate()
            this.subscriptions.with(pattern.addObserver(() => this.update(), true))
        }))
        this.update()
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        if (keyIndex !== MainKeyIndex.TotalAccent) {
            this.context.machine.state.activePattern().lastStep.set(keyIndex + 1)
            return true
        }
        return false
    }

    update(): void {
        const pattern = this.context.machine.state.activePattern()
        this.context.mainKeys.deactivate()
        this.context.mainKeys[pattern.lastStep.get() - 1].setState(KeyState.On)
    }

    name(): string {
        return 'Last Step'
    }
}