import {PatternIndex} from "../../audio/tr909/memory.js"
import {MachineContext} from "../context.js"
import {FunctionKeyIndex, MainKeyIndex, PatternGroupKeyIndices} from "../keys.js"
import {MachineMode} from "../modes.js"

export default class extends MachineMode {
    constructor(context: MachineContext) {
        super(context)

        this.context.updateBankGroupKeys(this.context.machine.state.bankGroupIndex.get())
        this.with(this.context.startStepRunningAnimation())
        this.with(this.context.watchPatternLocationKeys())
    }

    onFunctionKeyPress(keyIndex: FunctionKeyIndex, shift: boolean): void {
        if (shift) {
            if (this.context.maySwitchToTrackWriteMode(keyIndex)) {
                return
            }
            if (this.context.maySwitchToPatternWriteMode(keyIndex)) {
                return
            }
        } else {
            if (this.context.maySwitchToTrackPlayMode(keyIndex)) {
                return
            }
            if (this.context.maySwitchIndex(keyIndex, PatternGroupKeyIndices, this.context.machine.state.patternGroupIndex)) {
                return
            }
            if (keyIndex === FunctionKeyIndex.TempoStep) {
                this.context.digits.show(this.context.machine.preset.tempo.get()) // TODO push digits renderer on stack
            }
        }
    }

    onFunctionKeyRelease(keyIndex: FunctionKeyIndex): void {
        if (keyIndex === FunctionKeyIndex.TempoStep) {
            this.context.digits.clear() // TODO shift digits renderer and render last (if any)
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex): void {
        if (keyIndex === MainKeyIndex.TotalAccent) return
        this.context.machine.state.patternIndex.set(keyIndex as number as PatternIndex)
    }

    name(): string {
        return 'Pattern Play'
    }
}