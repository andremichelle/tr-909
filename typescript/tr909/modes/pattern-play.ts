import {PatternIndex} from "../../audio/tr909/memory.js"
import {UIContext} from "../context.js"
import {FunctionKeyLabel, MainKeyIndex} from "../keys.js"
import {consumed, Mode} from "../mode.js"

export default class extends Mode {
    constructor(context: UIContext) {
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
        if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {
            return false
        }
        if (this.context.pressedMainKeys.size === 1) {
            this.context.memoryState().patternIndex.set(keyIndex as number as PatternIndex)
        } else if (this.context.pressedMainKeys.size === 2) {
            const tuple: MainKeyIndex[] = [...this.context.pressedMainKeys]
            const start = Math.min(tuple[0], tuple[1])
            const end = Math.max(tuple[0], tuple[1]) - 1
            for (let index = start; index < end; index++) {
                this.context.activeBank().patterns[index].chained.set(true)
            }
            this.context.memoryState().patternIndex.set(start as number as PatternIndex)
        } else {
            return false
        }
        return true
    }

    name(): string {
        return 'Pattern Play'
    }
}