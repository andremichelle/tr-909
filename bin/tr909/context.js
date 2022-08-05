import { secondsToBars } from "../audio/common.js";
import { PlayMode } from "../audio/tr909/state.js";
import { ArrayUtils, elseIfUndefined, Events, ifDefined, ObservableValueImpl, Options, TerminableVoid, Terminator } from "../lib/common.js";
import { HTML, SVG } from "../lib/dom.js";
import { Display, DisplayObservableValueProvider } from "./display.js";
import { FunctionKeyboardShortcuts, FunctionKeyIndex, FunctionKeyLabel, Key, KeyGroup, KeyState, MainKeyIndex, ZeroBasedIndices } from "./keys.js";
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
        this.displayInputNumber = new ObservableValueImpl(0);
        this.multiTapsEmulated = new Map();
        this.isUserInputting = false;
        this.tempoDisplaySubscription = TerminableVoid;
        this.userInputSubscription = TerminableVoid;
        this.display = new Display(HTML.query('svg[data-display=led-display]', parentNode));
        this.mainKeys = new KeyGroup([...Array.from(HTML.queryAll('[data-control=main-keys] [data-control=main-key]', parentNode)),
            HTML.query('[data-control=main-key][data-parameter=total-accent]')]
            .map((element, index) => new Key(element, 'main', index)));
        this.functionKeys = new KeyGroup(HTML.queryAll('[data-button=function-key]')
            .map((element, keyIndex) => new Key(element, 'function', keyIndex)));
        this.instrumentMode = new ObservableValueImpl(InstrumentMode.Bassdrum);
        this.stepsEditMode = new ObservableValueImpl(StepsEditingMode.Step);
        this.activeLabels = ArrayUtils.fill(this.functionKeys.keys.length, () => []);
        this.userInputDigits = new Uint8Array(3);
        this.tempoDisplayProvider = new DisplayObservableValueProvider(this.machine.preset.tempo);
        this.userInputDisplayProvider = new DisplayObservableValueProvider(this.displayInputNumber);
        this.terminator.with(this.displayInputNumber.addObserver((integer) => {
            this.userInputDigits[0] = Math.floor(integer / 100) % 10;
            this.userInputDigits[1] = Math.floor(integer / 10) % 10;
            this.userInputDigits[2] = integer % 10;
        }, false));
        this.mode = new TrackPlayMode(this);
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
    modeName() {
        return this.mode.name();
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
        this.mode.terminate();
        const state = this.machine.memory.state;
        state.changeNotification.mute();
        state.trackIndex.set(trackIndex);
        state.playMode.set(PlayMode.Track);
        state.changeNotification.unmute();
        state.changeNotification.notify();
        this.mode = new TrackPlayMode(this);
        console.debug(`mode: ${this.modeName()}`);
    }
    switchToTrackWriteMode(trackIndex) {
        this.resetMainKeys();
        this.mode.terminate();
        const state = this.machine.memory.state;
        state.changeNotification.mute();
        state.trackIndex.set(trackIndex);
        state.playMode.set(PlayMode.Pattern);
        state.changeNotification.unmute();
        state.changeNotification.notify();
        this.mode = new TrackWriteMode(this);
        console.debug(`mode: ${this.modeName()}`);
    }
    switchToPatternPlayMode(patternGroupIndex) {
        this.resetMainKeys();
        this.mode.terminate();
        const state = this.machine.memory.state;
        state.changeNotification.mute();
        state.patternGroupIndex.set(patternGroupIndex);
        state.playMode.set(PlayMode.Pattern);
        state.changeNotification.unmute();
        state.changeNotification.notify();
        this.mode = new PatternPlayMode(this);
        console.debug(`mode: ${this.modeName()}`);
    }
    switchToPatternWriteMode(patternGroupIndex) {
        this.resetMainKeys();
        this.mode.terminate();
        const state = this.machine.memory.state;
        state.changeNotification.mute();
        state.patternGroupIndex.set(patternGroupIndex);
        state.playMode.set(PlayMode.Pattern);
        state.changeNotification.unmute();
        state.changeNotification.notify();
        this.mode = new PatternWriteMode(this);
        console.debug(`mode: ${this.modeName()}`);
    }
    resetMainKeys() {
        this.mainKeys.deactivate();
    }
    updatePatternLocationKeys(location) {
        console.debug(`updatePatternLocationKeys(location: [${location.patternGroupIndex}, ${location.patternIndex}])`);
        this.updatePatternGroupKeys(location.patternGroupIndex, false);
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
        if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent || this.isShiftKeyPressed())
            return;
        const instrument = Utils.keyIndexToPlayInstrument(keyIndex, this.getConcurrentMainKeys());
        const channelIndex = instrument.channelIndex;
        const step = instrument.step;
        this.machine.play(channelIndex, step);
    }
    isShiftKeyPressed() {
        return this.multiTapsEmulated.has(this.functionKeys.byIndex(FunctionKeyIndex.Shift));
    }
    getConcurrentMainKeys() {
        return new Set([...this.multiTapsEmulated.keys()].filter(key => key.isMainKey()).map(key => key.keyIndex));
    }
    startUserNumberInput() {
        if (!this.isUserInputting) {
            console.debug('startUserNumberInput');
            this.isUserInputting = true;
            this.userInputDigits.fill(0);
            this.userInputSubscription = this.display.pushProvider(this.userInputDisplayProvider);
        }
    }
    stopUserNumberInput() {
        if (this.isUserInputting) {
            console.debug('stopUserNumberInput');
            this.isUserInputting = false;
            this.userInputSubscription.terminate();
            this.userInputSubscription = TerminableVoid;
        }
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
                if (event.shiftKey && !this.multiTapsEmulated.has(key)) {
                    const complete = keyIndex !== FunctionKeyIndex.Shift && this.onFunctionKeyPress(keyIndex);
                    console.debug(`onFunctionKeyPress(${keyIndex} => complete: ${complete}) [emulated]`);
                    if (!complete) {
                        this.multiTapsEmulated.set(key, Options.valueOf(new Finger(this.parentNode).align(key)));
                    }
                }
                else {
                    const complete = this.onFunctionKeyPress(keyIndex);
                    console.debug(`onFunctionKeyPress(${keyIndex} => complete: ${complete})`);
                }
            }));
            this.terminator.with(Events.bind(key.element, 'pointerup', () => {
                if (!this.multiTapsEmulated.has(key)) {
                    this.onFunctionKeyRelease(keyIndex);
                }
            }));
        });
        this.mainKeys.forEach((key, keyIndex) => {
            this.terminator.with(Events.bind(key.element, 'pointerdown', (event) => {
                key.setPointerCapture(event.pointerId);
                key.setPressed(true);
                if (this.isShiftKeyPressed() && !this.isPlaying()) {
                    if (keyIndex <= MainKeyIndex.Step10) {
                        this.startUserNumberInput();
                        this.userInputDigits[0] = this.userInputDigits[1];
                        this.userInputDigits[1] = this.userInputDigits[2];
                        this.userInputDigits[2] = (keyIndex + 1) % 10;
                        this.displayInputNumber.set(this.userInputDigits[0] * 100 +
                            this.userInputDigits[1] * 10 +
                            this.userInputDigits[2]);
                    }
                    else if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {
                        const number = this.displayInputNumber.get();
                        console.debug(`setMainKeyValue(${number})`);
                        this.mode.setMainKeyValue(number);
                        this.stopUserNumberInput();
                    }
                    else {
                        this.mode.onMainKeyShiftPress(keyIndex);
                    }
                }
                else {
                    if (event.shiftKey && !this.multiTapsEmulated.has(key) && keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
                        const consumed = this.mode.onMainKeyPress(keyIndex);
                        console.debug(`onMainKeyPress(${keyIndex} => consumed: ${consumed}) [emulated]`);
                        if (!consumed) {
                            this.multiTapsEmulated.set(key, Options.valueOf(new Finger(this.parentNode).align(key)));
                        }
                    }
                    else {
                        const consumed = this.mode.onMainKeyPress(keyIndex);
                        console.debug(`onMainKeyPress(${keyIndex} => consumed: ${consumed})`);
                    }
                }
            }));
            this.terminator.with(Events.bind(key.element, 'pointerup', () => {
                if (!this.multiTapsEmulated.has(key)) {
                    key.setPressed(false);
                }
            }));
        });
    }
    onFunctionKeyPress(keyIndex) {
        this.functionKeys.byIndex(keyIndex).setPressed(true);
        if (this.isShiftKeyPressed()) {
            this.activeLabels[keyIndex].push(FunctionKeyLabel.ShiftKeys[keyIndex]);
            return elseIfUndefined(this.mode.onFunctionKeyPress(FunctionKeyLabel.ShiftKeys[keyIndex]), true);
        }
        else {
            const label = FunctionKeyLabel.NormalKeys[keyIndex];
            this.activeLabels[keyIndex].push(label);
            if (label === FunctionKeyLabel.Tempo) {
                this.tempoDisplaySubscription = this.display.pushProvider(this.tempoDisplayProvider);
                return true;
            }
            return elseIfUndefined(this.mode.onFunctionKeyPress(label), true);
        }
    }
    onFunctionKeyRelease(keyIndex) {
        console.debug(`onFunctionKeyRelease(${FunctionKeyIndex[keyIndex]})`);
        this.functionKeys.byIndex(keyIndex).setPressed(false);
        const labels = this.activeLabels[keyIndex];
        labels.splice(0, labels.length).forEach((label) => {
            if (label === FunctionKeyLabel.Tempo) {
                this.tempoDisplaySubscription.terminate();
                this.tempoDisplaySubscription = TerminableVoid;
            }
            else {
                this.mode.onFunctionKeyRelease(label);
            }
        });
    }
    installKeyboard() {
        this.terminator.with(Events.bind(window, 'keydown', (event) => {
            if (!(event instanceof KeyboardEvent)) {
                return;
            }
            if (event.repeat) {
                return;
            }
            ifDefined(FunctionKeyboardShortcuts.get(event.code), (keyIndex) => this.onFunctionKeyPress(keyIndex));
        }));
        this.terminator.with(Events.bind(window, 'keyup', (event) => {
            if (!(event instanceof KeyboardEvent)) {
                return;
            }
            if (!event.shiftKey && this.multiTapsEmulated.size > 0) {
                this.stopUserNumberInput();
                this.multiTapsEmulated.forEach((finger, key) => {
                    finger.ifPresent(finger => finger.terminate());
                    if (key.type === 'main') {
                        this.mainKeys.byIndex(key.keyIndex).setPressed(false);
                    }
                    else if (key.type === 'function') {
                        this.onFunctionKeyRelease(key.keyIndex);
                    }
                });
                this.multiTapsEmulated.clear();
            }
            else {
                ifDefined(FunctionKeyboardShortcuts.get(event.code), (keyIndex) => this.onFunctionKeyRelease(keyIndex));
            }
        }));
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
        HTML.query('button[data-control=transport-start]', this.parentNode)
            .addEventListener('pointerdown', () => {
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
        let running = true;
        let blink = true;
        let frame = 0 | 0;
        let position = 0.0;
        let lastTime = Date.now();
        const next = () => {
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
            this.multiTapsEmulated.forEach((finger, key) => finger
                .ifPresent(finger => finger.align(key)));
            if (running) {
                requestAnimationFrame(next);
            }
        };
        requestAnimationFrame(next);
        this.terminator.with({ terminate: () => running = false });
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