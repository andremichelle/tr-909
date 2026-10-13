import type {UIContext} from "../context"
import {FunctionKeyLabel, MainKeyIndex, MainKeyLabel} from "../keys"
import {complete, Mode} from "../mode"

export class PatternPlayMode extends Mode {
    constructor(context: UIContext) {
        super(context)
        this.own(context.startStepRunningAnimation())
        this.own(context.watchPatternLocationKeys())
    }

    onFunctionKeyPress(label: FunctionKeyLabel): complete {
        const context = this.context
        if (context.maySwitchToTrackPlayMode(label)) {return true}
        if (context.maySwitchToTrackWriteMode(label)) {return true}
        if (context.maySwitchPatternGroupIndex(label)) {return true}
        context.maySwitchToPatternWriteMode(label)
        return true
    }

    onMainKeyPress(label: MainKeyLabel): complete {
        if (!label.isStepButton()) {return true}
        const context = this.context
        const state = context.memoryState()
        const concurrentMainKeys = context.concurrentMainKeys()
        const patternGroup = context.activePatternGroup()
        patternGroup.clearChains()
        if (concurrentMainKeys.size === 1) {
            state.patternIndex.setValue(label.toStepIndex())
            return false
        } else if (concurrentMainKeys.size >= 2) {
            const indices = [...concurrentMainKeys].filter(keyIndex => keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent)
            const first = indices[0]
            const last = label.toStepIndex()
            const start = Math.min(first, last)
            const end = Math.max(first, last)
            const chained = patternGroup.getChained().slice()
            for (let index = start; index < end; index++) {chained[index] = true}
            patternGroup.writeChain(chained)
            state.patternIndex.setValue(start)
            context.updatePatternLocationKeys(context.activePattern().location)
            return true
        }
        return false
    }

    name(): string {return "Pattern Play"}
}
