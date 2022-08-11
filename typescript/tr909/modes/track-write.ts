import { Memory, PatternIndex } from "../../audio/tr909/memory.js"
import { ObservableValue, ObservableValueImpl, Observer, Terminable, TerminableVoid } from "../../lib/common.js"
import { UIContext } from "../context.js"
import { DisplayObservableValueProvider, DisplayValue, DisplayValueProvider } from "../display.js"
import { FunctionKeyLabel, MainKeyIndex, MainKeyLabel } from "../keys.js"
import { complete, Mode } from "../mode.js"

export default class extends Mode {
    private terminableAvailableMeasureDisplay: Terminable = TerminableVoid

    private writeIndex: ObservableValue<number> = new ObservableValueImpl(0)

    private readonly availableMeasures: DisplayValueProvider = new class implements DisplayValueProvider {
        addObserver(observer: Observer<DisplayValue>, notify: boolean): Terminable {
            return TerminableVoid
        }

        displayValue(): DisplayValue {
            return 'none'
        }

        terminate(): void {
        }
    }()

    constructor(context: UIContext) {
        super(context)

        this.context.updateBankGroupKeys(this.context.memoryState().bankGroupIndex.get())
        this.context.updateTrackKeys(this.context.memoryState().trackIndex.get(), true)
        this.with(this.context.startStepRunningAnimation())
        this.with(this.context.watchPatternLocationKeys())
        this.with(this.context.display
            .pushProvider(new DisplayObservableValueProvider(this.writeIndex, x => x + 1)))

        this.availableMeasures = new class implements DisplayValueProvider {
            constructor(readonly memory: Memory) {
            }

            addObserver(observer: Observer<DisplayValue>, notify: boolean): Terminable {
                if (notify) {
                    observer(this.displayValue())
                }
                return TerminableVoid
            }

            displayValue(): DisplayValue {
                return this.memory.availableMeasures()
            }

            terminate(): void {
            }
        }(context.machine.memory)
    }


    onFunctionKeyPress(label: FunctionKeyLabel<any>): complete {
        if (this.context.maySwitchToTrackPlayMode(label)) {
            return true
        }
        if (this.context.maySwitchPatternGroupIndex(label)) {
            return true
        }
        if (label === FunctionKeyLabel.AvailableMeasures) {
            this.terminableAvailableMeasureDisplay = this.context.display.pushProvider(this.availableMeasures)
            return true
        }
        if (label == FunctionKeyLabel.Back) {
            const index = this.writeIndex.get()
            if (index > 0) {
                this.writeIndex.set(index - 1)
                this.context.updatePatternLocationKeys(this.context.activeTrack().get(this.writeIndex.get()))
            }
            return true
        }
        if (label == FunctionKeyLabel.Forward) {
            const index = this.writeIndex.get()
            if (index < this.context.activeTrack().size() - 1) {
                this.writeIndex.set(index + 1)
                this.context.updatePatternLocationKeys(this.context.activeTrack().get(this.writeIndex.get()))
            }
            return true
        }
        return true
    }

    onFunctionKeyRelease(key: FunctionKeyLabel<any>): void {
        if (key === FunctionKeyLabel.AvailableMeasures) {
            this.terminableAvailableMeasureDisplay.terminate()
        }
    }

    onMainKeyPress(label: MainKeyLabel<any>): complete {
        if (label.keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {
            this.context.activeTrack().writeLocation(this.context.memoryState().activePattern().location, this.writeIndex.get())
            this.writeIndex.set(this.writeIndex.get() + 1)
        } else {
            this.context.memoryState().patternIndex.set(label.keyIndex as number as PatternIndex)
        }
        return true
    }

    allowMainKeyValueInput(): boolean {
        return true
    }

    setMainKeyValue(value: number) {
        if (value === 0) return
        this.writeIndex.set(Math.min(value - 1, this.context.activeTrack().size() - 1))
    }

    name(): string {
        return 'Track Write'
    }
}