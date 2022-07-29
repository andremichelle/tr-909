import {PatternIndex} from "../../audio/tr909/memory.js"
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
        this.context.updateDisplay(this.getDisplayValue())
        this.with(this.context.startStepRunningAnimation())
        this.with(this.context.watchPatternLocationKeys())
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): consumed {
        if (this.context.maySwitchToTrackPlayMode(label)) {
            return true
        }
        if (this.context.maySwitchPatternGroupIndex(label)) {
            return true
        }
        if (label === FunctionKeyLabel.AvailableMeasures) {
            this.context.display.show(this.context.memory().availableMeasures())
            return true
        }
        if (label == FunctionKeyLabel.Back) {
            if (this.writeIndex > 0) {
                this.writeIndex--
                this.context.updatePatternLocationKeys(this.context.activeTrack().get(this.writeIndex))
                this.context.updateDisplay()
                return true
            }
        }
        if (label == FunctionKeyLabel.Forward) {
            if (this.writeIndex < this.context.activeTrack().size() - 1) {
                this.writeIndex++
                this.context.updatePatternLocationKeys(this.context.activeTrack().get(this.writeIndex))
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
            this.context.activeTrack().writeInto(this.context.memoryState().patternIndex.get(), this.writeIndex++)
            this.context.updateDisplay()
        } else {
            this.context.memoryState().patternIndex.set(keyIndex as number as PatternIndex)
        }
        return true
    }

    setMainKeyValue(value: number) {
        if (value === 0) return
        this.writeIndex = Math.min(value - 1, this.context.activeTrack().size() - 1)
        this.context.updateDisplay()
    }

    getDisplayValue(): DisplayValue {
        return this.writeIndex + 1
    }

    name(): string {
        return 'Track Write'
    }
}