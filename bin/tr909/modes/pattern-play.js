import { MainKeyIndex } from "../keys.js";
import { Mode } from "../mode.js";
export default class extends Mode {
    constructor(context) {
        super(context);
        this.with(this.context.startStepRunningAnimation());
        this.with(this.context.watchPatternLocationKeys());
    }
    onFunctionKeyPress(label) {
        if (this.context.maySwitchToTrackPlayMode(label)) {
            return true;
        }
        if (this.context.maySwitchToTrackWriteMode(label)) {
            return true;
        }
        if (this.context.maySwitchPatternGroupIndex(label)) {
            return true;
        }
        if (this.context.maySwitchToPatternWriteMode(label)) {
            return true;
        }
        return true;
    }
    onMainKeyPress(label) {
        if (!label.isStepButton()) {
            return true;
        }
        const state = this.context.memoryState();
        const concurrentMainKeys = this.context.getConcurrentMainKeys();
        const patternGroup = this.context.activePatternGroup();
        patternGroup.clearChains();
        if (concurrentMainKeys.size === 1) {
            state.patternIndex.set(label.toStepIndex());
            return false;
        }
        else if (concurrentMainKeys.size >= 2) {
            const indices = [...concurrentMainKeys]
                .filter(keyIndex => keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent);
            const first = indices[0];
            const last = label.toStepIndex();
            const start = Math.min(first, last);
            const end = Math.max(first, last);
            const chained = patternGroup.getChained().slice();
            for (let index = start; index < end; index++) {
                chained[index] = true;
            }
            patternGroup.writeChain(chained);
            state.patternIndex.set(start);
            this.context.updatePatternLocationKeys(this.context.activePattern().location);
            return true;
        }
        else {
            return false;
        }
    }
    name() {
        return 'Pattern Play';
    }
}
//# sourceMappingURL=pattern-play.js.map