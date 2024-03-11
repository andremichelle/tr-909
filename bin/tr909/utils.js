import { ChannelIndex, Step } from "../audio/tr909/memory.js";
import { elseIfUndefined } from "../lib/common.js";
import { KeyState, MainKeyIndex } from "./keys.js";
class InstrumentMode {
    constructor(channelIndex, extra, name) {
        this.channelIndex = channelIndex;
        this.extra = extra;
        this.name = name;
    }
}
InstrumentMode.None = new InstrumentMode(undefined, false, 'None');
InstrumentMode.Bassdrum = new InstrumentMode(ChannelIndex.Bassdrum, false, 'Bassdrum');
InstrumentMode.BassdrumFlam = new InstrumentMode(ChannelIndex.Bassdrum, true, 'Bassdrum (Flam)');
InstrumentMode.Snaredrum = new InstrumentMode(ChannelIndex.Snaredrum, false, 'Snaredrum');
InstrumentMode.SnaredrumFlam = new InstrumentMode(ChannelIndex.Snaredrum, true, 'Snaredrum (Flam)');
InstrumentMode.TomLow = new InstrumentMode(ChannelIndex.TomLow, false, 'TomLow');
InstrumentMode.TomLowFlam = new InstrumentMode(ChannelIndex.TomLow, true, 'TomLow Flam');
InstrumentMode.TomMid = new InstrumentMode(ChannelIndex.TomMid, false, 'TomMid');
InstrumentMode.TomMidFlam = new InstrumentMode(ChannelIndex.TomMid, true, 'TomMid (Flam)');
InstrumentMode.TomHi = new InstrumentMode(ChannelIndex.TomHi, false, 'TomHi');
InstrumentMode.TomHiFlam = new InstrumentMode(ChannelIndex.TomHi, true, 'TomHi (Flam)');
InstrumentMode.Rim = new InstrumentMode(ChannelIndex.Rim, false, 'Rim');
InstrumentMode.Clap = new InstrumentMode(ChannelIndex.Clap, false, 'Clap');
InstrumentMode.HihatClosed = new InstrumentMode(ChannelIndex.Hihat, false, 'Hihat (Closed)');
InstrumentMode.HihatOpened = new InstrumentMode(ChannelIndex.Hihat, true, 'Hihat (Opened)');
InstrumentMode.Crash = new InstrumentMode(ChannelIndex.Crash, false, 'Crash');
InstrumentMode.Ride = new InstrumentMode(ChannelIndex.Ride, false, 'Ride');
InstrumentMode.TotalAccent = new InstrumentMode(undefined, false, 'Total Accent');
export { InstrumentMode };
class Utils {
    static keyIndexToPlayInstrument(keyIndex, other) {
        if (keyIndex === MainKeyIndex.Step1) {
            return { channelIndex: ChannelIndex.Bassdrum, step: Step.Full };
        }
        else if (keyIndex === MainKeyIndex.Step2) {
            return { channelIndex: ChannelIndex.Bassdrum, step: Step.Weak };
        }
        else if (keyIndex === MainKeyIndex.Step3) {
            return { channelIndex: ChannelIndex.Snaredrum, step: Step.Full };
        }
        else if (keyIndex === MainKeyIndex.Step4) {
            return { channelIndex: ChannelIndex.Snaredrum, step: Step.Weak };
        }
        else if (keyIndex === MainKeyIndex.Step5) {
            return { channelIndex: ChannelIndex.TomLow, step: Step.Full };
        }
        else if (keyIndex === MainKeyIndex.Step6) {
            return { channelIndex: ChannelIndex.TomLow, step: Step.Weak };
        }
        else if (keyIndex === MainKeyIndex.Step7) {
            return { channelIndex: ChannelIndex.TomMid, step: Step.Full };
        }
        else if (keyIndex === MainKeyIndex.Step8) {
            return { channelIndex: ChannelIndex.TomMid, step: Step.Weak };
        }
        else if (keyIndex === MainKeyIndex.Step9) {
            return { channelIndex: ChannelIndex.TomHi, step: Step.Full };
        }
        else if (keyIndex === MainKeyIndex.Step10) {
            return { channelIndex: ChannelIndex.TomHi, step: Step.Weak };
        }
        else if (keyIndex === MainKeyIndex.Step11) {
            return { channelIndex: ChannelIndex.Rim, step: Step.Full };
        }
        else if (keyIndex === MainKeyIndex.Step12) {
            return { channelIndex: ChannelIndex.Clap, step: Step.Full };
        }
        else if (keyIndex === MainKeyIndex.Step13) {
            return { channelIndex: ChannelIndex.Hihat, step: other.has(MainKeyIndex.Step14) ? Step.Extra : Step.Full };
        }
        else if (keyIndex === MainKeyIndex.Step14) {
            return { channelIndex: ChannelIndex.Hihat, step: other.has(MainKeyIndex.Step13) ? Step.Extra : Step.Weak };
        }
        else if (keyIndex === MainKeyIndex.Step15) {
            return { channelIndex: ChannelIndex.Crash, step: Step.Full };
        }
        else if (keyIndex === MainKeyIndex.Step16) {
            return { channelIndex: ChannelIndex.Ride, step: Step.Full };
        }
        else if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {
            throw new Error(`Total Accent cannot be played`);
        }
        throw new Error(`Unknown index(${keyIndex})`);
    }
    static setNextStepValue(pattern, instrumentMode, stepIndex) {
        Utils.modifyPatternStep(pattern, instrumentMode, {
            weakFull: (step) => step === Step.None || step === Step.Extra ? Step.Weak : step === Step.Weak ? Step.Full : Step.None,
            full: (step) => step !== Step.Full ? Step.Full : Step.None,
            extra: (step) => step !== Step.Extra ? Step.Extra : Step.None,
            totalAccent: (stepIndex) => pattern.setTotalAccent(stepIndex, !pattern.isTotalAccent(stepIndex))
        }, stepIndex);
    }
    static clearPatternStep(pattern, instrumentMode, stepIndex) {
        Utils.modifyPatternStep(pattern, instrumentMode, {
            weakFull: (step) => step === Step.Full || step === Step.Weak ? Step.None : step,
            full: (step) => step === Step.Full ? Step.None : step,
            extra: (step) => step === Step.Extra ? Step.None : step,
            totalAccent: (stepIndex) => pattern.setTotalAccent(stepIndex, false)
        }, stepIndex);
    }
    static modifyPatternStep(pattern, instrumentMode, modifier, stepIndex) {
        const apply = (channelIndex, next) => pattern.setStep(channelIndex, stepIndex, next(pattern.getStep(channelIndex, stepIndex)));
        if (instrumentMode === InstrumentMode.Bassdrum) {
            apply(ChannelIndex.Bassdrum, modifier.weakFull);
        }
        else if (instrumentMode === InstrumentMode.BassdrumFlam) {
            apply(ChannelIndex.Bassdrum, modifier.extra);
        }
        else if (instrumentMode === InstrumentMode.Snaredrum) {
            apply(ChannelIndex.Snaredrum, modifier.weakFull);
        }
        else if (instrumentMode === InstrumentMode.SnaredrumFlam) {
            apply(ChannelIndex.Snaredrum, modifier.extra);
        }
        else if (instrumentMode === InstrumentMode.TomLow) {
            apply(ChannelIndex.TomLow, modifier.weakFull);
        }
        else if (instrumentMode === InstrumentMode.TomLowFlam) {
            apply(ChannelIndex.TomLow, modifier.extra);
        }
        else if (instrumentMode === InstrumentMode.TomMid) {
            apply(ChannelIndex.TomMid, modifier.weakFull);
        }
        else if (instrumentMode === InstrumentMode.TomMidFlam) {
            apply(ChannelIndex.TomMid, modifier.extra);
        }
        else if (instrumentMode === InstrumentMode.TomHi) {
            apply(ChannelIndex.TomHi, modifier.weakFull);
        }
        else if (instrumentMode === InstrumentMode.TomHiFlam) {
            apply(ChannelIndex.TomHi, modifier.extra);
        }
        else if (instrumentMode === InstrumentMode.Rim) {
            apply(ChannelIndex.Rim, modifier.full);
        }
        else if (instrumentMode === InstrumentMode.Clap) {
            apply(ChannelIndex.Clap, modifier.full);
        }
        else if (instrumentMode === InstrumentMode.HihatClosed) {
            apply(ChannelIndex.Hihat, modifier.weakFull);
        }
        else if (instrumentMode === InstrumentMode.HihatOpened) {
            apply(ChannelIndex.Hihat, modifier.extra);
        }
        else if (instrumentMode === InstrumentMode.Crash) {
            apply(ChannelIndex.Crash, modifier.full);
        }
        else if (instrumentMode === InstrumentMode.Ride) {
            apply(ChannelIndex.Ride, modifier.full);
        }
        else if (instrumentMode === InstrumentMode.TotalAccent) {
            pattern.setTotalAccent(stepIndex, !pattern.isTotalAccent(stepIndex));
        }
        else {
            throw new Error('Could not set step.');
        }
    }
    static createStepToStateMapping(instrumentMode) {
        const normal = (step) => step === Step.Weak ? KeyState.Flash : step === Step.Full ? KeyState.On : KeyState.Off;
        const extra = (step) => step === Step.Extra ? KeyState.On : KeyState.Off;
        const create = (channelIndex, mapping) => (pattern, keyIndex) => keyIndex < 16 ? mapping(pattern.getStep(channelIndex, keyIndex)) : KeyState.Off;
        if (instrumentMode === InstrumentMode.Bassdrum) {
            return create(ChannelIndex.Bassdrum, normal);
        }
        else if (instrumentMode === InstrumentMode.BassdrumFlam) {
            return create(ChannelIndex.Bassdrum, extra);
        }
        else if (instrumentMode === InstrumentMode.Snaredrum) {
            return create(ChannelIndex.Snaredrum, normal);
        }
        else if (instrumentMode === InstrumentMode.SnaredrumFlam) {
            return create(ChannelIndex.Snaredrum, extra);
        }
        else if (instrumentMode === InstrumentMode.TomLow) {
            return create(ChannelIndex.TomLow, normal);
        }
        else if (instrumentMode === InstrumentMode.TomLowFlam) {
            return create(ChannelIndex.TomLow, extra);
        }
        else if (instrumentMode === InstrumentMode.TomMid) {
            return create(ChannelIndex.TomMid, normal);
        }
        else if (instrumentMode === InstrumentMode.TomMidFlam) {
            return create(ChannelIndex.TomMid, extra);
        }
        else if (instrumentMode === InstrumentMode.TomHi) {
            return create(ChannelIndex.TomHi, normal);
        }
        else if (instrumentMode === InstrumentMode.TomHiFlam) {
            return create(ChannelIndex.TomHi, extra);
        }
        else if (instrumentMode === InstrumentMode.Rim) {
            return create(ChannelIndex.Rim, normal);
        }
        else if (instrumentMode === InstrumentMode.Clap) {
            return create(ChannelIndex.Clap, normal);
        }
        else if (instrumentMode === InstrumentMode.HihatClosed) {
            return create(ChannelIndex.Hihat, normal);
        }
        else if (instrumentMode === InstrumentMode.HihatOpened) {
            return create(ChannelIndex.Hihat, extra);
        }
        else if (instrumentMode === InstrumentMode.Crash) {
            return create(ChannelIndex.Crash, normal);
        }
        else if (instrumentMode === InstrumentMode.Ride) {
            return create(ChannelIndex.Ride, normal);
        }
        else if (instrumentMode === InstrumentMode.TotalAccent) {
            return (pattern, keyIndex) => pattern.isTotalAccent(keyIndex) ? KeyState.On : KeyState.Off;
        }
        else {
            throw new Error(`Unknown instrumentMode(${instrumentMode})`);
        }
    }
    static instrumentModeToButtonStates(instrumentMode) {
        const simple = (keyIndex, index) => keyIndex === index ? KeyState.On : KeyState.Off;
        const complex = (keyIndex, i0, i1, second) => keyIndex === i0 ? KeyState.On : keyIndex === i1 ? second : KeyState.Off;
        return (keyIndex) => {
            if (instrumentMode === InstrumentMode.Bassdrum) {
                return complex(keyIndex, MainKeyIndex.Step1, MainKeyIndex.Step2, KeyState.Flash);
            }
            else if (instrumentMode === InstrumentMode.BassdrumFlam) {
                return complex(keyIndex, MainKeyIndex.Step1, MainKeyIndex.Step2, KeyState.On);
            }
            else if (instrumentMode === InstrumentMode.Snaredrum) {
                return complex(keyIndex, MainKeyIndex.Step3, MainKeyIndex.Step4, KeyState.Flash);
            }
            else if (instrumentMode === InstrumentMode.SnaredrumFlam) {
                return complex(keyIndex, MainKeyIndex.Step3, MainKeyIndex.Step4, KeyState.On);
            }
            else if (instrumentMode === InstrumentMode.TomLow) {
                return complex(keyIndex, MainKeyIndex.Step5, MainKeyIndex.Step6, KeyState.Flash);
            }
            else if (instrumentMode === InstrumentMode.TomLowFlam) {
                return complex(keyIndex, MainKeyIndex.Step5, MainKeyIndex.Step6, KeyState.On);
            }
            else if (instrumentMode === InstrumentMode.TomMid) {
                return complex(keyIndex, MainKeyIndex.Step7, MainKeyIndex.Step8, KeyState.Flash);
            }
            else if (instrumentMode === InstrumentMode.TomMidFlam) {
                return complex(keyIndex, MainKeyIndex.Step7, MainKeyIndex.Step8, KeyState.On);
            }
            else if (instrumentMode === InstrumentMode.TomHi) {
                return complex(keyIndex, MainKeyIndex.Step9, MainKeyIndex.Step10, KeyState.Flash);
            }
            else if (instrumentMode === InstrumentMode.TomHiFlam) {
                return complex(keyIndex, MainKeyIndex.Step9, MainKeyIndex.Step10, KeyState.On);
            }
            else if (instrumentMode === InstrumentMode.Rim) {
                return simple(keyIndex, MainKeyIndex.Step11);
            }
            else if (instrumentMode === InstrumentMode.Clap) {
                return simple(keyIndex, MainKeyIndex.Step12);
            }
            else if (instrumentMode === InstrumentMode.HihatClosed) {
                return complex(keyIndex, MainKeyIndex.Step13, MainKeyIndex.Step14, KeyState.Flash);
            }
            else if (instrumentMode === InstrumentMode.HihatOpened) {
                return complex(keyIndex, MainKeyIndex.Step13, MainKeyIndex.Step14, KeyState.On);
            }
            else if (instrumentMode === InstrumentMode.Crash) {
                return simple(keyIndex, MainKeyIndex.Step15);
            }
            else if (instrumentMode === InstrumentMode.Ride) {
                return simple(keyIndex, MainKeyIndex.Step16);
            }
            else if (instrumentMode === InstrumentMode.TotalAccent) {
                return simple(keyIndex, MainKeyIndex.CartridgeEnterTotalAccent);
            }
            else {
                throw new Error(`Unknown instrumentMode(${instrumentMode.name})`);
            }
        };
    }
}
Utils.buttonIndicesToInstrumentMode = (() => {
    const simple = (keyIndex, mode) => (keyIndices) => keyIndices.has(keyIndex) ? mode : InstrumentMode.None;
    const complex = (keyIndexA, keyIndexB, or, and) => (keyIndices) => {
        const a = keyIndices.has(keyIndexA);
        const b = keyIndices.has(keyIndexB);
        return a && b ? and : a || b ? or : InstrumentMode.None;
    };
    const checks = [
        complex(MainKeyIndex.Step1, MainKeyIndex.Step2, InstrumentMode.Bassdrum, InstrumentMode.BassdrumFlam),
        complex(MainKeyIndex.Step3, MainKeyIndex.Step4, InstrumentMode.Snaredrum, InstrumentMode.SnaredrumFlam),
        complex(MainKeyIndex.Step5, MainKeyIndex.Step6, InstrumentMode.TomLow, InstrumentMode.TomLowFlam),
        complex(MainKeyIndex.Step7, MainKeyIndex.Step8, InstrumentMode.TomMid, InstrumentMode.TomMidFlam),
        complex(MainKeyIndex.Step9, MainKeyIndex.Step10, InstrumentMode.TomHi, InstrumentMode.TomHiFlam),
        simple(MainKeyIndex.Step11, InstrumentMode.Rim),
        simple(MainKeyIndex.Step12, InstrumentMode.Clap),
        complex(MainKeyIndex.Step13, MainKeyIndex.Step14, InstrumentMode.HihatClosed, InstrumentMode.HihatOpened),
        simple(MainKeyIndex.Step15, InstrumentMode.Crash),
        simple(MainKeyIndex.Step16, InstrumentMode.Ride),
        simple(MainKeyIndex.CartridgeEnterTotalAccent, InstrumentMode.TotalAccent)
    ];
    return (keyIndices) => elseIfUndefined(checks.map(check => check(keyIndices))
        .find(mode => mode != InstrumentMode.None), InstrumentMode.None);
})();
export { Utils };
//# sourceMappingURL=utils.js.map