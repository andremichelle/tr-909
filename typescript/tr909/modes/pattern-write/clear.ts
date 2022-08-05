import { UIContext } from '../../context.js'
import { FunctionKeyLabel, MainKeyIndex } from '../../keys.js'
import { Mode } from "../../mode.js"
import { InstrumentMode, Utils } from '../../utils.js'

export class ClearPatternMode extends Mode {
    constructor(context: UIContext, private readonly back: () => void) {
        super(context)
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.Clear) {
            this.back()
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex): boolean {
        if (keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            this.context.memoryState().activePatternGroup().patterns[keyIndex].clear()
        }
        return true
    }

    name(): string {
        return 'Clear'
    }
}

// TODO mute instrument while clearing

export class ClearStepMode extends Mode {
    constructor(context: UIContext, private readonly back: () => void) {
        super(context)

        this.with(this.context.startStepRunningAnimation())
        this.with(this.context.machine.processorStepIndex.addObserver(stepIndex => {
            const instrumentMode = this.context.instrumentMode.get()
            const pattern = this.context.memoryState().activePattern()
            Utils.clearPatternStep(pattern, instrumentMode, stepIndex)
        }, true))
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.Clear) {
            this.back()
        }
    }

    name(): string {
        return 'Clear'
    }
}

export class ClearTapMode extends Mode {
    constructor(context: UIContext, private readonly back: () => void) {
        super(context)

        this.with(this.context.startStepRunningAnimation())
        this.with(this.context.machine.processorStepIndex.addObserver(stepIndex => {
            const instrumentMode = Utils.buttonIndicesToInstrumentMode(this.context.getConcurrentMainKeys())
            if (instrumentMode !== InstrumentMode.None && instrumentMode !== InstrumentMode.TotalAccent) {
                const pattern = this.context.memoryState().activePattern()
                Utils.clearPatternStep(pattern, instrumentMode, stepIndex)
            }
        }, true))
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.Clear) {
            this.back()
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex): boolean {
        return false
    }

    name(): string {
        return 'Clear'
    }
}