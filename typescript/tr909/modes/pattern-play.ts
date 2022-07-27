import {PatternIndex} from "../../audio/tr909/memory.js"
import {MachineContext} from "../context.js"
import {FunctionKeyLabel, MainKeyIndex} from "../keys.js"
import {consumed, Mode} from "../modes.js"

export default class extends Mode {
    constructor(context: MachineContext) {
        super(context)

        this.context.display.show('none')
        this.with(this.context.startStepRunningAnimation())
        this.with(this.context.watchPatternLocationKeys())
    }

    onFunctionKeyPress(key: FunctionKeyLabel<any>): consumed {
        if (this.context.maySwitchToTrackPlayMode(key)) {
            return true
        }
        if (this.context.maySwitchToTrackWriteMode(key)) {
            return true
        }
        if (this.context.maySwitchIndex(key, FunctionKeyLabel.PatternPlay, this.context.machine.state.patternGroupIndex)) {
            return true
        }
        if (this.context.maySwitchToPatternWriteMode(key)) {
            return true
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