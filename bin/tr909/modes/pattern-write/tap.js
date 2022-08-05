import { Step } from "../../../audio/tr909/memory.js";
import { TerminableVoid } from "../../../lib/common.js";
import { FunctionKeyLabel, MainKeyIndex } from "../../keys.js";
import { Mode } from "../../mode.js";
import { Utils, InstrumentMode } from "../../utils.js";
export class TapInputMode extends Mode {
    constructor(context) {
        super(context);
        this.clearPressed = false;
        this.clearStepSubscription = TerminableVoid;
        this.context.resetMainKeys();
        this.postMessage(true);
        this.with(this.context.startStepRunningAnimation());
        this.with({
            terminate: () => {
                this.postMessage(false);
                this.clearStepSubscription.terminate();
            }
        });
    }
    onFunctionKeyPress(label) {
        if (this.context.maySwitchPatternEditMode(label)) {
            return true;
        }
        if (label === FunctionKeyLabel.Scale) {
            this.context.memoryState().activePattern().cycleToNextScale();
            return true;
        }
        if (label === FunctionKeyLabel.Clear) {
            this.clearPressed = true;
            this.clearStepSubscription = this.context.machine.processorStepIndex.addObserver(stepIndex => {
                console.log(this.context.getConcurrentMainKeys());
                const instrumentMode = Utils.buttonIndicesToInstrumentMode(this.context.getConcurrentMainKeys());
                if (instrumentMode !== InstrumentMode.None && instrumentMode !== InstrumentMode.TotalAccent) {
                    const pattern = this.context.memoryState().activePattern();
                    Utils.clearPatternStep(pattern, instrumentMode, stepIndex);
                }
            }, true);
            return false;
        }
        if (this.context.mayToggle(label, FunctionKeyLabel.CycleGuide, this.context.memoryState().cycleGuideMode)) {
            return true;
        }
        return true;
    }
    onFunctionKeyRelease(label) {
        if (label === FunctionKeyLabel.Clear) {
            this.clearPressed = false;
            this.clearStepSubscription.terminate();
            this.clearStepSubscription = TerminableVoid;
        }
    }
    onMainKeyPress(keyIndex) {
        if (keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            if (this.clearPressed) {
                return false;
            }
            else {
                const machine = this.context.machine;
                const playInstrument = Utils.keyIndexToPlayInstrument(keyIndex, this.context.getConcurrentMainKeys());
                const channelIndex = playInstrument.channelIndex;
                const step = playInstrument.step;
                machine.play(channelIndex, step);
                if (machine.transport.isPlaying()) {
                    this.context.memoryState().activePattern()
                        .setStep(channelIndex, machine.processorStepIndex.get(), step ? Step.Full : Step.Weak);
                }
                return true;
            }
        }
        return true;
    }
    name() {
        return 'Tap';
    }
    postMessage(enabled) {
        this.context.machine.worklet.port.postMessage({
            type: 'set-tap-mode',
            enabled
        });
    }
}
//# sourceMappingURL=tap.js.map