import {Exec, Terminator} from "@opendaw/lib-std"
import {FlamIndex, Pattern, ShuffleIndex} from "@/audio/memory"
import type {UIContext} from "../../context"
import {FunctionKeyLabel, KeyState, MainKeyIndex, MainKeyLabel} from "../../keys"
import {complete, Mode} from "../../mode"

export class ShuffleFlamInput extends Mode {
    readonly #back: Exec
    readonly #subscriptions: Terminator

    constructor(context: UIContext, back: Exec) {
        super(context)
        this.#back = back
        this.#subscriptions = this.own(new Terminator())
        const update = (pattern: Pattern): void => {
            context.mainKeys.deactivate()
            context.mainKeys.byIndex(pattern.shuffleIndex.getValue()).setState(KeyState.On)
            context.mainKeys.byIndex(MainKeyIndex.Step9 + pattern.flamIndex.getValue()).setState(KeyState.On)
        }
        const watch = (pattern: Pattern): void => {
            this.#subscriptions.terminate()
            this.#subscriptions.ownAll(
                pattern.shuffleIndex.subscribe(() => update(pattern)),
                pattern.flamIndex.subscribe(() => update(pattern))
            )
            update(pattern)
        }
        this.own(context.memoryState().patternIndicesChangeNotification.subscribe(watch))
        watch(context.activePattern())
    }

    onFunctionKeyRelease(label: FunctionKeyLabel): void {
        if (label === FunctionKeyLabel.ShuffleFlam) {this.#back()}
    }

    onMainKeyPress(label: MainKeyLabel): complete {
        const pattern = this.context.activePattern()
        const keyIndex = label.keyIndex
        if (keyIndex <= MainKeyIndex.Step7) {
            pattern.shuffleIndex.setValue(keyIndex as ShuffleIndex)
            return true
        } else if (keyIndex >= MainKeyIndex.Step9 && keyIndex <= MainKeyIndex.Step16) {
            pattern.flamIndex.setValue((keyIndex - MainKeyIndex.Step9) as FlamIndex)
            return true
        }
        return false
    }

    name(): string {return "Shuffle/Flam"}
}
