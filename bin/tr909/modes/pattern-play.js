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
    onMainKeyPress(keyIndex) {
        if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {
            return true;
        }
        const state = this.context.memoryState();
        const concurrentMainKeys = this.context.getConcurrentMainKeys();
        const patternGroup = this.context.activePatternGroup();
        if (concurrentMainKeys.size === 0) {
            patternGroup.clearChains();
            state.patternIndex.set(patternGroup.firstOfChained(keyIndex).location.patternIndex);
            return false;
        }
        else if (concurrentMainKeys.size === 1) {
            patternGroup.clearChains();
            const tuple = [...concurrentMainKeys, keyIndex];
            const start = Math.min(tuple[0], tuple[1]);
            const end = Math.max(tuple[0], tuple[1]);
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