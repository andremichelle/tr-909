import {panic, Terminable} from "@opendaw/lib-std"
import type {UIContext} from "../context"
import {FunctionKeyLabel, MainKeyLabel, StepsEditingMode} from "../keys"
import {complete, Mode} from "../mode"
import {ClearPatternMode, ClearStepMode, ClearTapMode} from "./pattern-write/clear"
import {CopyPatternMode} from "./pattern-write/copy"
import {InstrumentSelectInput} from "./pattern-write/instrument-select"
import {LastStepInput} from "./pattern-write/last-step"
import {PatternEditor, SelectPatternMode} from "./pattern-write/pattern-select"
import {ShuffleFlamInput} from "./pattern-write/shuffle-flam"
import {StepModeEditor, StepsMode} from "./pattern-write/steps"
import {TapInputEditor, TapInputMode} from "./pattern-write/tap"

class IdleMode extends Mode {
    constructor(context: UIContext) {super(context)}
    name(): string {return "Idle"}
}

export class PatternWriteMode extends Mode implements PatternEditor, StepModeEditor, TapInputEditor {
    #inputMode: Mode

    constructor(context: UIContext) {
        super(context)
        context.updatePatternGroupKeys(context.memoryState().patternGroupIndex.getValue(), true)
        this.#inputMode = new IdleMode(context)
        const switchInputMode = () => this.#switchTo(() => {
            if (!context.isPlaying()) {return new SelectPatternMode(context, this)}
            const mode = context.stepsEditMode.getValue()
            switch (mode) {
                case StepsEditingMode.Step:
                    return new StepsMode(context, this)
                case StepsEditingMode.Tap:
                    return new TapInputMode(context, this)
                default:
                    return panic(`Unknown StepsEditingMode(${mode})`)
            }
        })
        this.own(context.machine.transport.subscribe(switchInputMode))
        this.own(context.stepsEditMode.subscribe(switchInputMode))
        this.own(context.watchPatternEditKeys())
        this.own(Terminable.create(() => {
            this.#inputMode.terminate()
            context.clearPatternEditKeys()
        }))
        switchInputMode()
    }

    editLastStep(): void {this.#switchTo(() => new LastStepInput(this.context, this.#backToStepMode))}
    editShuffleFlam(): void {this.#switchTo(() => new ShuffleFlamInput(this.context, this.#backToStepMode))}
    clearPattern(): void {this.#switchTo(() => new ClearPatternMode(this.context, this.#backToSelectMode))}
    copyPattern(): void {this.#switchTo(() => new CopyPatternMode(this.context, this.#backToSelectMode))}
    clearStepMode(): void {this.#switchTo(() => new ClearStepMode(this.context, this.#backToStepMode))}
    clearTapMode(): void {this.#switchTo(() => new ClearTapMode(this.context, this.#backToTapMode))}
    selectInstrument(): void {this.#switchTo(() => new InstrumentSelectInput(this.context, this.#backToStepMode))}

    onFunctionKeyPress(label: FunctionKeyLabel): complete {return this.#inputMode.onFunctionKeyPress(label)}
    onFunctionKeyRelease(label: FunctionKeyLabel): void {this.#inputMode.onFunctionKeyRelease(label)}
    onMainKeyPress(label: MainKeyLabel): complete {return this.#inputMode.onMainKeyPress(label)}

    name(): string {return `Pattern Write (${this.#inputMode.name()})`}

    readonly #backToSelectMode = (): void => this.#switchTo(() => new SelectPatternMode(this.context, this))
    readonly #backToStepMode = (): void => this.#switchTo(() => new StepsMode(this.context, this))
    readonly #backToTapMode = (): void => this.#switchTo(() => new TapInputMode(this.context, this))

    #switchTo(factory: () => Mode): void {
        this.#inputMode.terminate()
        this.#inputMode = factory()
    }
}
