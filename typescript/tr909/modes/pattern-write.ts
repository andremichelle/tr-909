import { UIContext } from "../context.js"
import { FunctionKeyLabel, MainKeyIndex, MainKeyLabel } from "../keys.js"
import { complete, Mode, StepsEditingMode } from "../mode.js"
import { ClearPatternMode, ClearStepMode, ClearTapMode } from './pattern-write/clear.js'
import { CopyPatternMode } from "./pattern-write/copy.js"
import { InstrumentSelectInput } from "./pattern-write/instrument-select.js"
import { LastStepInput } from "./pattern-write/last-step.js"
import { PatternEditor, SelectPatternMode } from "./pattern-write/pattern-select.js"
import { ShuffleFlamInput } from "./pattern-write/shuffle-flam.js"
import { StepModeEditor, StepsMode } from "./pattern-write/steps.js"
import { TapInputEditor, TapInputMode } from "./pattern-write/tap.js"

export default class extends Mode implements PatternEditor, StepModeEditor, TapInputEditor {
    private readonly backToSelectMode: () => void = () => this.inputMode = new SelectPatternMode(this.context, this)
    private readonly backToStepMode: () => void = () => this.inputMode = new StepsMode(this.context, this)
    private readonly backToTapMode: () => void = () => this.inputMode = new TapInputMode(this.context, this)

    private inputMode: Mode

    constructor(context: UIContext) {
        super(context)

        this.context.updatePatternGroupKeys(this.context.memoryState().patternGroupIndex.get(), true)

        this.inputMode = new SelectPatternMode(context, this)

        const switchInputMode = () => {
            this.inputMode.terminate()
            if (this.context.isPlaying()) {
                const mode = this.context.stepsEditMode.get()
                if (mode === StepsEditingMode.Step) {
                    this.inputMode = new StepsMode(context, this)
                } else if (mode === StepsEditingMode.Tap) {
                    this.inputMode = new TapInputMode(context, this)
                } else {
                    throw new Error(`Unknown StepsEditingMode(${mode})`)
                }
            } else {
                this.inputMode = new SelectPatternMode(context, this)
            }
        }

        this.with(this.context.machine.transport.addObserver(switchInputMode, false))
        this.with(this.context.stepsEditMode.addObserver(switchInputMode))
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

    clearPattern(): void {
        console.assert(!this.context.isPlaying())
        this.inputMode.terminate()
        this.inputMode = new ClearPatternMode(this.context, this.backToSelectMode)
    }

    copyPattern(): void {
        console.assert(!this.context.isPlaying())
        this.inputMode.terminate()
        this.inputMode = new CopyPatternMode(this.context, this.backToSelectMode)
    }

    clearStepMode(): void {
        console.assert(this.context.isPlaying())
        this.inputMode.terminate()
        this.inputMode = new ClearStepMode(this.context, this.backToStepMode)
    }

    clearTapMode(): void {
        console.assert(this.context.isPlaying())
        this.inputMode.terminate()
        this.inputMode = new ClearTapMode(this.context, this.backToTapMode)
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

    onMainKeyPress(label: MainKeyLabel<any>): complete {
        return this.inputMode.onMainKeyPress(label)
    }

    name(): string {
        return `Pattern Write (${this.inputMode.name()})`
    }
}