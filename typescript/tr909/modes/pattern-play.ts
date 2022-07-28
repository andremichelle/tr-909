import {PatternIndex} from "../../audio/tr909/memory.js"
import {MachineContext} from "../context.js"
import {FunctionKeyLabel, MainKeyIndex} from "../keys.js"
import {consumed, Mode} from "../mode.js"

export default class extends Mode {
    constructor(context: MachineContext) {
        super(context)

        this.context.display.show('none')
        this.with(this.context.startStepRunningAnimation())
        this.with(this.context.watchPatternLocationKeys())
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): consumed {
        if (this.context.maySwitchToTrackPlayMode(label)) {
            return true
        }
        if (this.context.maySwitchToTrackWriteMode(label)) {
            return true
        }
        if (this.context.maySwitchPatternGroupIndex(label)) {
            return true
        }
        if (this.context.maySwitchToPatternWriteMode(label)) {
            return true
        }
        return false
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        if (keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            this.context.machine.state.patternIndex.set(keyIndex as number as PatternIndex)
            return true
        }
        return false
    }

    name(): string {
        return 'Pattern Play'
    }
}