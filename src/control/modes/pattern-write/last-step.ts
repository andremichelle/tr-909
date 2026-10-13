import {Exec} from "@opendaw/lib-std"
import type {UIContext} from "../../context"
import {FunctionKeyLabel, MainKeyIndex, MainKeyLabel} from "../../keys"
import {complete, Mode} from "../../mode"

export class LastStepInput extends Mode {
    readonly #back: Exec

    constructor(context: UIContext, back: Exec) {
        super(context)
        this.#back = back
    }

    onMainKeyPress(label: MainKeyLabel): complete {
        if (label.keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {return false}
        this.context.activePattern().lastStep.setValue(label.keyIndex + 1)
        return true
    }

    onFunctionKeyRelease(label: FunctionKeyLabel): void {
        if (label === FunctionKeyLabel.LastStep) {this.#back()}
    }

    name(): string {return "Last Step"}
}
