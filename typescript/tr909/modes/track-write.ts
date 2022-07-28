import {PatternGroupIndex, PatternIndex} from "../../audio/tr909/memory.js"
import {MachineContext} from "../context.js"
import {DisplayValue} from "../display.js"
import {FunctionKeyLabel, MainKeyIndex} from "../keys.js"
import {consumed, Mode} from "../mode.js"

export default class extends Mode {
    private writeIndex: number = 0

    constructor(context: MachineContext) {
        super(context)

        this.context.updateBankGroupKeys(this.context.memoryState().bankGroupIndex.get())
        this.context.updateTrackKeys(this.context.memoryState().trackIndex.get(), true)
        this.with(this.context.startStepRunningAnimation())
        this.with(this.context.watchPatternLocationKeys())

        this.with(this.context.memoryState().patternGroupIndex
            .addObserver((patternGroupIndex: PatternGroupIndex) =>
                this.context.updatePatternGroupKeys(patternGroupIndex, false), true))
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): consumed {
        if (this.context.maySwitchToTrackPlayMode(label)) {
            return true
        }
        if (this.context.maySwitchPatternGroupIndex(label)) {
            return true
        }
        if (label === FunctionKeyLabel.AvailableMeasures) {
            this.context.display.show(this.context.machine.memory.availableMeasures())
            return true
        }
        if (label == FunctionKeyLabel.Back) {
            if (this.writeIndex > 0) {
                this.writeIndex--
                this.context.updateDisplay()
                return true
            }
        }
        if (label == FunctionKeyLabel.Forward) {
            if (this.writeIndex > 0) {
                this.writeIndex--
                this.context.updateDisplay()
                return true
            }
        }
        return false
    }

    onFunctionKeyRelease(key: FunctionKeyLabel<any>): void {
        if (key === FunctionKeyLabel.AvailableMeasures) {
            this.context.updateDisplay()
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {
            this.context.memoryState().activeTrack().insert(this.context.memoryState().patternIndex.get(), this.writeIndex++)
            this.context.updateDisplay()
        } else {
            this.context.memoryState().patternIndex.set(keyIndex as number as PatternIndex)
        }
        return true
    }

    getDisplayValue(): DisplayValue {
        return this.writeIndex
    }

    name(): string {
        return 'Track Write'
    }
}