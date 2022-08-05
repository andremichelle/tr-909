import { Pattern, ShuffleIndex, FlamIndex } from "../../../audio/tr909/memory.js"
import { ObservableValue, Terminator } from "../../../lib/common.js"
import { UIContext } from "../../context.js"
import { KeyState, MainKeyIndex, FunctionKeyLabel } from "../../keys.js"
import { Mode, complete } from "../../mode.js"
import { InputMode } from "../pattern-write.js"

export class ShuffleFlamInput extends Mode {
    private readonly subscriptions: Terminator = this.with(new Terminator())

    constructor(context: UIContext, readonly transientEditor: ObservableValue<InputMode>) {
        super(context)

        const state = this.context.memoryState()
        const update = (): void => {
            context.mainKeys.deactivate()
            const pattern = state.activePattern()
            const shuffleIndex = pattern.shuffleIndex.get()
            if (shuffleIndex >= 0 && shuffleIndex < 7) {
                this.context.mainKeys.byIndex(shuffleIndex).setState(KeyState.On)
            }
            const flamIndex = pattern.flamIndex.get()
            if (flamIndex >= 0 && flamIndex <= 7) {
                this.context.mainKeys.byIndex(MainKeyIndex.Step9 + flamIndex).setState(KeyState.On)
            }
        }
        const watch = (pattern: Pattern): void => {
            this.subscriptions.terminate()
            this.subscriptions.with(pattern.shuffleIndex.addObserver(() => update(), false))
            this.subscriptions.with(pattern.flamIndex.addObserver(() => update(), false))
            update()
        }
        this.with(state.patternIndicesChangeNotification.addObserver((pattern: Pattern) => watch(pattern)))
        watch(state.activePattern())
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.ShuffleFlam) {
            this.transientEditor.set(InputMode.Off)
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex): complete {
        const pattern = this.context.memoryState().activePattern()
        if (keyIndex <= MainKeyIndex.Step7) {
            pattern.shuffleIndex.set(keyIndex as ShuffleIndex)
            return true
        } else if (keyIndex >= MainKeyIndex.Step9 && keyIndex <= MainKeyIndex.Step16) {
            const flamIndex = keyIndex - MainKeyIndex.Step9
            pattern.flamIndex.set(flamIndex as FlamIndex)
            return true
        }
        return false
    }

    name(): string {
        return 'Shuffle/Flam'
    }
}