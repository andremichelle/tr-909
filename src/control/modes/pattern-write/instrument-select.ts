import {Exec} from "@opendaw/lib-std"
import type {UIContext} from "../../context"
import {Instruments} from "../../instrument"
import {FunctionKeyLabel, MainKeyLabel} from "../../keys"
import {complete, Mode} from "../../mode"

export class InstrumentSelectInput extends Mode {
    readonly #back: Exec

    constructor(context: UIContext, back: Exec) {
        super(context)
        this.#back = back
        this.own(context.instrumentMode.catchupAndSubscribe(owner => {
            const toKeyState = Instruments.modeToKeyState(owner.getValue())
            context.mainKeys.forEach((key, keyIndex) => key.setState(toKeyState(keyIndex)))
        }))
    }

    onFunctionKeyRelease(label: FunctionKeyLabel): void {
        if (label === FunctionKeyLabel.InstrumentSelect) {this.#back()}
    }

    onMainKeyPress(label: MainKeyLabel): complete {
        const mainKeyIndices = this.context.concurrentMainKeys().add(label.keyIndex)
        this.context.instrumentMode.setValue(Instruments.fromKeys(mainKeyIndices))
        return mainKeyIndices.size > 1
    }

    name(): string {return "Instrument Select"}
}
