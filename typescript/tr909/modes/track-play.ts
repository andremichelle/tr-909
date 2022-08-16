import { FunctionKeyIndex } from './../keys.js'
import { BankIndex, TrackIndex } from "../../audio/tr909/memory.js"
import { Observer, Option, Options, Terminable } from "../../lib/common.js"
import { UIContext } from "../context.js"
import { DisplayObservableValueProvider, DisplayValue, DisplayValueProvider } from "../display.js"
import { FunctionKeyLabel, KeyState, MainKeyIndex, MainKeyLabel, ZeroBasedIndices } from "../keys.js"
import { complete, Mode } from "../mode.js"
import { MemoryBank } from './../../audio/tr909/memory.js'
import { TerminableVoid, Terminator } from './../../lib/common.js'

class TempoMemoryMode extends Mode {
    private readonly subscriptions: Terminator = this.with(new Terminator())

    constructor(context: UIContext) {
        super(context)
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): complete {
        for (let trackIndex = 0; trackIndex < MemoryBank.NUM_TRACKS; trackIndex++) {
            if (label === FunctionKeyLabel.TrackPlay[trackIndex]) {
                const track = this.context.activeBank().tracks[trackIndex]
                track.recallTempo().ifPresent(tempo => this.context.machine.preset.tempo.set(tempo))
                this.subscriptions.with(this.context.display.push(new class implements DisplayValueProvider {
                    readonly debugName: string = 'first-measure'
                    constructor(private readonly measure: number) { }
                    addObserver(observer: Observer<DisplayValue>, notify: boolean): Terminable {
                        if (notify) observer(this.displayValue())
                        return TerminableVoid
                    }
                    displayValue(): DisplayValue { return this.measure }
                    terminate(): void { }
                }(track.isEmpty() ? 0 : 1)))
                return true
            }
        }
        return true
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        this.subscriptions.terminate()
    }

    onMainKeyPress(label: MainKeyLabel<any>): complete {
        if (label === MainKeyLabel.EnterTotalAccent) {
            this.context.activeTrack().memorizeTempo(this.context.machine.preset.tempo.get())
        }
        return true
    }

    name(): string {
        return 'Tempo Memory'
    }
}

export default class extends Mode {
    private tempoMemoryMode: Option<TempoMemoryMode> = Options.None

    constructor(context: UIContext) {
        super(context)

        this.with(this.context.startStepRunningAnimation())
        this.with({ terminate: () => this.context.functionKeys.deactivate(ZeroBasedIndices.TrackKeys) })
        this.with(this.context.memoryState().trackIndex.addObserver(() => this.update(), false))
        this.with(this.context.display.push(new DisplayObservableValueProvider(
            this.context.machine.processorTrackMeasure, 'processor-track-measure', DisplayObservableValueProvider.PlusOne)))
        this.with(this.context.memoryState().bankGroupIndex
            .addObserver((bankGroupIndex: BankIndex) => {
                this.context.updateBankGroupKeys(bankGroupIndex)
                this.update()
            }, true))
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): complete {
        if (this.tempoMemoryMode.nonEmpty()) {
            return this.tempoMemoryMode.get().onFunctionKeyPress(label)
        }
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
            this.context.digitInput.start()
            this.context.digitInput.setValue(this.context.memoryState().activeTrack().size())
            return true
        }
        if (label === FunctionKeyLabel.Tempo) {
            this.tempoMemoryMode = Options.valueOf(new TempoMemoryMode(this.context))
            return false
        }
        return true
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.Tempo) {
            this.tempoMemoryMode.ifPresent(mode => mode.terminate())
            this.tempoMemoryMode = Options.None
        } else if (this.tempoMemoryMode.nonEmpty()) {
            this.tempoMemoryMode.get().onFunctionKeyRelease(label)
        }
    }

    onMainKeyPress(label: MainKeyLabel<any>): complete {
        if (this.tempoMemoryMode.nonEmpty()) {
            return this.tempoMemoryMode.get().onMainKeyPress(label)
        } else if (label.keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            this.context.playInstrument(label.keyIndex)
        }
        return true
    }

    allowMainKeyValueInput(): boolean {
        return true
    }

    setMainKeyValue(value: number): void {
        if (value > 0) {
            this.context.machine.processorTrackMeasure.set(Math.min(value - 1, this.context.memoryState().activeTrack().size() - 1))
        }
    }

    name(): string {
        return 'Track Play'
    }

    private update(): void {
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