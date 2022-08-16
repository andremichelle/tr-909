var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { secondsToBars } from "../audio/common.js";
import { TempoMapping } from "../audio/tr909/preset.js";
import { PlayMode } from "../audio/tr909/state.js";
import { ArrayUtils, Events, ifDefined, ObservableValueImpl, Parameter, PrintMapping, TerminableVoid, Terminator } from "../lib/common.js";
import { AnimationFrame, HTML, SVG } from "../lib/dom.js";
import { JsonBin } from '../lib/jsonbin.js';
import { Options } from './../lib/common.js';
import { DigitInput, Display, DisplayObservableValueProvider } from "./display.js";
import { FunctionKeyIndex, FunctionKeyLabel, FunctionKeyShortcuts, Key, KeyGroup, KeyState, MainKeyIndex, MainKeyLabel, MainKeyShortcuts, ZeroBasedIndices } from "./keys.js";
import { Knob } from "./knobs.js";
import { StepsEditingMode } from "./mode.js";
import PatternPlayMode from "./modes/pattern-play.js";
import PatternWriteMode from "./modes/pattern-write.js";
import TrackPlayMode from "./modes/track-play.js";
import TrackWriteMode from "./modes/track-write.js";
import { InstrumentMode, Utils } from "./utils.js";
export class UIContext {
    constructor(machine, parentNode) {
        this.machine = machine;
        this.parentNode = parentNode;
        this.terminator = new Terminator();
        this.tempo = new Parameter(TempoMapping, PrintMapping.FLOAT_ONE, 120.0);
        this.concurrentMainKeys = new Set();
        this.isShiftKeyPressed = false;
        this.tempoProviderSubscription = TerminableVoid;
        this.display = new Display(HTML.query('svg[data-display=led-display]', parentNode));
        this.digitInput = this.terminator.with(new DigitInput(this.display));
        this.startKey = HTML.query('button[data-control=transport-start]', this.parentNode);
        this.mainKeys = new KeyGroup([...Array.from(HTML.queryAll('[data-control=main-keys] [data-control=main-key]', parentNode)),
            HTML.query('[data-control=main-key][data-parameter=total-accent]')]
            .map((element, index) => new Key(element, 'main', index)));
        this.functionKeys = new KeyGroup(HTML.queryAll('[data-button=function-key]')
            .map((element, keyIndex) => new Key(element, 'function', keyIndex)));
        this.instrumentMode = new ObservableValueImpl(InstrumentMode.Bassdrum);
        this.stepsEditMode = new ObservableValueImpl(StepsEditingMode.Step);
        this.activeMainLabel = ArrayUtils.fill(this.mainKeys.keys.length, () => Options.None);
        this.activeFunctionLabel = ArrayUtils.fill(this.functionKeys.keys.length, () => Options.None);
        this.tempoDisplayProvider = new DisplayObservableValueProvider(this.machine.preset.tempo, 'tempo');
        this.mode = new ObservableValueImpl(new TrackPlayMode(this));
        this.installKeys();
        this.installKeyboard();
        this.installKnobs();
        this.installTransport();
        this.installAnimationFrame();
        this.terminator.with(this.machine.memory.state.cycleGuideMode
            .addObserver(mode => this.functionKeys.byIndex(FunctionKeyIndex.CycleGuideLastMeasure)
            .setState(mode ? KeyState.On : KeyState.Off), true));
        const patternSubscription = this.terminator.with(new Terminator());
        const indicator = HTML.query('[data-control=scale] [data-control=indicator]');
        const activePatternObserver = (pattern) => {
            patternSubscription.terminate();
            patternSubscription.with(pattern.scaleIndex.addObserver((scaleIndex) => indicator.y.baseVal.value = scaleIndex * 16, true));
        };
        this.terminator.with(this.machine.memory.state.patternIndicesChangeNotification.addObserver(activePatternObserver));
        activePatternObserver(this.machine.memory.state.activePattern());
        console.debug(`mode: ${this.modeName()}`);
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            console.debug(`save()`);
            try {
                const response = yield JsonBin.save({
                    version: 0.1,
                    machine: this.machine.serialize()
                });
                console.log(`date: ${new Date(response.metadata.createdAt)}`);
                console.log(`id: ${response.metadata.id}`);
                history.pushState(null, '', `#${response.metadata.id}`);
            }
            catch (reason) {
                console.warn(reason);
            }
        });
    }
    load(binId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.debug(`loadBin(binId: ${binId})`);
                const response = yield JsonBin.load(binId);
                this.deserialize(response.record);
            }
            catch (reason) {
                console.warn(reason);
            }
        });
    }
    deserialize(format) {
        if (format.version !== 0.1) {
            console.warn(`Unexpected version (${format.version})`);
            return;
        }
        try {
            this.machine.deserialize(format.machine);
            console.debug(`loaded.`);
        }
        catch (reason) {
            console.warn(`Could not deserialize. (${reason})`);
        }
    }
    modeName() {
        return this.mode.get().name();
    }
    isPlaying() {
        return this.machine.transport.isPlaying();
    }
    memory() {
        return this.machine.memory;
    }
    memoryState() {
        return this.memory().state;
    }
    activeBank() {
        return this.memoryState().activeBank();
    }
    activeTrack() {
        return this.memoryState().activeTrack();
    }
    activePattern() {
        return this.memoryState().activePattern();
    }
    activePatternGroup() {
        return this.memoryState().activePatternGroup();
    }
    maySwitchToTrackPlayMode(label) {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.TrackPlay, index => this.switchToTrackPlayMode(index));
    }
    maySwitchToTrackWriteMode(label) {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.TrackWrite, index => this.switchToTrackWriteMode(index));
    }
    maySwitchToPatternPlayMode(label) {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.PatternPlay, index => this.switchToPatternPlayMode(index));
    }
    maySwitchToPatternWriteMode(label) {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.PatternWrite, index => this.switchToPatternWriteMode(index));
    }
    maySwitchTrackIndex(label) {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.TrackPlay, index => this.machine.memory.state.trackIndex.set(index));
    }
    maySwitchBankGroupIndex(label) {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.BankGroup, index => this.machine.memory.state.bankGroupIndex.set(index));
    }
    maySwitchPatternGroupIndex(label) {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.PatternPlay, index => this.machine.memory.state.patternGroupIndex.set(index));
    }
    maySwitchPatternEditMode(label) {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.StepsEditingModes, index => this.stepsEditMode.set(index));
    }
    mayToggle(label, compare, value) {
        if (label === compare) {
            value.set(!value.get());
            return true;
        }
        return false;
    }
    switchToTrackPlayMode(trackIndex) {
        this.resetMainKeys();
        this.mode.get().terminate();
        const state = this.machine.memory.state;
        state.changeNotification.mute();
        state.trackIndex.set(trackIndex);
        state.playMode.set(PlayMode.Track);
        state.changeNotification.unmute();
        state.changeNotification.notify();
        this.mode.set(new TrackPlayMode(this));
        console.debug(`mode: ${this.modeName()}`);
    }
    switchToTrackWriteMode(trackIndex) {
        this.resetMainKeys();
        this.mode.get().terminate();
        const state = this.machine.memory.state;
        state.changeNotification.mute();
        state.trackIndex.set(trackIndex);
        state.playMode.set(PlayMode.Pattern);
        state.changeNotification.unmute();
        state.changeNotification.notify();
        this.mode.set(new TrackWriteMode(this));
        console.debug(`mode: ${this.modeName()}`);
    }
    switchToPatternPlayMode(patternGroupIndex) {
        this.resetMainKeys();
        this.mode.get().terminate();
        const state = this.machine.memory.state;
        state.changeNotification.mute();
        state.patternGroupIndex.set(patternGroupIndex);
        state.playMode.set(PlayMode.Pattern);
        state.changeNotification.unmute();
        state.changeNotification.notify();
        this.mode.set(new PatternPlayMode(this));
        console.debug(`mode: ${this.modeName()}`);
    }
    switchToPatternWriteMode(patternGroupIndex) {
        this.resetMainKeys();
        this.mode.get().terminate();
        const state = this.machine.memory.state;
        state.changeNotification.mute();
        state.patternGroupIndex.set(patternGroupIndex);
        state.playMode.set(PlayMode.Pattern);
        state.changeNotification.unmute();
        state.changeNotification.notify();
        this.mode.set(new PatternWriteMode(this));
        console.debug(`mode: ${this.modeName()}`);
    }
    resetMainKeys() {
        this.mainKeys.deactivate();
    }
    updatePatternLocationKeys(location, writeMode = false) {
        console.debug(`updatePatternLocationKeys(location: [${location.patternGroupIndex}, ${location.patternIndex}])`);
        this.updatePatternGroupKeys(location.patternGroupIndex, writeMode);
        this.mainKeys.deactivate();
        const patternIndex = this.activeBank()
            .patternGroups[location.patternGroupIndex]
            .firstOfChained(location.patternIndex).location.patternIndex;
        const chained = this.memoryState().activeBank().patternGroups[location.patternGroupIndex].getChained();
        let index = patternIndex;
        do {
            this.mainKeys.byIndex(index).setState(KeyState.On);
        } while (chained[index++]);
        this.mainKeys.byIndex(location.patternIndex).setState(KeyState.Blink);
    }
    updateTrackKeys(trackIndex, writeMode) {
        console.debug(`updateTrackKeys(index: ${trackIndex}, writeMode: ${writeMode})`);
        this.functionKeys.activate(index => index === trackIndex
            ? writeMode ? KeyState.Blink : KeyState.On : KeyState.Off, ZeroBasedIndices.TrackKeys);
    }
    updatePatternGroupKeys(patternGroupIndex, writeMode) {
        console.debug(`updatePatternGroupKeys(index: ${patternGroupIndex}, writeMode: ${writeMode})`);
        this.functionKeys.activate(index => patternGroupIndex === index
            ? writeMode ? KeyState.Blink : KeyState.On : KeyState.Off, ZeroBasedIndices.PatternGroupKeys);
    }
    updateBankGroupKeys(bankGroupIndex) {
        console.debug(`updateBankGroupKeys(index: ${bankGroupIndex})`);
        this.functionKeys.activate(index => bankGroupIndex === index
            ? KeyState.On : KeyState.Off, ZeroBasedIndices.BankGroupKeys);
    }
    watchPatternEditKeys() {
        return this.stepsEditMode.addObserver((patternEditMode) => {
            this.functionKeys.activate(index => index === patternEditMode
                ? KeyState.On
                : KeyState.Off, ZeroBasedIndices.PatternEditModes);
        }, true);
    }
    clearPatternEditKeys() {
        this.functionKeys.deactivate(ZeroBasedIndices.PatternEditModes);
    }
    watchPatternLocationKeys() {
        this.updatePatternLocationKeys(this.activePattern().location);
        return this.memoryState().patternIndicesChangeNotification
            .addObserver(pattern => this.updatePatternLocationKeys(pattern.location));
    }
    watchPatternStepsKeys() {
        const terminator = new Terminator();
        const state = this.machine.memory.state;
        const updateKeys = () => {
            const pattern = this.activePattern();
            const mapping = Utils.createStepToStateMapping(this.instrumentMode.get());
            this.mainKeys.forEach((key, keyIndex) => key.setState(keyIndex === MainKeyIndex.CartridgeEnterTotalAccent ? KeyState.Off : mapping(pattern, keyIndex)));
        };
        let patternSubscription = state.activePattern().addObserver(() => updateKeys(), true);
        terminator.with({
            terminate: () => {
                patternSubscription.terminate();
                patternSubscription = TerminableVoid;
            }
        });
        terminator.with(state.patternIndicesChangeNotification.addObserver((pattern) => {
            patternSubscription.terminate();
            patternSubscription = pattern.addObserver(() => updateKeys(), true);
        }));
        return terminator;
    }
    startStepRunningAnimation() {
        const terminator = new Terminator();
        let flashing = null;
        terminator.with({
            terminate: () => {
                if (flashing !== null) {
                    flashing.applyState();
                    flashing = null;
                }
            }
        });
        terminator.with(this.machine.processorStepIndex.addObserver(stepIndex => {
            if (flashing !== null) {
                flashing.applyState();
            }
            flashing = this.mainKeys.byIndex(stepIndex);
            flashing.flash();
        }));
        return terminator;
    }
    playInstrument(keyIndex) {
        if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent || this.isShiftKeyPressed)
            return;
        const instrument = Utils.keyIndexToPlayInstrument(keyIndex, this.getConcurrentMainKeys());
        const channelIndex = instrument.channelIndex;
        const step = instrument.step;
        this.machine.play(channelIndex, step);
    }
    getConcurrentMainKeys() {
        return this.concurrentMainKeys;
    }
    isFunctionKeyPressed(label) {
        return this.activeFunctionLabel[label.keyIndex].nonEmpty()
            && FunctionKeyLabel.ShiftKeys.includes(label) === this.isShiftKeyPressed;
    }
    terminate() {
        this.terminator.terminate();
    }
    static mayExecOnIndexedChoice(label, choices, exec) {
        const index = choices.indexOf(label);
        if (index === -1)
            return false;
        exec(choices[index].value);
        return true;
    }
    installKeys() {
        this.functionKeys.forEach((key, keyIndex) => {
            this.terminator.with(Events.bind(key.element, 'pointerdown', (event) => {
                key.setPointerCapture(event.pointerId);
                const complete = this.onFunctionKeyPress(keyIndex);
            }));
            this.terminator.with(Events.bind(key.element, 'pointerup', () => this.onFunctionKeyRelease(keyIndex)));
        });
        this.mainKeys.forEach((key, keyIndex) => {
            this.terminator.with(Events.bind(key.element, 'pointerdown', (event) => {
                key.setPointerCapture(event.pointerId);
                const complete = this.onMainKeyPress(keyIndex);
            }));
            this.terminator.with(Events.bind(key.element, 'pointerup', () => {
                key.setPressed(false);
                this.onMainKeyRelease(keyIndex);
            }));
        });
    }
    onFunctionKeyPress(keyIndex) {
        if (this.activeFunctionLabel[keyIndex].nonEmpty())
            return true;
        const label = this.isShiftKeyPressed
            ? FunctionKeyLabel.ShiftKeys[keyIndex]
            : FunctionKeyLabel.NormalKeys[keyIndex];
        this.functionKeys.byIndex(keyIndex).setPressed(true);
        this.activeFunctionLabel[keyIndex] = Options.valueOf(label);
        return this.processFunctionKeyPress(label);
    }
    processFunctionKeyPress(label) {
        if (label === FunctionKeyLabel.Shift) {
            this.isShiftKeyPressed = true;
        }
        else if (label === FunctionKeyLabel.Tempo) {
            this.tempoProviderSubscription = this.display.push(this.tempoDisplayProvider);
        }
        return this.mode.get().onFunctionKeyPress(label);
    }
    onFunctionKeyRelease(keyIndex) {
        const label = this.activeFunctionLabel[keyIndex];
        if (label.isEmpty())
            return;
        this.functionKeys.byIndex(keyIndex).setPressed(false);
        this.processFunctionKeyRelease(this.activeFunctionLabel[keyIndex].get());
        this.activeFunctionLabel[keyIndex] = Options.None;
    }
    processFunctionKeyRelease(label) {
        if (label === FunctionKeyLabel.Shift) {
            this.isShiftKeyPressed = false;
            this.digitInput.stop();
        }
        else if (label === FunctionKeyLabel.Tempo) {
            this.tempoProviderSubscription.terminate();
            this.tempoProviderSubscription = TerminableVoid;
        }
        this.mode.get().onFunctionKeyRelease(label);
    }
    onMainKeyPress(keyIndex) {
        if (this.activeMainLabel[keyIndex].nonEmpty())
            return true;
        const label = this.isShiftKeyPressed
            ? MainKeyLabel.ShiftKeys[keyIndex]
            : MainKeyLabel.NormalKeys[keyIndex];
        this.mainKeys.byIndex(keyIndex).setPressed(true);
        this.activeMainLabel[keyIndex] = Options.valueOf(label);
        this.concurrentMainKeys.add(label.keyIndex);
        return this.processMainKeyPress(label);
    }
    processMainKeyPress(label) {
        if (label === MainKeyLabel.Save) {
            this.save().then(() => console.log('saved.'));
            return true;
        }
        else if (label === MainKeyLabel.Load) {
            setTimeout(() => {
                const binId = prompt('Enter a bin-id', '62f75f6ea1610e6386fbc5a5');
                if (binId !== null) {
                    this.load(binId).then(() => console.debug('loaded.'));
                }
            }, 100);
            return true;
        }
        if (!this.isPlaying()) {
            if (this.mode.get().allowMainKeyValueInput()) {
                if (label.isDigit()) {
                    this.digitInput.start();
                    this.digitInput.push(label.toDigit());
                    return true;
                }
                else if (label.isEnter()) {
                    const number = this.digitInput.getValue();
                    console.debug(`setMainKeyValue(${number})`);
                    this.mode.get().setMainKeyValue(number);
                    this.digitInput.stop();
                    return true;
                }
            }
        }
        return this.mode.get().onMainKeyPress(label);
    }
    onMainKeyRelease(keyIndex) {
        if (this.activeMainLabel[keyIndex].isEmpty())
            return;
        this.mainKeys.byIndex(keyIndex).setPressed(false);
        this.activeMainLabel[keyIndex] = Options.None;
        this.concurrentMainKeys.delete(keyIndex);
    }
    installKeyboard() {
        this.terminator.with(Events.bind(window, 'keydown', (event) => {
            if (!(event instanceof KeyboardEvent) || event.repeat) {
                return;
            }
            const code = event.code;
            ifDefined(MainKeyShortcuts.get(code), (keyIndex) => this.onMainKeyPress(keyIndex));
            ifDefined(FunctionKeyShortcuts.get(event.code), (keyIndex) => this.onFunctionKeyPress(keyIndex));
        }));
        this.terminator.with(Events.bind(window, 'keyup', (event) => {
            if (!(event instanceof KeyboardEvent)) {
                return;
            }
            const code = event.code;
            ifDefined(MainKeyShortcuts.get(code), (keyIndex) => this.onMainKeyRelease(keyIndex));
            ifDefined(FunctionKeyShortcuts.get(event.code), (keyIndex) => this.onFunctionKeyRelease(keyIndex));
        }));
        Array.from(MainKeyShortcuts.entries()).forEach(shortcut => {
            const key = this.mainKeys.byIndex(shortcut[1]);
            key.element.setAttribute('data-tooltip', shortcut[0]);
        });
        Array.from(FunctionKeyShortcuts.entries()).forEach(shortcut => {
            const key = this.functionKeys.byIndex(shortcut[1]);
            key.element.setAttribute('data-tooltip', shortcut[0]);
        });
    }
    installKnobs() {
        const terminator = this.terminator;
        const parentNode = this.parentNode;
        const preset = this.machine.preset;
        terminator.with(new Knob(HTML.query('[data-parameter=tempo]', parentNode), preset.tempo));
        terminator.with(new Knob(HTML.query('[data-parameter=volume]', parentNode), preset.volume));
        terminator.with(new Knob(HTML.query('[data-instrument=global] [data-parameter=accent]', parentNode), preset.accent));
        const bassdrumGroup = HTML.query('[data-instrument=bassdrum]', parentNode);
        terminator.with(new Knob(HTML.query('[data-parameter=tune]', bassdrumGroup), preset.bassdrum.tune));
        terminator.with(new Knob(HTML.query('[data-parameter=level]', bassdrumGroup), preset.bassdrum.level));
        terminator.with(new Knob(HTML.query('[data-parameter=attack]', bassdrumGroup), preset.bassdrum.attack));
        terminator.with(new Knob(HTML.query('[data-parameter=decay]', bassdrumGroup), preset.bassdrum.decay));
        const snaredrumGroup = HTML.query('[data-instrument=snaredrum]', parentNode);
        terminator.with(new Knob(HTML.query('[data-parameter=tune]', snaredrumGroup), preset.snaredrum.tune));
        terminator.with(new Knob(HTML.query('[data-parameter=level]', snaredrumGroup), preset.snaredrum.level));
        terminator.with(new Knob(HTML.query('[data-parameter=tone]', snaredrumGroup), preset.snaredrum.tone));
        terminator.with(new Knob(HTML.query('[data-parameter=snappy]', snaredrumGroup), preset.snaredrum.snappy));
        const tomLowGroup = HTML.query('[data-instrument=low-tom]', parentNode);
        terminator.with(new Knob(HTML.query('[data-parameter=tune]', tomLowGroup), preset.tomLow.tune));
        terminator.with(new Knob(HTML.query('[data-parameter=level]', tomLowGroup), preset.tomLow.level));
        terminator.with(new Knob(HTML.query('[data-parameter=decay]', tomLowGroup), preset.tomLow.decay));
        const tomMidGroup = HTML.query('[data-instrument=mid-tom]', parentNode);
        terminator.with(new Knob(HTML.query('[data-parameter=tune]', tomMidGroup), preset.tomMid.tune));
        terminator.with(new Knob(HTML.query('[data-parameter=level]', tomMidGroup), preset.tomMid.level));
        terminator.with(new Knob(HTML.query('[data-parameter=decay]', tomMidGroup), preset.tomMid.decay));
        const tomHiGroup = HTML.query('[data-instrument=hi-tom]', parentNode);
        terminator.with(new Knob(HTML.query('[data-parameter=tune]', tomHiGroup), preset.tomHi.tune));
        terminator.with(new Knob(HTML.query('[data-parameter=level]', tomHiGroup), preset.tomHi.level));
        terminator.with(new Knob(HTML.query('[data-parameter=decay]', tomHiGroup), preset.tomHi.decay));
        const rimClapGroup = HTML.query('[data-instrument=rim-clap]', parentNode);
        terminator.with(new Knob(HTML.query('[data-parameter=rim-level]', rimClapGroup), preset.rim.level));
        terminator.with(new Knob(HTML.query('[data-parameter=clap-level]', rimClapGroup), preset.clap.level));
        const hihatGroup = HTML.query('[data-instrument=hihat]', parentNode);
        terminator.with(new Knob(HTML.query('[data-parameter=level]', hihatGroup), preset.hihatLevel));
        terminator.with(new Knob(HTML.query('[data-parameter=cl-decay]', hihatGroup), preset.closedHihat.decay));
        terminator.with(new Knob(HTML.query('[data-parameter=op-decay]', hihatGroup), preset.openedHihat.decay));
        const cymbalParent = HTML.query('[data-instrument=cymbal]', parentNode);
        terminator.with(new Knob(HTML.query('[data-parameter=crash-level]', cymbalParent), preset.crash.level));
        terminator.with(new Knob(HTML.query('[data-parameter=ride-level]', cymbalParent), preset.ride.level));
        terminator.with(new Knob(HTML.query('[data-parameter=crash-tune]', cymbalParent), preset.crash.tune));
        terminator.with(new Knob(HTML.query('[data-parameter=ride-tune]', cymbalParent), preset.ride.tune));
    }
    installTransport() {
        const transport = this.machine.transport;
        this.startKey.addEventListener('pointerdown', () => {
            if (!transport.isPlaying()) {
                transport.moveTo(0.0);
                transport.play();
            }
        });
        HTML.query('button[data-control=transport-stop-continue]', this.parentNode)
            .addEventListener('pointerdown', () => transport.togglePlayback());
        window.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && !event.repeat) {
                transport.togglePlayback();
            }
        });
    }
    installAnimationFrame() {
        let blink = true;
        let frame = 0 | 0;
        let position = 0.0;
        let lastTime = Date.now();
        this.terminator.with(AnimationFrame.add(() => {
            const now = Date.now();
            const elapsedTime = (now - lastTime) / 1000.0;
            position += secondsToBars(elapsedTime, this.machine.preset.tempo.get()) * 8.0;
            lastTime = now;
            if (position >= 1.0) {
                HTML.queryAll('.blink-enabled', this.parentNode).forEach(element => element.classList.toggle('enabled', blink));
                blink = !blink;
                position -= 1.0;
            }
            const flash = frame % 4 < 2;
            HTML.queryAll('.flash-enabled', this.parentNode).forEach(element => element.classList.toggle('enabled', flash));
            frame++;
        }));
    }
}
class Finger {
    constructor(parentNode) {
        this.parentNode = parentNode;
        this.svg = SVG.createUse('#finger', 64, 64, { class: 'tap-finger' });
        this.parentNode.appendChild(this.svg);
    }
    align(key) {
        const keyRect = key.touchPoint();
        const parentRect = this.parentNode.getBoundingClientRect();
        const scale = parseFloat(this.parentNode.style.getPropertyValue("--scale"));
        this.svg.style.left = `${(keyRect.x - parentRect.left) / scale}px`;
        this.svg.style.top = `${(keyRect.y - parentRect.top) / scale}px`;
        return this;
    }
    terminate() {
        this.svg.remove();
    }
}
//# sourceMappingURL=context.js.map