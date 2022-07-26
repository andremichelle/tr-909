import {PatternGroupIndex, PatternIndex} from "../../audio/tr909/memory.js"
import {MachineContext} from "../context.js"
import {FunctionKeyIndex, MainKeyIndex, PatternGroupKeyIndices} from "../keys.js"
import {MachineMode} from "../modes.js"

export default class extends MachineMode {
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

    onFunctionKeyPress(keyIndex: FunctionKeyIndex, shift: boolean): void {
        if (shift) {
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
        if (keyIndex === MainKeyIndex.TotalAccent) return
        this.context.machine.state.patternIndex.set(keyIndex as number as PatternIndex)
    }

    name(): string {
        return 'Track Write'
    }
}