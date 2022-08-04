import { Terminator } from "../../../lib/common.js";
import { dbToGain } from "../../common.js";
export const SilentGain = dbToGain(-72.0);
export class Voice {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.terminator = new Terminator();
        this.sampleRateInv = 1.0 / this.sampleRate;
    }
    terminate() {
        this.terminator.terminate();
    }
}
//# sourceMappingURL=voice.js.map