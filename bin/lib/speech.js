var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ObservableImpl, Options, TerminableVoid } from "./common.js";
export class Sentence {
    constructor() {
        this.events = [];
        this.text = '';
        this.editable = true;
    }
    appendWords(words) {
        console.assert(this.editable);
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
        console.assert(this.editable);
        this.events.push({ charIndex: this.text.length, callback });
        return this;
    }
    createUtterance() {
        const utterance = new SpeechSynthesisUtterance(this.text);
        utterance.addEventListener('start', () => this.editable = false, { once: true });
        utterance.addEventListener('end', () => this.editable = true, { once: true });
        if (this.events.length > 0) {
            const events = this.events.slice();
            utterance.onboundary = (event) => {
                if (events.length > 0) {
                    if (event.charIndex >= events[0].charIndex) {
                        events.shift().callback();
                    }
                }
            };
        }
        return utterance;
    }
}
export class Lecture {
    constructor() {
        this.observable = new ObservableImpl();
        this.processes = [];
        this.cancelling = false;
        this.running = Options.None;
        this.reject = Options.None;
    }
    addObserver(observer) {
        return this.observable.addObserver(observer);
    }
    appendWords(words) {
        return this.appendSentence(new Sentence().appendWords(words));
    }
    appendSentence(sentence) {
        return this.appendProcess({
            start: (complete) => {
                const callback = () => complete();
                const utterance = sentence.createUtterance();
                utterance.addEventListener('end', callback);
                utterance.addEventListener('boundary', (event) => this.observable.notify({
                    type: 'sentence',
                    sentence: utterance.text,
                    charStart: event.charIndex,
                    charEnd: event.charIndex + event.charLength,
                }));
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
    appendEvent(callback) {
        return this.appendProcess({
            start: (complete) => {
                callback();
                complete();
                return TerminableVoid;
            }
        });
    }
    appendPause(seconds) {
        return this.awaitInteraction({
            start: (complete) => {
                const id = setTimeout(complete, seconds * 1000);
                return { terminate: () => clearTimeout(id) };
            },
            name: () => 'paused',
        });
    }
    awaitInteraction(interaction) {
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
    appendProcess(process) {
        this.processes.push(process);
        return this;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.running.ifPresent(() => this.cancel());
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
    }
}
//# sourceMappingURL=speech.js.map