import { UIContext } from "../context.js"
import { FunctionKeyLabel, MainKeyIndex, MainKeyLabel } from "../keys.js"
import { complete, Mode } from "../mode.js"

export default class extends Mode {
    constructor(context: UIContext) {
        super(context)

        this.with(this.context.startStepRunningAnimation())
        this.with(this.context.watchPatternLocationKeys())
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): complete {
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
        return true
    }

    onMainKeyPress(label: MainKeyLabel<any>): complete {
        if (!label.isStepButton()) {
            return true
        }
        const state = this.context.memoryState()
        const concurrentMainKeys = this.context.getConcurrentMainKeys()
        const patternGroup = this.context.activePatternGroup()
        patternGroup.clearChains()
        if (concurrentMainKeys.size === 1) {
            //state.patternIndex.set(patternGroup.firstOfChained(label.keyIndex).location.patternIndex) // for permanent chains
            state.patternIndex.set(label.toStepIndex())
            return false
        } else if (concurrentMainKeys.size >= 2) {
            const indices: MainKeyIndex[] = [...concurrentMainKeys]
                .filter(keyIndex => keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent)
            const first = indices[0]
            const last = label.toStepIndex()
            const start: number = Math.min(first, last)
            const end: number = Math.max(first, last)
            const chained = patternGroup.getChained().slice()
            for (let index = start; index < end; index++) {
                chained[index] = true
            }
            patternGroup.writeChain(chained)
            state.patternIndex.set(start)
            this.context.updatePatternLocationKeys(this.context.activePattern().location)
            return true
        } else {
            return false
        }
    }

    name(): string {
        return 'Pattern Play'
    }
}