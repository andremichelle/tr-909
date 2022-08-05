import { ObservableValue } from "../../../lib/common.js"
import { UIContext } from "../../context.js"
import { Key, MainKeyIndex, FunctionKeyLabel } from "../../keys.js"
import { Mode, complete } from "../../mode.js"
import { InstrumentMode, Utils } from "../../utils.js"
import { InputMode } from "../pattern-write.js"

export class InstrumentSelectInput extends Mode {
    constructor(context: UIContext, readonly transientEditor: ObservableValue<InputMode>) {
        super(context)

        this.with(this.context.instrumentMode.addObserver((instrumentMode: InstrumentMode) => {
            const toButtonStates = Utils.instrumentModeToButtonStates(instrumentMode)
            this.context.mainKeys.forEach((key: Key, keyIndex: MainKeyIndex) => key.setState(toButtonStates(keyIndex)))
        }, true))
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.InstrumentSelect) {
            this.transientEditor.set(InputMode.Off)
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex): complete {
        const mainKeyIndices = this.context.getConcurrentMainKeys().add(keyIndex)
        this.context.instrumentMode.set(Utils.buttonIndicesToInstrumentMode(mainKeyIndices))
        return mainKeyIndices.size > 1
    }

    name(): string {
        return 'Instrument Select'
    }
}