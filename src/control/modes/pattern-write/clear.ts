import {Exec} from "@opendaw/lib-std"
import type {UIContext} from "../../context"
import {InstrumentMode, Instruments} from "../../instrument"
import {FunctionKeyLabel, MainKeyIndex, MainKeyLabel} from "../../keys"
import {complete, Mode} from "../../mode"

abstract class ClearMode extends Mode {
    readonly #back: Exec

    protected constructor(context: UIContext, back: Exec) {
        super(context)
        this.#back = back
    }

    onFunctionKeyRelease(label: FunctionKeyLabel): void {
        if (label === FunctionKeyLabel.Clear) {this.#back()}
    }

    name(): string {return "Clear"}
}

export class ClearPatternMode extends ClearMode {
    constructor(context: UIContext, back: Exec) {super(context, back)}

    onMainKeyPress(label: MainKeyLabel): complete {
        if (label.keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            this.context.activePatternGroup().patterns[label.keyIndex].clear()
        }
        return true
    }
}

export class ClearStepMode extends ClearMode {
    constructor(context: UIContext, back: Exec) {
        super(context, back)
        this.own(context.startStepRunningAnimation())
        this.own(context.machine.processorStepIndex.catchupAndSubscribe(owner =>
            Instruments.clearPatternStep(context.activePattern(), context.instrumentMode.getValue(), owner.getValue())))
    }
}

export class ClearTapMode extends ClearMode {
    constructor(context: UIContext, back: Exec) {
        super(context, back)
        this.own(context.startStepRunningAnimation())
        this.own(context.machine.processorStepIndex.catchupAndSubscribe(owner => {
            const instrumentMode = Instruments.fromKeys(context.concurrentMainKeys())
            if (instrumentMode !== InstrumentMode.None && instrumentMode !== InstrumentMode.TotalAccent) {
                Instruments.clearPatternStep(context.activePattern(), instrumentMode, owner.getValue())
            }
        }))
    }

    onMainKeyPress(_label: MainKeyLabel): complete {return false}
}
