import {BankGroupIndex, TrackIndex} from "../../audio/tr909/memory.js"
import {MachineContext} from "../context.js"
import {BankGroupKeyIndices, FunctionKeyIndex, KeyState, MainKeyIndex, TrackKeyIndices} from "../keys.js"
import {consumed, Mode} from "../modes.js"

export default class extends Mode {
    constructor(context: MachineContext) {
        super(context)

        this.with(this.context.startStepRunningAnimation())
        this.with({terminate: () => this.context.functionKeys.deactivate(TrackKeyIndices)})
        this.with(this.context.machine.state.trackIndex.addObserver(() => this.initButtons(), false))
        this.with(this.context.machine.state.bankGroupIndex
            .addObserver((bankGroupIndex: BankGroupIndex) => {
                this.context.updateBankGroupKeys(bankGroupIndex)
                this.initButtons()
            }, true))
    }

    onFunctionKeyPress(keyIndex: FunctionKeyIndex, shift: boolean): consumed {
        if (shift) {
            if (this.context.maySwitchIndex(keyIndex, BankGroupKeyIndices, this.context.machine.state.bankGroupIndex)) {
                return true
            }
            if (this.context.maySwitchToTrackWriteMode(keyIndex)) {
                return true
            }
            if (this.context.maySwitchToPatternWriteMode(keyIndex)) {
                return true
            }
        } else {
            if (this.context.maySwitchIndex(keyIndex, TrackKeyIndices, this.context.machine.state.trackIndex)) {
                return true
            }
            if (this.context.maySwitchToPatternPlayMode(keyIndex)) {
                return true
            }
            if (this.context.mayToggle(keyIndex, FunctionKeyIndex.CycleGuideLastMeasure, this.context.machine.state.cycleGuideMode)) {
                return true
            }
        }
        return false
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        if (keyIndex !== MainKeyIndex.TotalAccent) {
            this.context.playInstrument(keyIndex)
            return true
        }
        return false
    }

    getDisplayValue(): number | 'none' {
        return this.context.machine.state.activeTrack().isEmpty() ? 0 : this.context.machine.processorTrackMeasure.get()
    }

    name(): string {
        return 'Track Play'
    }

    private initButtons() {
        const trackIndex: TrackIndex = this.context.machine.state.trackIndex.get()
        const track = this.context.machine.state.activeTrack()
        if (track.isEmpty()) {
            this.context.updatePatternGroupKeys(0, false)
            this.context.mainKeys.byIndex(0).setState(KeyState.Flash)
            this.context.digits.show(0)
        } else {
            this.context.updatePatternLocationKeys(track.get(0))
            this.context.digits.show(1) // first measure index
        }
        this.context.updateTrackKeys(trackIndex, false)
    }
}