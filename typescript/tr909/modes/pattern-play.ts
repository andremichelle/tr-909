import {PatternIndex} from "../../audio/tr909/memory.js"
import {UIContext} from "../context.js"
import {FunctionKeyLabel, MainKeyIndex} from "../keys.js"
import {consumed, Mode} from "../mode.js"

export default class extends Mode {
    constructor(context: UIContext) {
        super(context)

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
        const state = this.context.memoryState()
        const pressedMainKeys = this.context.pressedMainKeys
        if (pressedMainKeys.size === 1) {
            for (let index = 0; index < 16; index++) {
                this.context.activeBank()
                    .patternByIndices(state.patternGroupIndex.get(), index)
                    .chained.set(false)
            }
            state.patternIndex.set(keyIndex as number as PatternIndex)
        } else if (pressedMainKeys.size === 2) {
            const tuple: MainKeyIndex[] = [...pressedMainKeys]
            const start = Math.min(tuple[0], tuple[1])
            const end = Math.max(tuple[0], tuple[1])
            for (let index = start; index < end; index++) {
                this.context.activeBank()
                    .patternByIndices(state.patternGroupIndex.get(), index)
                    .chained.set(true) // TODO Move chaining to PatternGroup chain-array (one update instead of many, 15 instead of 16 entries)
            }
            state.patternIndex.set(start as number as PatternIndex) // TODO Search chain start (on intersection)
            this.context.updatePatternLocationKeys(this.context.activePattern().location)
        } else {
            return false
        }
        return true
    }

    name(): string {
        return 'Pattern Play'
    }
}