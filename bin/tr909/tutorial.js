var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { HTML } from '../lib/dom.js';
import { Events, ifDefined, Waiting } from './../lib/common.js';
import { FunctionKeyIndex, MainKeyIndex } from './keys.js';
import PatternWrite from './modes/pattern-write.js';
import { InstrumentMode } from './utils.js';
const speech = window.speechSynthesis;
speech.getVoices().filter(voice => voice.name);
let voice = null;
const talk = (text) => __awaiter(void 0, void 0, void 0, function* () {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    speech.speak(utterance);
    return Waiting.forEvent(utterance, 'end');
});
const waitForMode = (context, modeType) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise(resolve => {
        const subscription = context.mode.addObserver((mode) => {
            if (mode instanceof modeType) {
                subscription.terminate();
                resolve();
            }
        }, false);
    });
});
const waitForValue = (value, expected) => __awaiter(void 0, void 0, void 0, function* () {
    if (value.get() === expected) {
        return Promise.resolve();
    }
    return new Promise(resolve => {
        const subscription = value.addObserver((value) => {
            if (value === expected) {
                subscription.terminate();
                resolve();
            }
        }, false);
    });
});
const waitForTransportState = (transport, expected) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise(resolve => {
        const subscription = transport.addObserver(() => {
            if (transport.isPlaying() === expected) {
                subscription.terminate();
                resolve();
            }
        }, true);
    });
});
const next = () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const subscription = Events.bind(window, 'keydown', (event) => {
            if (event.code === 'ArrowRight') {
                subscription.terminate();
                resolve();
            }
        });
    });
});
const highlight = (element) => element.classList.add('highlight');
const resetHighlights = () => HTML.queryAll('button.highlight').forEach(element => element.classList.remove('highlight'));
export const startTutorial = (context) => __awaiter(void 0, void 0, void 0, function* () {
    context.machine.transport.stop();
    context.machine.memory.clear();
    ifDefined(speech.getVoices().find(voice => voice.voiceURI === 'Google UK English Female'), found => voice = found);
    yield talk('Welcome to the 9o9 tutorial!');
    yield talk('You can already play the iconic sounds of the 9o9 by pressing the highlighted keys.');
    context.mainKeys.forEach(key => {
        if (key.keyIndex < 16)
            highlight(key.element);
    });
    yield talk(`Continue by pressing the right arrow key!`);
    yield next();
    resetHighlights();
    yield talk('The 9o9 is currently in track-play mode.');
    highlight(context.functionKeys.byIndex(FunctionKeyIndex.Track1).element);
    yield talk(`Now... Let's program a drum-pattern!`);
    resetHighlights();
    yield talk(`Hold the shift-key and select the first pattern group`);
    highlight(context.functionKeys.byIndex(FunctionKeyIndex.Shift).element);
    highlight(context.functionKeys.byIndex(FunctionKeyIndex.PatternGroup1).element);
    yield waitForMode(context, PatternWrite);
    resetHighlights();
    yield talk('Well done! The blinking pattern key tells you, the 9o9 is in pattern-writing mode.');
    yield talk('To program the pattern, the 9o9 needs to play. Now press Start.');
    highlight(context.startKey);
    yield waitForTransportState(context.machine.transport, true);
    resetHighlights();
    yield talk(`Great! You see now which step is currently at playback time.`);
    yield talk(`Let's enter some steps. The selected instrument is currently the bassdrum...`);
    highlight(context.mainKeys.byIndex(MainKeyIndex.Step1).element);
    highlight(context.mainKeys.byIndex(MainKeyIndex.Step5).element);
    highlight(context.mainKeys.byIndex(MainKeyIndex.Step9).element);
    highlight(context.mainKeys.byIndex(MainKeyIndex.Step13).element);
    yield talk(`Now double-click step 1, 5, 9, 13 for a simple four-to-the-floor beat.`);
    yield talk(`Continue by pressing the right arrow key!`);
    yield next();
    resetHighlights();
    yield talk(`Now some funky claps. Hold the select-instrument key or 'I' on your keyboard and press the step 12 to select the hand-clap.`);
    yield waitForValue(context.instrumentMode, InstrumentMode.Clap);
    yield talk(`Now single-click step 5 and 13.`);
    highlight(context.mainKeys.byIndex(MainKeyIndex.Step5).element);
    highlight(context.mainKeys.byIndex(MainKeyIndex.Step13).element);
    yield next();
    yield talk(`Sounds about right, doesn't it? I now leave you to it. Check the manual for more 9o9 funkyness!`);
});
//# sourceMappingURL=tutorial.js.map