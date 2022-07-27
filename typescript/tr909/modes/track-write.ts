import {PatternGroupIndex, PatternIndex} from "../../audio/tr909/memory.js"
import {MachineContext} from "../context.js"
import {FunctionKeyLabel, MainKeyIndex} from "../keys.js"
import {consumed, Mode} from "../modes.js"

export default class extends Mode {
    constructor(context: MachineContext) {
        super(context)

        this.context.updateBankGroupKeys(this.context.machine.state.bankGroupIndex.get())
        this.context.updateTrackKeys(this.context.machine.state.trackIndex.get(), true)
        this.with(this.context.startStepRunningAnimation())
        this.with(this.context.watchPatternLocationKeys())

        this.with(this.context.machine.state.patternGroupIndex
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
            this.context.display.show(this.context.machine.state.activeTrack().remaining())
            return true
        }
        return false
    }

    onFunctionKeyRelease(key: FunctionKeyLabel<any>): void {
        if (key === FunctionKeyLabel.AvailableMeasures) {
            this.context.updateDisplay()
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        if (keyIndex !== MainKeyIndex.TotalAccent) {
            this.context.machine.state.patternIndex.set(keyIndex as number as PatternIndex)
            return true
        }
        return false
    }

    name(): string {
        return 'Track Write'
    }
}