import {PatternGroupIndex, PatternIndex} from "../../audio/tr909/memory.js"
import {MachineContext} from "../context.js"
import {FunctionKeyIndex, MainKeyIndex, PatternGroupKeyIndices} from "../keys.js"
import {consumed, Mode} from "../modes.js"

export default class extends Mode {
    constructor(context: MachineContext) {
        super(context)

        this.context.updateBankGroupKeys(this.context.machine.state.bankGroupIndex.get())
        this.context.updateTrackKeys(this.context.machine.state.trackIndex.get(), true)
        this.with(this.context.startStepRunningAnimation())
        this.with(this.context.watchPatternLocationKeys())

        this.with(this.context.machine.state.patternGroupIndex
            .addObserver((patternGroupIndex: PatternGroupIndex) =>
                this.context.updatePatternGroupKeys(patternGroupIndex, false), true))
    }

    onFunctionKeyPress(keyIndex: FunctionKeyIndex, shift: boolean): consumed {
        if (shift) {
            // Cannot switch to Pattern Write Mode from here
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
        return 'Track Write'
    }
}