var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { elseIfUndefined, ObservableImpl, Options } from "./common.js";
class Paragraph {
    constructor() {
        this.events = [];
        this.text = '';
    }
    appendWords(words) {
        if (this.text.length === 0) {
            this.text = words;
        }
        else if (words.startsWith(' ')) {
            this.text += words;
        }
        else {
            this.text += ' ' + words;
        }
        return this;
    }
    appendEvent(callback) {
        this.events.push({ charIndex: this.text.length, callback });
        return this;
    }
}
export class Lecture {
    constructor() {
        this.observable = new ObservableImpl();
        this.processes = [];
        this.paragraph = Options.None;
        this.cancelling = false;
        this.running = Options.None;
        this.reject = Options.None;
        this.voice = null;
    }
    addObserver(observer) {
        return this.observable.addObserver(observer);
    }
    appendWords(words) {
        console.debug(`appendWords(${words})`);
        if (this.paragraph.isEmpty()) {
            this.paragraph = Options.valueOf(new Paragraph().appendWords(words));
        }
        else {
            this.paragraph.get().appendWords(words);
        }
        return this;
    }
    appendEvent(callback) {
        console.debug(`appendEvent()`);
        if (this.paragraph.isEmpty()) {
            this.paragraph = Options.valueOf(new Paragraph().appendEvent(callback));
        }
        else {
            this.paragraph.get().appendEvent(callback);
        }
        return this;
    }
    awaitInteraction(interaction) {
        console.debug(`awaitInteraction()`);
        this.optCloseParagraph();
        return this.appendProcess({
            start: (complete) => {
                this.observable.notify({
                    type: 'interaction',
                    message: interaction.name()
                });
                return interaction.start(complete);
            },
        });
    }
    appendPause(seconds) {
        console.debug(`appendPause()`);
        this.optCloseParagraph();
        return this.appendProcess({
            start: (complete) => {
                this.observable.notify({
                    type: 'pause',
                    seconds
                });
                const id = setTimeout(complete, seconds * 1000);
                return { terminate: () => clearTimeout(id) };
            }
        });
    }
    optCloseParagraph() {
        console.debug(`optCloseParagraph`);
        if (this.paragraph.nonEmpty()) {
            this.appendParagraph(this.paragraph.get());
            this.paragraph = Options.None;
        }
    }
    appendParagraph(paragraph) {
        return this.appendProcess({
            start: (complete) => {
                const events = paragraph.events.length > 0 ? paragraph.events.slice() : paragraph.events;
                const callback = () => {
                    speechSynthesis.cancel();
                    while (events.length > 0) {
                        events.shift().callback();
                    }
                    complete();
                };
                const utterance = new SpeechSynthesisUtterance(paragraph.text);
                utterance.voice = this.voice;
                utterance.addEventListener('boundary', (event) => {
                    this.observable.notify({
                        type: 'sentence',
                        sentence: utterance.text,
                        charStart: event.charIndex,
                        charEnd: event.charIndex + event.charLength,
                    });
                    while (events.length > 0 && event.charIndex >= events[0].charIndex) {
                        events.shift().callback();
                    }
                });
                utterance.addEventListener('end', callback);
                speechSynthesis.speak(utterance);
                return {
                    terminate: () => {
                        utterance.removeEventListener('end', callback);
                        speechSynthesis.cancel();
                    }
                };
            }
        });
    }
    appendProcess(process) {
        this.processes.push(process);
        return this;
    }
    start() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            while (speechSynthesis.getVoices().length === 0) {
                if (Date.now() - now > 1000) {
                    throw new Error('Could not load voices.');
                }
                yield new Promise(resolve => setTimeout(resolve, 20));
            }
            this.voice = elseIfUndefined(speechSynthesis.getVoices().find(voice => voice.default), null);
            console.debug(`using voice '${(_a = this.voice) === null || _a === void 0 ? void 0 : _a.name}'`);
            this.optCloseParagraph();
            this.running.ifPresent(() => this.cancel());
            window.onunload = () => speechSynthesis.cancel();
            return new Promise((resolve, reject) => {
                this.reject = Options.valueOf(reject);
                const processes = this.processes.slice();
                const next = () => {
                    if (processes.length > 0) {
                        this.running = Options.valueOf(processes.shift().start(() => {
                            if (!this.cancelling) {
                                next();
                            }
                        }));
                    }
                    else {
                        this.running = Options.None;
                        resolve();
                    }
                };
                next();
            });
        });
    }
    cancel() {
        this.cancelling = true;
        this.running.ifPresent(terminable => terminable.terminate());
        this.running = Options.None;
        this.reject.ifPresent(reject => reject());
        this.reject = Options.None;
        this.cancelling = false;
    }
    terminate() {
        if (this.running.nonEmpty() || this.reject.nonEmpty())
            this.cancel();
        this.paragraph = Options.None;
    }
}
//# sourceMappingURL=speech.js.map