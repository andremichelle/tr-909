import { UIContext } from "../context.js"
import { FunctionKeyLabel, MainKeyIndex, StepsEditingMode as StepsEditingMode } from "../keys.js"
import { complete, Mode } from "../mode.js"
import { ClearStepsInput } from './pattern-write/clear-steps.js'
import { InstrumentSelectInput } from "./pattern-write/instrument-select.js"
import { LastStepInput } from "./pattern-write/last-step.js"
import { SelectPatternMode } from "./pattern-write/select-pattern.js"
import { ShuffleFlamInput } from "./pattern-write/shuffle-flam.js"
import { StepModeEditor, StepsMode } from "./pattern-write/steps.js"
import { TapInputMode } from "./pattern-write/tap.js"

export enum PatternEditing {
    Select, Clear,
}

export default class extends Mode implements StepModeEditor {
    private readonly backToStepMode: () => void = () => this.inputMode = new StepsMode(this.context, this)

    private inputMode: Mode

    constructor(context: UIContext) {
        super(context)

        this.context.updatePatternGroupKeys(this.context.memoryState().patternGroupIndex.get(), true)

        this.inputMode = new class extends Mode { name(): string { return '' } }(context)

        const updateInputMode = () => {
            this.inputMode.terminate()

            if (this.context.isPlaying()) {
                const patternEditMode = this.context.stepsEditMode.get()
                if (patternEditMode === StepsEditingMode.Step) {
                    this.inputMode = new StepsMode(context, this)
                } else if (patternEditMode === StepsEditingMode.Tap) {
                    this.inputMode = new TapInputMode(context)
                } else {
                    throw new Error(`Unknown PatternInputMode(${patternEditMode})`)
                }
            } else {
                this.inputMode = new SelectPatternMode(context)
            }
            console.debug(`mode: ${this.context.modeName()}`)
        }
        updateInputMode()

        this.with(this.context.machine.transport.addObserver(updateInputMode, false))
        this.with(this.context.stepsEditMode.addObserver(updateInputMode))
        this.with(this.context.watchPatternEditKeys())
        this.with({
            terminate: () => {
                this.inputMode.terminate()
                this.context.clearPatternEditKeys()
            }
        })
    }

    editLastStep(): void {
        console.assert(this.context.isPlaying())
        this.inputMode.terminate()
        this.inputMode = new LastStepInput(this.context, this.backToStepMode)
    }

    editShuffleFlam(): void {
        console.assert(this.context.isPlaying())
        this.inputMode.terminate()
        this.inputMode = new ShuffleFlamInput(this.context, this.backToStepMode)
    }

    clearSteps(): void {
        console.assert(this.context.isPlaying())
        this.inputMode.terminate()
        this.inputMode = new ClearStepsInput(this.context, this.backToStepMode)
    }

    selectInstrument(): void {
        console.assert(this.context.isPlaying())
        this.inputMode.terminate()
        this.inputMode = new InstrumentSelectInput(this.context, this.backToStepMode)
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