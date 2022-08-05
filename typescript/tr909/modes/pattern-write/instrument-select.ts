import { UIContext } from "../../context.js"
import { FunctionKeyLabel, Key, MainKeyIndex } from "../../keys.js"
import { complete, Mode } from "../../mode.js"
import { InstrumentMode, Utils } from "../../utils.js"

export class InstrumentSelectInput extends Mode {
    constructor(context: UIContext, private readonly back: () => void) {
        super(context)

        this.with(this.context.instrumentMode.addObserver((instrumentMode: InstrumentMode) => {
            const toButtonStates = Utils.instrumentModeToButtonStates(instrumentMode)
            this.context.mainKeys.forEach((key: Key, keyIndex: MainKeyIndex) => key.setState(toButtonStates(keyIndex)))
        }, true))
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.InstrumentSelect) {
            this.back()
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