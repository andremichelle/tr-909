import {Exec, int, Terminable} from "@opendaw/lib-std"
import {BankIndex, PatternGroupIndex} from "@/audio/memory"
import {UIContext} from "../../context"
import {FunctionKeyLabel, KeyState, MainKeyLabel} from "../../keys"
import {complete, Mode} from "../../mode"

export class CopyPatternMode extends Mode {
    readonly #back: Exec

    #bankGroupIndex: BankIndex
    #patternGroupIndex: PatternGroupIndex
    #patternIndex: int

    constructor(context: UIContext, back: Exec) {
        super(context)
        this.#back = back
        const state = context.memoryState()
        this.#bankGroupIndex = state.bankGroupIndex.getValue()
        this.#patternGroupIndex = state.patternGroupIndex.getValue()
        this.#patternIndex = state.patternIndex.getValue()
        this.own(Terminable.create(() => this.#reset()))
    }

    onFunctionKeyRelease(label: FunctionKeyLabel): void {
        if (label === FunctionKeyLabel.Shift) {
            this.#back()
        } else if (UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.BankGroup, index => this.#bankGroupIndex = index)) {
            this.context.updateBankGroupKeys(this.#bankGroupIndex)
        } else if (UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.PatternWrite, index => this.#patternGroupIndex = index)) {
            this.context.updatePatternGroupKeys(this.#patternGroupIndex, true)
        }
    }

    onMainKeyPress(label: MainKeyLabel): complete {
        if (label.toNormal().isStepButton()) {
            this.#patternIndex = label.toNormal().toStepIndex()
            this.context.resetMainKeys()
            this.context.mainKeys.byIndex(this.#patternIndex).setState(KeyState.Blink)
        } else if (label.isEnter()) {
            const bank = this.context.machine.memory.banks[this.#bankGroupIndex]
            const format = bank.patternByIndices(this.#patternGroupIndex, this.#patternIndex).serialize()
            this.#reset()
            this.context.activePattern().deserialize(format)
        }
        return true
    }

    name(): string {return "Copy"}

    #reset(): void {
        const state = this.context.memoryState()
        this.context.updateBankGroupKeys(state.bankGroupIndex.getValue())
        this.context.updatePatternLocationKeys(state.activePattern().location, true)
    }
}
