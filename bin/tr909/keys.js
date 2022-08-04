import { BankIndex, PatternGroupIndex, TrackIndex } from "../audio/tr909/memory.js";
export var PatternEditMode;
(function (PatternEditMode) {
    PatternEditMode[PatternEditMode["Step"] = 0] = "Step";
    PatternEditMode[PatternEditMode["Tap"] = 1] = "Tap";
})(PatternEditMode || (PatternEditMode = {}));
export var MainKeyIndex;
(function (MainKeyIndex) {
    MainKeyIndex[MainKeyIndex["Step1"] = 0] = "Step1";
    MainKeyIndex[MainKeyIndex["Step2"] = 1] = "Step2";
    MainKeyIndex[MainKeyIndex["Step3"] = 2] = "Step3";
    MainKeyIndex[MainKeyIndex["Step4"] = 3] = "Step4";
    MainKeyIndex[MainKeyIndex["Step5"] = 4] = "Step5";
    MainKeyIndex[MainKeyIndex["Step6"] = 5] = "Step6";
    MainKeyIndex[MainKeyIndex["Step7"] = 6] = "Step7";
    MainKeyIndex[MainKeyIndex["Step8"] = 7] = "Step8";
    MainKeyIndex[MainKeyIndex["Step9"] = 8] = "Step9";
    MainKeyIndex[MainKeyIndex["Step10"] = 9] = "Step10";
    MainKeyIndex[MainKeyIndex["Step11"] = 10] = "Step11";
    MainKeyIndex[MainKeyIndex["Step12"] = 11] = "Step12";
    MainKeyIndex[MainKeyIndex["Step13"] = 12] = "Step13";
    MainKeyIndex[MainKeyIndex["Step14"] = 13] = "Step14";
    MainKeyIndex[MainKeyIndex["Step15"] = 14] = "Step15";
    MainKeyIndex[MainKeyIndex["Step16"] = 15] = "Step16";
    MainKeyIndex[MainKeyIndex["CartridgeEnterTotalAccent"] = 16] = "CartridgeEnterTotalAccent";
})(MainKeyIndex || (MainKeyIndex = {}));
export var FunctionKeyIndex;
(function (FunctionKeyIndex) {
    FunctionKeyIndex[FunctionKeyIndex["Track1"] = 0] = "Track1";
    FunctionKeyIndex[FunctionKeyIndex["Track2"] = 1] = "Track2";
    FunctionKeyIndex[FunctionKeyIndex["Track3"] = 2] = "Track3";
    FunctionKeyIndex[FunctionKeyIndex["Track4"] = 3] = "Track4";
    FunctionKeyIndex[FunctionKeyIndex["PatternGroup1"] = 4] = "PatternGroup1";
    FunctionKeyIndex[FunctionKeyIndex["PatternGroup2"] = 5] = "PatternGroup2";
    FunctionKeyIndex[FunctionKeyIndex["PatternGroup3"] = 6] = "PatternGroup3";
    FunctionKeyIndex[FunctionKeyIndex["EmptyExtInst"] = 7] = "EmptyExtInst";
    FunctionKeyIndex[FunctionKeyIndex["TempoStep"] = 8] = "TempoStep";
    FunctionKeyIndex[FunctionKeyIndex["BackTap"] = 9] = "BackTap";
    FunctionKeyIndex[FunctionKeyIndex["ForwardBankI"] = 10] = "ForwardBankI";
    FunctionKeyIndex[FunctionKeyIndex["AvailableMeasuresBankII"] = 11] = "AvailableMeasuresBankII";
    FunctionKeyIndex[FunctionKeyIndex["CycleGuideLastMeasure"] = 12] = "CycleGuideLastMeasure";
    FunctionKeyIndex[FunctionKeyIndex["TapeSyncTempoMode"] = 13] = "TapeSyncTempoMode";
    FunctionKeyIndex[FunctionKeyIndex["LastStep"] = 14] = "LastStep";
    FunctionKeyIndex[FunctionKeyIndex["Scale"] = 15] = "Scale";
    FunctionKeyIndex[FunctionKeyIndex["ShuffleFlam"] = 16] = "ShuffleFlam";
    FunctionKeyIndex[FunctionKeyIndex["Clear"] = 17] = "Clear";
    FunctionKeyIndex[FunctionKeyIndex["InstrumentSelect"] = 18] = "InstrumentSelect";
    FunctionKeyIndex[FunctionKeyIndex["Shift"] = 19] = "Shift";
})(FunctionKeyIndex || (FunctionKeyIndex = {}));
export const FunctionKeyboardShortcuts = new Map([
    ['Digit1', FunctionKeyIndex.Track1],
    ['Digit2', FunctionKeyIndex.Track2],
    ['Digit3', FunctionKeyIndex.Track3],
    ['Digit4', FunctionKeyIndex.Track4],
    ['Digit5', FunctionKeyIndex.PatternGroup1],
    ['Digit6', FunctionKeyIndex.PatternGroup2],
    ['Digit7', FunctionKeyIndex.PatternGroup3],
    ['Digit8', FunctionKeyIndex.EmptyExtInst],
    ['KeyT', FunctionKeyIndex.TempoStep],
    ['KeyL', FunctionKeyIndex.LastStep],
    ['KeyS', FunctionKeyIndex.ShuffleFlam],
    ['KeyC', FunctionKeyIndex.Clear],
    ['KeyI', FunctionKeyIndex.InstrumentSelect],
]);
export class ZeroBasedIndices {
}
ZeroBasedIndices.BankGroupKeys = [
    FunctionKeyIndex.ForwardBankI, FunctionKeyIndex.AvailableMeasuresBankII
];
ZeroBasedIndices.TrackKeys = [
    FunctionKeyIndex.Track1, FunctionKeyIndex.Track2, FunctionKeyIndex.Track3, FunctionKeyIndex.Track4
];
ZeroBasedIndices.PatternGroupKeys = [
    FunctionKeyIndex.PatternGroup1, FunctionKeyIndex.PatternGroup2, FunctionKeyIndex.PatternGroup3
];
ZeroBasedIndices.PatternEditModes = [
    FunctionKeyIndex.TempoStep, FunctionKeyIndex.BackTap
];
ZeroBasedIndices.StepKeys = [
    MainKeyIndex.Step1, MainKeyIndex.Step2, MainKeyIndex.Step3, MainKeyIndex.Step4,
    MainKeyIndex.Step5, MainKeyIndex.Step6, MainKeyIndex.Step7, MainKeyIndex.Step8,
    MainKeyIndex.Step9, MainKeyIndex.Step10, MainKeyIndex.Step11, MainKeyIndex.Step12,
    MainKeyIndex.Step13, MainKeyIndex.Step14, MainKeyIndex.Step15, MainKeyIndex.Step16
];
export class FunctionKeyLabel {
    constructor(keyIndex, value, multiTap) {
        this.keyIndex = keyIndex;
        this.value = value;
        this.multiTap = multiTap;
    }
    static create(keyIndex, value, multiTap = false) {
        return new FunctionKeyLabel(keyIndex, value, multiTap);
    }
}
FunctionKeyLabel.TrackPlay = [
    FunctionKeyLabel.create(FunctionKeyIndex.Track1, TrackIndex.I),
    FunctionKeyLabel.create(FunctionKeyIndex.Track2, TrackIndex.II),
    FunctionKeyLabel.create(FunctionKeyIndex.Track3, TrackIndex.III),
    FunctionKeyLabel.create(FunctionKeyIndex.Track4, TrackIndex.IV)
];
FunctionKeyLabel.PatternPlay = [
    FunctionKeyLabel.create(FunctionKeyIndex.PatternGroup1, PatternGroupIndex.I),
    FunctionKeyLabel.create(FunctionKeyIndex.PatternGroup2, PatternGroupIndex.II),
    FunctionKeyLabel.create(FunctionKeyIndex.PatternGroup3, PatternGroupIndex.III)
];
FunctionKeyLabel.Empty = FunctionKeyLabel.create(FunctionKeyIndex.EmptyExtInst, 'empty');
FunctionKeyLabel.Tempo = FunctionKeyLabel.create(FunctionKeyIndex.TempoStep, 'tempo');
FunctionKeyLabel.Back = FunctionKeyLabel.create(FunctionKeyIndex.BackTap, 'back');
FunctionKeyLabel.Forward = FunctionKeyLabel.create(FunctionKeyIndex.ForwardBankI, 'forward');
FunctionKeyLabel.AvailableMeasures = FunctionKeyLabel.create(FunctionKeyIndex.AvailableMeasuresBankII, 'available measure');
FunctionKeyLabel.CycleGuide = FunctionKeyLabel.create(FunctionKeyIndex.CycleGuideLastMeasure, 'cycle/guide');
FunctionKeyLabel.TapeSync = FunctionKeyLabel.create(FunctionKeyIndex.TapeSyncTempoMode, 'tape sync');
FunctionKeyLabel.LastStep = FunctionKeyLabel.create(FunctionKeyIndex.LastStep, 'last step', true);
FunctionKeyLabel.Scale = FunctionKeyLabel.create(FunctionKeyIndex.Scale, 'scale');
FunctionKeyLabel.ShuffleFlam = FunctionKeyLabel.create(FunctionKeyIndex.ShuffleFlam, 'shuffle/flam', true);
FunctionKeyLabel.Clear = FunctionKeyLabel.create(FunctionKeyIndex.Clear, 'clear', true);
FunctionKeyLabel.InstrumentSelect = FunctionKeyLabel.create(FunctionKeyIndex.InstrumentSelect, 'instrument select', true);
FunctionKeyLabel.Shift = FunctionKeyLabel.create(FunctionKeyIndex.Shift, 'shift', true);
FunctionKeyLabel.TrackWrite = [
    FunctionKeyLabel.create(FunctionKeyIndex.Track1, TrackIndex.I),
    FunctionKeyLabel.create(FunctionKeyIndex.Track2, TrackIndex.II),
    FunctionKeyLabel.create(FunctionKeyIndex.Track3, TrackIndex.III),
    FunctionKeyLabel.create(FunctionKeyIndex.Track4, TrackIndex.IV)
];
FunctionKeyLabel.PatternWrite = [
    FunctionKeyLabel.create(FunctionKeyIndex.PatternGroup1, PatternGroupIndex.I),
    FunctionKeyLabel.create(FunctionKeyIndex.PatternGroup2, PatternGroupIndex.II),
    FunctionKeyLabel.create(FunctionKeyIndex.PatternGroup3, PatternGroupIndex.III)
];
FunctionKeyLabel.ExtInst = FunctionKeyLabel.create(FunctionKeyIndex.EmptyExtInst, 'external instrument');
FunctionKeyLabel.PatternEditMode = [
    FunctionKeyLabel.create(FunctionKeyIndex.TempoStep, PatternEditMode.Step),
    FunctionKeyLabel.create(FunctionKeyIndex.BackTap, PatternEditMode.Tap)
];
FunctionKeyLabel.BankGroup = [
    FunctionKeyLabel.create(FunctionKeyIndex.ForwardBankI, BankIndex.I),
    FunctionKeyLabel.create(FunctionKeyIndex.AvailableMeasuresBankII, BankIndex.II)
];
FunctionKeyLabel.LastMeasure = FunctionKeyLabel.create(FunctionKeyIndex.CycleGuideLastMeasure, 'last measure');
FunctionKeyLabel.TempoMode = FunctionKeyLabel.create(FunctionKeyIndex.TapeSyncTempoMode, 'tempo mode');
FunctionKeyLabel.ShiftLastStep = FunctionKeyLabel.create(FunctionKeyIndex.LastStep, '');
FunctionKeyLabel.ShiftScale = FunctionKeyLabel.create(FunctionKeyIndex.Scale, '');
FunctionKeyLabel.ShiftShuffleFlam = FunctionKeyLabel.create(FunctionKeyIndex.ShuffleFlam, '');
FunctionKeyLabel.ShiftClear = FunctionKeyLabel.create(FunctionKeyIndex.Clear, '');
FunctionKeyLabel.ShiftInstrumentSelect = FunctionKeyLabel.create(FunctionKeyIndex.InstrumentSelect, '');
FunctionKeyLabel.NormalKeys = [
    ...FunctionKeyLabel.TrackPlay,
    ...FunctionKeyLabel.PatternPlay,
    FunctionKeyLabel.Empty,
    FunctionKeyLabel.Tempo,
    FunctionKeyLabel.Back,
    FunctionKeyLabel.Forward,
    FunctionKeyLabel.AvailableMeasures,
    FunctionKeyLabel.CycleGuide,
    FunctionKeyLabel.TapeSync,
    FunctionKeyLabel.LastStep,
    FunctionKeyLabel.Scale,
    FunctionKeyLabel.ShuffleFlam,
    FunctionKeyLabel.Clear,
    FunctionKeyLabel.InstrumentSelect,
    FunctionKeyLabel.Shift
];
FunctionKeyLabel.ShiftKeys = [
    ...FunctionKeyLabel.TrackWrite,
    ...FunctionKeyLabel.PatternWrite,
    FunctionKeyLabel.ExtInst,
    ...FunctionKeyLabel.PatternEditMode,
    ...FunctionKeyLabel.BankGroup,
    FunctionKeyLabel.LastMeasure,
    FunctionKeyLabel.TempoMode,
    FunctionKeyLabel.ShiftLastStep,
    FunctionKeyLabel.ShiftScale,
    FunctionKeyLabel.ShiftShuffleFlam,
    FunctionKeyLabel.ShiftClear,
    FunctionKeyLabel.ShiftInstrumentSelect
];
export var KeyState;
(function (KeyState) {
    KeyState[KeyState["Off"] = 0] = "Off";
    KeyState[KeyState["Flash"] = 1] = "Flash";
    KeyState[KeyState["Blink"] = 2] = "Blink";
    KeyState[KeyState["On"] = 3] = "On";
})(KeyState || (KeyState = {}));
export class Key {
    constructor(element, type, keyIndex) {
        this.element = element;
        this.type = type;
        this.keyIndex = keyIndex;
        this.state = KeyState.Off;
    }
    setPointerCapture(pointerId) {
        this.element.setPointerCapture(pointerId);
    }
    setState(state) {
        if (this.state === state) {
            return;
        }
        this.state = state;
        this.applyState();
    }
    setPressed(isPressed) {
        this.element.classList.toggle('active', isPressed);
    }
    applyState() {
        this.element.classList.toggle('enabled', this.state === KeyState.On);
        this.element.classList.toggle('blink-enabled', this.state === KeyState.Blink);
        this.element.classList.toggle('flash-enabled', this.state === KeyState.Flash);
    }
    flash() {
        this.element.classList.toggle('enabled', this.state !== KeyState.On);
        this.element.classList.toggle('blink-enabled', this.state !== KeyState.Blink);
        this.element.classList.toggle('flash-enabled', this.state !== KeyState.Flash);
    }
    touchPoint() {
        const rect = this.element.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }
    isMainKey() {
        return this.type === 'main';
    }
    isFunctionKey() {
        return this.type === 'function';
    }
}
export class KeyGroup {
    constructor(keys) {
        this.keys = keys;
    }
    forEach(fn) {
        this.keys.forEach(fn);
    }
    byIndex(index) {
        return this.keys[index];
    }
    activate(map, indices) {
        indices.forEach((keyIndex, zeroBasedIndex) => this.byIndex(keyIndex).setState(map(zeroBasedIndex)));
    }
    deactivate(indices) {
        if (indices === undefined) {
            this.keys.forEach(key => key.setState(KeyState.Off));
        }
        else {
            indices.forEach((keyIndex) => this.byIndex(keyIndex).setState(KeyState.Off));
        }
    }
}
//# sourceMappingURL=keys.js.map