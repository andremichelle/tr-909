import { ObservableValue, ObservableValueImpl } from "../../lib/common.js"
import { UIContext } from "../context.js"
import { FunctionKeyLabel, MainKeyIndex, PatternEditingMode } from "../keys.js"
import { complete, Mode } from "../mode.js"
import { InstrumentSelectInput } from "./pattern-write/instrument-select.js"
import { PatternMode } from "./pattern-write/pattern.js"
import { ShuffleFlamInput } from "./pattern-write/shuffle-flam.js"
import { StepsMode } from "./pattern-write/steps.js"
import { TapInputMode } from "./pattern-write/tap.js"

export enum InputMode {
    Off, ShuffleFlam, InstrumentSelect
}

export default class extends Mode {
    readonly inputModeValue: ObservableValue<InputMode> = new ObservableValueImpl(InputMode.Off)

    private inputMode: NonNullable<Mode>

    constructor(context: UIContext) {
        super(context)

        this.context.updatePatternGroupKeys(this.context.memoryState().patternGroupIndex.get(), true)

        this.inputMode = new Idle(context)

        const updateInputMode = () => {
            this.inputMode.terminate()

            if (this.context.isPlaying()) {
                const editing = this.inputModeValue.get()
                if (editing === InputMode.Off) {
                    const patternEditMode = this.context.patternEditMode.get()
                    if (patternEditMode === PatternEditingMode.StepEditing) {
                        this.inputMode = new StepsMode(context, this.inputModeValue)
                    } else if (patternEditMode === PatternEditingMode.TapInput) {
                        this.inputMode = new TapInputMode(context, this.inputModeValue)
                    } else {
                        throw new Error(`Unknown PatternInputMode(${patternEditMode})`)
                    }
                } else if (editing === InputMode.ShuffleFlam) {
                    this.inputMode = new ShuffleFlamInput(context, this.inputModeValue)
                } else if (editing === InputMode.InstrumentSelect) {
                    this.inputMode = new InstrumentSelectInput(context, this.inputModeValue)
                } else {
                    throw new Error(`Unknown TransientEditing(${InputMode[editing]})`)
                }
            } else {
                this.inputMode = new PatternMode(context)
            }
            console.debug(`mode: ${this.context.modeName()}`)
        }
        updateInputMode()

        this.with(this.inputModeValue.addObserver(updateInputMode, false))
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