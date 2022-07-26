import {PatternIndex} from "../../audio/tr909/memory.js"
import {MachineContext} from "../context.js"
import {FunctionKeyIndex, MainKeyIndex, PatternGroupKeyIndices} from "../keys.js"
import {consumed, Mode} from "../modes.js"

export default class extends Mode {
    constructor(context: MachineContext) {
        super(context)

        this.context.updateBankGroupKeys(this.context.machine.state.bankGroupIndex.get())
        this.with(this.context.startStepRunningAnimation())
        this.with(this.context.watchPatternLocationKeys())
    }

    onFunctionKeyPress(keyIndex: FunctionKeyIndex, shift: boolean): consumed {
        if (shift) {
            if (this.context.maySwitchToTrackWriteMode(keyIndex)) {
                return true
            }
            if (this.context.maySwitchToPatternWriteMode(keyIndex)) {
                return true
            }
        } else {
            if (this.context.maySwitchToTrackPlayMode(keyIndex)) {
                return true
            }
            if (this.context.maySwitchIndex(keyIndex, PatternGroupKeyIndices, this.context.machine.state.patternGroupIndex)) {
                return true
            }
        }
        return false
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        if (keyIndex !== MainKeyIndex.TotalAccent) {
            this.context.machine.state.patternIndex.set(keyIndex as number as PatternIndex)
            return true
        }
        return false
    }

    name(): string {
        return 'Pattern Play'
    }
}