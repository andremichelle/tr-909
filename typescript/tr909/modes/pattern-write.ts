import { ObservableValue, ObservableValueImpl } from "../../lib/common.js"
import { UIContext } from "../context.js"
import { FunctionKeyLabel, MainKeyIndex, PatternEditingMode } from "../keys.js"
import { complete, Mode } from "../mode.js"
import { InstrumentSelectInput } from "./pattern-write/instrument-select.js"
import { LastStepInput } from "./pattern-write/last-step.js"
import { SelectPatternMode } from "./pattern-write/select-pattern.js"
import { ShuffleFlamInput } from "./pattern-write/shuffle-flam.js"
import { StepsMode } from "./pattern-write/steps.js"
import { TapInputMode } from "./pattern-write/tap.js"

export enum WhileStepEdit {
    Off, LastStep, ShuffleFlam, InstrumentSelect
}

export default class extends Mode {
    private readonly quickEdit: ObservableValue<WhileStepEdit> = new ObservableValueImpl(WhileStepEdit.Off)
    private readonly back: () => void = () => this.quickEdit.set(WhileStepEdit.Off)

    private inputMode: NonNullable<Mode>

    constructor(context: UIContext) {
        super(context)

        this.context.updatePatternGroupKeys(this.context.memoryState().patternGroupIndex.get(), true)

        this.inputMode = new Idle(context)

        const updateInputMode = () => {
            this.inputMode.terminate()

            if (this.context.isPlaying()) {
                const editing = this.quickEdit.get()
                if (editing === WhileStepEdit.Off) {
                    const patternEditMode = this.context.patternEditMode.get()
                    if (patternEditMode === PatternEditingMode.StepEditing) {
                        this.inputMode = new StepsMode(context, this.quickEdit)
                    } else if (patternEditMode === PatternEditingMode.TapInput) {
                        this.inputMode = new TapInputMode(context, this.quickEdit)
                    } else {
                        throw new Error(`Unknown PatternInputMode(${patternEditMode})`)
                    }
                } else if (editing === WhileStepEdit.LastStep) {
                    this.inputMode = new LastStepInput(context, this.back)
                } else if (editing === WhileStepEdit.ShuffleFlam) {
                    this.inputMode = new ShuffleFlamInput(context, this.back)
                } else if (editing === WhileStepEdit.InstrumentSelect) {
                    this.inputMode = new InstrumentSelectInput(context, this.back)
                } else {
                    throw new Error(`Unknown TransientEditing(${WhileStepEdit[editing]})`)
                }
            } else {
                this.inputMode = new SelectPatternMode(context)
            }
            console.debug(`mode: ${this.context.modeName()}`)
        }
        updateInputMode()

        this.with(this.quickEdit.addObserver(updateInputMode, false))
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