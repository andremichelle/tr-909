import {BankGroupIndex, TrackIndex} from "../../audio/tr909/memory.js"
import {UIContext} from "../context.js"
import {FunctionKeyLabel, KeyState, MainKeyIndex, ZeroBasedIndices,} from "../keys.js"
import {consumed, Mode} from "../mode.js"

export default class extends Mode {
    constructor(context: UIContext) {
        super(context)

        this.with(this.context.startStepRunningAnimation())
        this.with({terminate: () => this.context.functionKeys.deactivate(ZeroBasedIndices.TrackKeys)})
        this.with(this.context.memoryState().trackIndex.addObserver(() => this.initButtons(), false))
        this.with(this.context.machine.processorTrackMeasure
            .addObserver((measure) => this.context.updateDisplay(measure + 1), true))
        this.with(this.context.memoryState().bankGroupIndex
            .addObserver((bankGroupIndex: BankGroupIndex) => {
                this.context.updateBankGroupKeys(bankGroupIndex)
                this.initButtons()
            }, true))
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): consumed {
        if (this.context.maySwitchBankGroupIndex(label)) {
            return true
        }
        if (this.context.maySwitchTrackIndex(label)) {
            return true
        }
        if (this.context.maySwitchToTrackWriteMode(label)) {
            return true
        }
        if (this.context.maySwitchToPatternPlayMode(label)) {
            return true
        }
        if (this.context.maySwitchToPatternWriteMode(label)) {
            return true
        }
        if (this.context.mayToggle(label, FunctionKeyLabel.CycleGuide, this.context.memoryState().cycleGuideMode)) {
            return true
        }
        return false
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        if (keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            this.context.playInstrument(keyIndex)
            return true
        }
        return false
    }

    getDisplayValue(): number | 'none' {
        return this.context.memoryState().activeTrack().isEmpty()
            ? 0 : this.context.machine.processorTrackMeasure.get() + 1
    }

    name(): string {
        return 'Track Play'
    }

    private initButtons() {
        const trackIndex: TrackIndex = this.context.memoryState().trackIndex.get()
        const track = this.context.memoryState().activeTrack()
        if (track.isEmpty()) {
            this.context.updatePatternGroupKeys(0, false)
            this.context.mainKeys.byIndex(0).setState(KeyState.Blink)
            this.context.display.show(0)
        } else {
            this.context.updatePatternLocationKeys(track.get(0))
            this.context.display.show(1) // first measure
        }
        this.context.updateTrackKeys(trackIndex, false)
    }
}