import {PatternGroupIndex, PatternIndex} from "../../audio/tr909/memory.js"
import {MachineContext} from "../context.js"
import {FunctionKeyIndex, KeyState, MainKeyIndex, PatternGroupKeyIndices} from "../keys.js"
import {MachineMode} from "../modes.js"

export default class extends MachineMode {
    constructor(context: MachineContext) {
        super(context)

        this.context.activateStepsRunningAnimation()
        this.context.activateBankGroupKeys(this.context.machine.state.bankGroupIndex.get())
        this.with(this.context.machine.state.patternGroupIndex
            .addObserver((patternGroupIndex: PatternGroupIndex) =>
                this.context.activatePatternGroupKeys(patternGroupIndex, false), true))
        this.context.mainKeys.byIndex(this.context.machine.state.patternIndex.get() as number).setState(KeyState.Blink)
    }

    onFunctionKeyPress(keyIndex: FunctionKeyIndex): void {
        if (this.context.shiftMode.get()) {
            if (this.context.maySwitchToTrackWriteMode(keyIndex)) {
                return
            }
            if (this.context.maySwitchToPatternWriteMode(keyIndex)) {
                return
            }
        } else {
            if (this.context.maySwitchToTrackPlayMode(keyIndex)) {
                return
            }
            if (this.context.maySwitchIndex(keyIndex, PatternGroupKeyIndices, this.context.machine.state.patternGroupIndex)) {
                return
            }
            if (keyIndex === FunctionKeyIndex.TempoStep) {
                this.context.digits.show(this.context.machine.preset.tempo.get()) // TODO push digits renderer on stack
            }
        }
    }

    onFunctionKeyRelease(keyIndex: FunctionKeyIndex): void {
        if (keyIndex === FunctionKeyIndex.TempoStep) {
            this.context.digits.clear() // TODO shift digits renderer and render last (if any)
        }
    }

    onMainKeyPress(keyIndex: MainKeyIndex): void {
        if (keyIndex === MainKeyIndex.TotalAccent) return
        this.context.machine.state.patternIndex.set(keyIndex as number as PatternIndex)
        if (!this.context.machine.transport.isPlaying()) {
            this.context.mainKeys.deactivate()
            this.context.mainKeys.byIndex(keyIndex).setState(KeyState.Blink)
        }
    }

    name(): string {
        return 'Pattern Play'
    }
}