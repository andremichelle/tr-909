import { Terminator } from "../../../lib/common.js";
import { KeyState, MainKeyIndex, FunctionKeyLabel } from "../../keys.js";
import { Mode } from "../../mode.js";
import { InputMode } from "../pattern-write.js";
export class ShuffleFlamInput extends Mode {
    constructor(context, transientEditor) {
        super(context);
        this.transientEditor = transientEditor;
        this.subscriptions = this.with(new Terminator());
        const state = this.context.memoryState();
        const update = () => {
            context.mainKeys.deactivate();
            const pattern = state.activePattern();
            const shuffleIndex = pattern.shuffleIndex.get();
            if (shuffleIndex >= 0 && shuffleIndex < 7) {
                this.context.mainKeys.byIndex(shuffleIndex).setState(KeyState.On);
            }
            const flamIndex = pattern.flamIndex.get();
            if (flamIndex >= 0 && flamIndex <= 7) {
                this.context.mainKeys.byIndex(MainKeyIndex.Step9 + flamIndex).setState(KeyState.On);
            }
        };
        const watch = (pattern) => {
            this.subscriptions.terminate();
            this.subscriptions.with(pattern.shuffleIndex.addObserver(() => update(), false));
            this.subscriptions.with(pattern.flamIndex.addObserver(() => update(), false));
            update();
        };
        this.with(state.patternIndicesChangeNotification.addObserver((pattern) => watch(pattern)));
        watch(state.activePattern());
    }
    onFunctionKeyRelease(label) {
        if (label === FunctionKeyLabel.ShuffleFlam) {
            this.transientEditor.set(InputMode.Off);
        }
    }
    onMainKeyPress(keyIndex) {
        const pattern = this.context.memoryState().activePattern();
        if (keyIndex <= MainKeyIndex.Step7) {
            pattern.shuffleIndex.set(keyIndex);
            return true;
        }
        else if (keyIndex >= MainKeyIndex.Step9 && keyIndex <= MainKeyIndex.Step16) {
            const flamIndex = keyIndex - MainKeyIndex.Step9;
            pattern.flamIndex.set(flamIndex);
            return true;
        }
        return false;
    }
    name() {
        return 'Shuffle/Flam';
    }
}
//# sourceMappingURL=shuffle-flam.js.map