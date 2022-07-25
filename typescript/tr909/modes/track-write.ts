import {PatternGroupIndex} from "../../audio/tr909/memory.js"
import {MachineContext} from "../context.js"
import {FunctionKeyIndex, MainKeyIndex, PatternGroupKeyIndices} from "../keys.js"
import {MachineMode} from "../modes.js"

export default class extends MachineMode {
    constructor(context: MachineContext) {
        super(context)

        this.context.activateBankGroupKeys(this.context.machine.state.bankGroupIndex.get())
        this.context.activateTrackKeys(this.context.machine.state.trackIndex.get(), true)
        this.with(this.context.machine.state.patternGroupIndex
            .addObserver((patternGroupIndex: PatternGroupIndex) =>
                this.context.activatePatternGroupKeys(patternGroupIndex, false), true))
    }

    onFunctionKeyPress(keyIndex: FunctionKeyIndex) {
        if (this.context.shiftMode.get()) {
            // Cannot switch to Pattern Write Mode from here
        } else {
            if (this.context.maySwitchToTrackPlayMode(keyIndex)) {
                return
            }
            if (this.context.maySwitchIndex(keyIndex, PatternGroupKeyIndices, this.context.machine.state.patternGroupIndex)) {
                return
            }
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex) {
    }

    name(): string {
        return 'Track Write'
    }
}