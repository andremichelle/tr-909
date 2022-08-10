import { Step } from "../../../audio/tr909/memory.js";
import { FunctionKeyLabel, MainKeyIndex } from "../../keys.js";
import { Mode } from "../../mode.js";
import { Utils } from "../../utils.js";
export class TapInputMode extends Mode {
    constructor(context, editor) {
        super(context);
        this.editor = editor;
        this.context.resetMainKeys();
        this.postMessage(true);
        this.with(this.context.startStepRunningAnimation());
        this.with({ terminate: () => this.postMessage(false) });
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
            this.editor.clearTapMode();
            return false;
        }
        if (this.context.mayToggle(label, FunctionKeyLabel.CycleGuide, this.context.memoryState().cycleGuideMode)) {
            return true;
        }
        return true;
    }
    onMainKeyPress(label) {
        if (label.keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
            const machine = this.context.machine;
            const playInstrument = Utils.keyIndexToPlayInstrument(label.keyIndex, this.context.getConcurrentMainKeys());
            const channelIndex = playInstrument.channelIndex;
            const step = playInstrument.step;
            machine.play(channelIndex, step);
            if (machine.transport.isPlaying()) {
                this.context.memoryState().activePattern()
                    .setStep(channelIndex, machine.processorStepIndex.get(), step ? Step.Full : Step.Weak);
            }
            return true;
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