import {BankIndex, TrackIndex} from "../../audio/tr909/memory.js"
import {UIContext} from "../context.js"
import {DisplayObservableValueProvider} from "../display.js"
import {FunctionKeyLabel, KeyState, MainKeyIndex, ZeroBasedIndices,} from "../keys.js"
import {complete, Mode} from "../mode.js"

export default class extends Mode {
    constructor(context: UIContext) {
        super(context)

        this.with(this.context.startStepRunningAnimation())
        this.with({terminate: () => this.context.functionKeys.deactivate(ZeroBasedIndices.TrackKeys)})
        this.with(this.context.memoryState().trackIndex.addObserver(() => this.initButtons(), false))
        this.with(this.context.display.pushProvider(new DisplayObservableValueProvider(
            this.context.machine.processorTrackMeasure, DisplayObservableValueProvider.PlusOne)))
        this.with(this.context.memoryState().bankGroupIndex
            .addObserver((bankGroupIndex: BankIndex) => {
                this.context.updateBankGroupKeys(bankGroupIndex)
                this.initButtons()
            }, true))
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): complete {
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
        if (label === FunctionKeyLabel.LastMeasure) {
            this.context.startUserNumberInput()
            this.context.displayInputNumber.set(this.context.memoryState().activeTrack().size())
            return true
        }
        return true
    }

    onMainKeyPress(keyIndex: MainKeyIndex): complete {
        if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {
            return true
        } else {
            this.context.playInstrument(keyIndex)
            return true
        }
    }

    setMainKeyValue(value: number) {
        if (value > 0) {
            this.context.machine.processorTrackMeasure.set(value - 1)
        }
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
            this.context.machine.processorTrackMeasure.set(-1)
        } else {
            this.context.updatePatternLocationKeys(track.get(0))
            this.context.machine.processorTrackMeasure.set(0)
        }
        this.context.updateTrackKeys(trackIndex, false)
    }
}