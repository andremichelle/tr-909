import { FunctionKeyLabel, KeyState, MainKeyLabel } from '../../keys.js'
import { Mode } from "../../mode.js"
import { UIContext } from './../../context.js'

export class CopyPatternMode extends Mode {
    private bankGroupIndex: number
    private patternGroupIndex: number
    private patternIndex: number

    constructor(context: UIContext, private readonly back: () => void) {
        super(context)

        const state = this.context.memoryState()
        this.bankGroupIndex = state.bankGroupIndex.get()
        this.patternGroupIndex = state.patternGroupIndex.get()
        this.patternIndex = this.context.memoryState().patternIndex.get()
        this.with({ terminate: () => this.reset() })
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.Shift) {
            this.back()
        } else if (UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.BankGroup, index => this.bankGroupIndex = index)) {
            this.context.updateBankGroupKeys(this.bankGroupIndex)
        } else if (UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.PatternWrite, index => this.patternGroupIndex = index)) {
            this.context.updatePatternGroupKeys(this.patternGroupIndex, true)
        }
    }

    onMainKeyPress(label: MainKeyLabel<any>): boolean {
        if (label.toNormal().isStepButton()) {
            this.patternIndex = label.toNormal().toStepIndex()
            this.context.resetMainKeys()
            this.context.mainKeys.byIndex(this.patternIndex as number).setState(KeyState.Blink)
        } else if (label.isEnter()) {
            const bank = this.context.machine.memory.banks[this.bankGroupIndex]
            const format = bank.patternByIndices(this.patternGroupIndex, this.patternIndex).serialize()
            this.reset()
            this.context.activePattern().deserialize(format)

        }
        return true
    }

    name(): string {
        return 'Copy'
    }

    private reset(): void {
        const state = this.context.memoryState()
        this.context.updateBankGroupKeys(state.bankGroupIndex.get())
        this.context.updatePatternLocationKeys(state.activePattern().location, true)
    }
}