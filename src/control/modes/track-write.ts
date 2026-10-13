import {DefaultObservableValue, int, Subscription, Terminable} from "@opendaw/lib-std"
import {PatternIndex} from "@/audio/memory"
import type {UIContext} from "../context"
import {DisplayValueProvider} from "../display"
import {FunctionKeyLabel, MainKeyIndex, MainKeyLabel} from "../keys"
import {complete, Mode} from "../mode"

export class TrackWriteMode extends Mode {
    readonly #writeIndex: DefaultObservableValue<int>
    readonly #availableMeasures: DisplayValueProvider

    #availableMeasuresSubscription: Subscription = Terminable.Empty

    constructor(context: UIContext) {
        super(context)
        const state = context.memoryState()
        this.#writeIndex = this.own(new DefaultObservableValue<int>(0))
        this.#availableMeasures = DisplayValueProvider.provide("available measures", () => context.memory().availableMeasures())
        context.updateBankGroupKeys(state.bankGroupIndex.getValue())
        context.updateTrackKeys(state.trackIndex.getValue(), true)
        this.own(context.startStepRunningAnimation())
        this.own(context.watchPatternLocationKeys())
        this.own(context.display.push(DisplayValueProvider.observe("write-index", this.#writeIndex, DisplayValueProvider.plusOne)))
    }

    onFunctionKeyPress(label: FunctionKeyLabel): complete {
        const context = this.context
        if (context.maySwitchToTrackPlayMode(label)) {return true}
        if (context.maySwitchPatternGroupIndex(label)) {return true}
        if (label === FunctionKeyLabel.AvailableMeasures) {
            this.#availableMeasuresSubscription = context.display.push(this.#availableMeasures)
            return true
        }
        if (label === FunctionKeyLabel.Back) {
            const index = this.#writeIndex.getValue()
            if (index > 0) {this.#moveWriteIndex(index - 1)}
            return true
        }
        if (label === FunctionKeyLabel.Forward) {
            const index = this.#writeIndex.getValue()
            if (index < context.activeTrack().size() - 1) {this.#moveWriteIndex(index + 1)}
            return true
        }
        return true
    }

    onFunctionKeyRelease(label: FunctionKeyLabel): void {
        if (label === FunctionKeyLabel.AvailableMeasures) {this.#availableMeasuresSubscription.terminate()}
    }

    onMainKeyPress(label: MainKeyLabel): complete {
        const context = this.context
        if (label.keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {
            context.activeTrack().writeLocation(context.activePattern().location, this.#writeIndex.getValue())
            this.#writeIndex.setValue(this.#writeIndex.getValue() + 1)
        } else {
            context.memoryState().patternIndex.setValue(label.keyIndex as int as PatternIndex)
        }
        return true
    }

    allowMainKeyValueInput(): boolean {return true}

    setMainKeyValue(value: int): void {
        if (value === 0) {return}
        this.#writeIndex.setValue(Math.min(value - 1, this.context.activeTrack().size() - 1))
    }

    name(): string {return "Track Write"}

    terminate(): void {
        this.#availableMeasuresSubscription.terminate()
        super.terminate()
    }

    #moveWriteIndex(index: int): void {
        this.#writeIndex.setValue(index)
        this.context.updatePatternLocationKeys(this.context.activeTrack().get(index))
    }
}
