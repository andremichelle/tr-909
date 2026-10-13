import {isDefined, Optional, panic} from "@opendaw/lib-std"
import {ChannelIndex, Pattern, Step} from "@/audio/memory"
import {KeyState, MainKeyIndex} from "./keys"

type StepModifier = {
    weakFull(step: Step): Step
    full(step: Step): Step
    extra(step: Step): Step
}

export type PlayInstrument = { channelIndex: ChannelIndex, step: Step }

export class InstrumentMode {
    static readonly None = new InstrumentMode(undefined, false, "None")
    static readonly Bassdrum = new InstrumentMode(ChannelIndex.Bassdrum, false, "Bassdrum")
    static readonly BassdrumFlam = new InstrumentMode(ChannelIndex.Bassdrum, true, "Bassdrum (Flam)")
    static readonly Snaredrum = new InstrumentMode(ChannelIndex.Snaredrum, false, "Snaredrum")
    static readonly SnaredrumFlam = new InstrumentMode(ChannelIndex.Snaredrum, true, "Snaredrum (Flam)")
    static readonly TomLow = new InstrumentMode(ChannelIndex.TomLow, false, "TomLow")
    static readonly TomLowFlam = new InstrumentMode(ChannelIndex.TomLow, true, "TomLow (Flam)")
    static readonly TomMid = new InstrumentMode(ChannelIndex.TomMid, false, "TomMid")
    static readonly TomMidFlam = new InstrumentMode(ChannelIndex.TomMid, true, "TomMid (Flam)")
    static readonly TomHi = new InstrumentMode(ChannelIndex.TomHi, false, "TomHi")
    static readonly TomHiFlam = new InstrumentMode(ChannelIndex.TomHi, true, "TomHi (Flam)")
    static readonly Rim = new InstrumentMode(ChannelIndex.Rim, false, "Rim")
    static readonly Clap = new InstrumentMode(ChannelIndex.Clap, false, "Clap")
    static readonly HihatClosed = new InstrumentMode(ChannelIndex.Hihat, false, "Hihat (Closed)")
    static readonly HihatOpened = new InstrumentMode(ChannelIndex.Hihat, true, "Hihat (Opened)")
    static readonly Crash = new InstrumentMode(ChannelIndex.Crash, false, "Crash")
    static readonly Ride = new InstrumentMode(ChannelIndex.Ride, false, "Ride")
    static readonly TotalAccent = new InstrumentMode(undefined, false, "Total Accent")

    // extra means flam or open hihat
    private constructor(readonly channelIndex: Optional<ChannelIndex>, readonly extra: boolean, readonly name: string) {}
}

type InstrumentKeys = {
    keys: [MainKeyIndex] | [MainKeyIndex, MainKeyIndex]
    single: InstrumentMode
    both?: InstrumentMode
    modifier: keyof StepModifier
}

const InstrumentKeyMap: ReadonlyArray<InstrumentKeys> = [
    {keys: [MainKeyIndex.Step1, MainKeyIndex.Step2], single: InstrumentMode.Bassdrum, both: InstrumentMode.BassdrumFlam, modifier: "weakFull"},
    {keys: [MainKeyIndex.Step3, MainKeyIndex.Step4], single: InstrumentMode.Snaredrum, both: InstrumentMode.SnaredrumFlam, modifier: "weakFull"},
    {keys: [MainKeyIndex.Step5, MainKeyIndex.Step6], single: InstrumentMode.TomLow, both: InstrumentMode.TomLowFlam, modifier: "weakFull"},
    {keys: [MainKeyIndex.Step7, MainKeyIndex.Step8], single: InstrumentMode.TomMid, both: InstrumentMode.TomMidFlam, modifier: "weakFull"},
    {keys: [MainKeyIndex.Step9, MainKeyIndex.Step10], single: InstrumentMode.TomHi, both: InstrumentMode.TomHiFlam, modifier: "weakFull"},
    {keys: [MainKeyIndex.Step11], single: InstrumentMode.Rim, modifier: "full"},
    {keys: [MainKeyIndex.Step12], single: InstrumentMode.Clap, modifier: "full"},
    {keys: [MainKeyIndex.Step13, MainKeyIndex.Step14], single: InstrumentMode.HihatClosed, both: InstrumentMode.HihatOpened, modifier: "weakFull"},
    {keys: [MainKeyIndex.Step15], single: InstrumentMode.Crash, modifier: "full"},
    {keys: [MainKeyIndex.Step16], single: InstrumentMode.Ride, modifier: "full"}
]

