import {int, Option, Terminable, Terminator} from "@opendaw/lib-std"
import {MemoryBank} from "@/audio/memory"
import type {UIContext} from "../context"
import {DisplayValueProvider} from "../display"
import {FunctionKeyLabel, KeyState, MainKeyIndex, MainKeyLabel, ZeroBasedIndices} from "../keys"
import {complete, Mode} from "../mode"

class TempoMemoryMode extends Mode {
    readonly #subscriptions: Terminator

    constructor(context: UIContext) {
        super(context)
        this.#subscriptions = this.own(new Terminator())
    }

    onFunctionKeyPress(label: FunctionKeyLabel): complete {
        for (let trackIndex = 0; trackIndex < MemoryBank.NUM_TRACKS; trackIndex++) {
            if (label === FunctionKeyLabel.TrackPlay[trackIndex]) {
                const track = this.context.activeBank().tracks[trackIndex]
                track.recallTempo().ifSome(tempo => this.context.machine.preset.tempo.setValue(tempo))
                this.#subscriptions.own(this.context.display
                    .push(DisplayValueProvider.constant("first-measure", track.isEmpty() ? 0 : 1)))
                return true
            }
        }
        return true
    }

    onFunctionKeyRelease(_label: FunctionKeyLabel): void {this.#subscriptions.terminate()}

    onMainKeyPress(label: MainKeyLabel): complete {
        if (label === MainKeyLabel.EnterTotalAccent) {
            this.context.activeTrack().memorizeTempo(this.context.machine.preset.tempo.getValue())
        }
        return true
    }

    name(): string {return "Tempo Memory"}
}

export class TrackPlayMode extends Mode {
    #tempoMemoryMode: Option<TempoMemoryMode> = Option.None

    constructor(context: UIContext) {
        super(context)
        const state = context.memoryState()
        this.own(context.startStepRunningAnimation())
        this.own(Terminable.create(() => context.functionKeys.deactivate(ZeroBasedIndices.TrackKeys)))
        this.own(state.trackIndex.subscribe(() => this.#update()))
        this.own(context.display.push(DisplayValueProvider.observe("processor-track-measure",
            context.machine.processorTrackMeasure, DisplayValueProvider.plusOne)))
        this.own(state.bankGroupIndex.catchupAndSubscribe(owner => {
            context.updateBankGroupKeys(owner.getValue())
            this.#update()
        }))
    }

    onFunctionKeyPress(label: FunctionKeyLabel): complete {
        if (this.#tempoMemoryMode.nonEmpty()) {return this.#tempoMemoryMode.unwrap().onFunctionKeyPress(label)}
        const context = this.context
        if (context.maySwitchBankGroupIndex(label)) {return true}
        if (context.maySwitchTrackIndex(label)) {return true}
        if (context.maySwitchToTrackWriteMode(label)) {return true}
        if (context.maySwitchToPatternPlayMode(label)) {return true}
        if (context.maySwitchToPatternWriteMode(label)) {return true}
        if (context.mayToggle(label, FunctionKeyLabel.CycleGuide, context.memoryState().cycleGuideMode)) {return true}
        if (label === FunctionKeyLabel.LastMeasure) {
            context.digitInput.start()
            context.digitInput.setValue(context.activeTrack().size())
            return true
        }
        if (label === FunctionKeyLabel.Tempo) {
            this.#tempoMemoryMode = Option.wrap(new TempoMemoryMode(context))
            return false
        }
        return true
    }

    onFunctionKeyRelease(label: FunctionKeyLabel): void {
        if (label === FunctionKeyLabel.Tempo) {
            this.#tempoMemoryMode.ifSome(mode => mode.terminate())
            this.#tempoMemoryMode = Option.None
        } else {
            this.#tempoMemoryMode.ifSome(mode => mode.onFunctionKeyRelease(label))
        }
    }

    onMainKeyPress(label: MainKeyLabel): complete {
        if (this.#tempoMemoryMode.nonEmpty()) {
            return this.#tempoMemoryMode.unwrap().onMainKeyPress(label)
        } else if (label.keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            this.context.playInstrument(label.keyIndex)
        }
        return true
    }

    allowMainKeyValueInput(): boolean {return true}

    setMainKeyValue(value: int): void {
        if (value > 0) {
            this.context.machine.processorTrackMeasure.setValue(Math.min(value - 1, this.context.activeTrack().size() - 1))
        }
    }

    name(): string {return "Track Play"}

    terminate(): void {
        this.#tempoMemoryMode.ifSome(mode => mode.terminate())
        super.terminate()
    }

    #update(): void {
        const context = this.context
        const state = context.memoryState()
        const track = state.activeTrack()
        if (track.isEmpty()) {
            context.updatePatternGroupKeys(0, false)
            context.mainKeys.byIndex(0).setState(KeyState.Blink)
            context.machine.processorTrackMeasure.setValue(-1)
        } else {
            context.updatePatternLocationKeys(track.get(0))
            context.machine.processorTrackMeasure.setValue(0)
        }
        context.updateTrackKeys(state.trackIndex.getValue(), false)
    }
}