const PlayInstrumentMap: ReadonlyArray<[ChannelIndex, Step]> = [
    [ChannelIndex.Bassdrum, Step.Full], [ChannelIndex.Bassdrum, Step.Weak],
    [ChannelIndex.Snaredrum, Step.Full], [ChannelIndex.Snaredrum, Step.Weak],
    [ChannelIndex.TomLow, Step.Full], [ChannelIndex.TomLow, Step.Weak],
    [ChannelIndex.TomMid, Step.Full], [ChannelIndex.TomMid, Step.Weak],
    [ChannelIndex.TomHi, Step.Full], [ChannelIndex.TomHi, Step.Weak],
    [ChannelIndex.Rim, Step.Full], [ChannelIndex.Clap, Step.Full],
    [ChannelIndex.Hihat, Step.Full], [ChannelIndex.Hihat, Step.Weak],
    [ChannelIndex.Crash, Step.Full], [ChannelIndex.Ride, Step.Full]
]

const findEntry = (mode: InstrumentMode): Optional<InstrumentKeys> =>
    InstrumentKeyMap.find(entry => entry.single === mode || entry.both === mode)

export namespace Instruments {
    export const fromKeys = (keyIndices: ReadonlySet<MainKeyIndex>): InstrumentMode => {
        for (const {keys, single, both} of InstrumentKeyMap) {
            const pressed = keys.filter(key => keyIndices.has(key)).length
            if (pressed === 2 && isDefined(both)) {return both}
            if (pressed > 0) {return single}
        }
        return keyIndices.has(MainKeyIndex.CartridgeEnterTotalAccent) ? InstrumentMode.TotalAccent : InstrumentMode.None
    }

    export const playInstrument = (keyIndex: MainKeyIndex, other: ReadonlySet<MainKeyIndex>): PlayInstrument => {
        if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {return panic("Total Accent cannot be played")}
        const [channelIndex, step] = PlayInstrumentMap[keyIndex]
        if (keyIndex === MainKeyIndex.Step13 && other.has(MainKeyIndex.Step14)) {return {channelIndex, step: Step.Extra}}
        if (keyIndex === MainKeyIndex.Step14 && other.has(MainKeyIndex.Step13)) {return {channelIndex, step: Step.Extra}}
        return {channelIndex, step}
    }

    export const setNextStepValue = (pattern: Pattern, mode: InstrumentMode, stepIndex: number): void =>
        modifyPatternStep(pattern, mode, stepIndex, {
            weakFull: step => step === Step.None || step === Step.Extra ? Step.Weak : step === Step.Weak ? Step.Full : Step.None,
            full: step => step !== Step.Full ? Step.Full : Step.None,
            extra: step => step !== Step.Extra ? Step.Extra : Step.None
        }, () => pattern.setTotalAccent(stepIndex, !pattern.isTotalAccent(stepIndex)))

    export const clearPatternStep = (pattern: Pattern, mode: InstrumentMode, stepIndex: number): void =>
        modifyPatternStep(pattern, mode, stepIndex, {
            weakFull: step => step === Step.Full || step === Step.Weak ? Step.None : step,
            full: step => step === Step.Full ? Step.None : step,
            extra: step => step === Step.Extra ? Step.None : step
        }, () => pattern.setTotalAccent(stepIndex, false))

    export const stepToKeyState = (mode: InstrumentMode): (pattern: Pattern, keyIndex: MainKeyIndex) => KeyState => {
        if (mode === InstrumentMode.TotalAccent) {
            return (pattern, keyIndex) => pattern.isTotalAccent(keyIndex) ? KeyState.On : KeyState.Off
        }
        const {channelIndex, extra} = mode
        if (!isDefined(channelIndex)) {return panic(`Unknown instrument mode (${mode.name})`)}
        const mapping = extra
            ? (step: Step): KeyState => step === Step.Extra ? KeyState.On : KeyState.Off
            : (step: Step): KeyState => step === Step.Weak ? KeyState.Flash : step === Step.Full ? KeyState.On : KeyState.Off
        return (pattern, keyIndex) => keyIndex < 16 ? mapping(pattern.getStep(channelIndex, keyIndex)) : KeyState.Off
    }

    export const modeToKeyState = (mode: InstrumentMode): (keyIndex: MainKeyIndex) => KeyState => {
        if (mode === InstrumentMode.TotalAccent) {
            return keyIndex => keyIndex === MainKeyIndex.CartridgeEnterTotalAccent ? KeyState.On : KeyState.Off
        }
        const entry = findEntry(mode)
        if (!isDefined(entry)) {return panic(`Unknown instrument mode (${mode.name})`)}
        const [first, second] = entry.keys
        const secondState = mode.extra ? KeyState.On : KeyState.Flash
        return keyIndex => keyIndex === first ? KeyState.On : keyIndex === second ? secondState : KeyState.Off
    }

    const modifyPatternStep = (pattern: Pattern, mode: InstrumentMode, stepIndex: number,
                               modifier: StepModifier, totalAccent: () => void): void => {
        if (mode === InstrumentMode.TotalAccent) {
            totalAccent()
            return
        }
        const {channelIndex} = mode
        const entry = findEntry(mode)
        if (!isDefined(channelIndex) || !isDefined(entry)) {return panic("Could not set step.")}
        const next = modifier[mode.extra ? "extra" : entry.modifier]
        pattern.setStep(channelIndex, stepIndex, next(pattern.getStep(channelIndex, stepIndex)))
    }
}
