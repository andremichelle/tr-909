import { Observable, ObservableImpl, Observer, Option, Options, Terminable, TerminableVoid } from "./common.js"

/**
 * Since the web-speech-api does not really understand SSML (which would support breaks and markers), 
 * we have to workaround to embed events between words and actions, the user has to perform between sentences.
 * The boundary event is a great help, but if you pause the speech, it glitches and sounds broken. 
 * Hence we can only wait for user-interactions (processes) between sentences.
 * 
 * Sentence(text: string)
 *  .appendWords(words: string): this
 *  .appendEvent(callback: () => void): this
 * 
 * Lecture
 *  .appendWords(words: string): this
 *  .appendSentence(sentence: Sentence): this
 *  .appendEvent(callback: () => void): this
 *  .appendProcess(process: Process): this
 */

export class Sentence {
    private readonly events: { charIndex: number, callback: CallableFunction }[] = []

    private text: string = ''
    private editable: boolean = true

    constructor() {
    }

    appendWords(words: string): this {
        console.assert(this.editable)
        if (this.text.length === 0) {
            this.text = words
        } else if (words.startsWith(' ')) {
            this.text += words
        } else {
            this.text += ' ' + words // force boundary
        }
        return this
    }

    appendEvent(callback: CallableFunction): this {
        console.assert(this.editable)
        this.events.push({ charIndex: this.text.length, callback })
        return this
    }

    createUtterance(): SpeechSynthesisUtterance {
        const utterance = new SpeechSynthesisUtterance(this.text)
        utterance.addEventListener('start', () => this.editable = false, { once: true })
        utterance.addEventListener('end', () => this.editable = true, { once: true })
        if (this.events.length > 0) {
            const events = this.events.slice()
            utterance.onboundary = (event: SpeechSynthesisEvent) => {
                if (events.length > 0) {
                    if (event.charIndex >= events[0].charIndex) {
                        events.shift()!.callback()
                    }
                }
            }
        }
        return utterance
    }
}

export interface Process {
    start(complete: CallableFunction): Terminable
}

export interface Interaction extends Process {
    name(): string
}

export type LectureEvent =
    | { type: 'sentence', sentence: string, charStart: number, charEnd: number }
    | { type: 'interaction', message: string }

export class Lecture implements Observable<LectureEvent> {
    private readonly observable = new ObservableImpl<LectureEvent>()

    private readonly processes: Process[] = []

    private cancelling: boolean = false
    private running: Option<Terminable> = Options.None
    private reject: Option<CallableFunction> = Options.None

    constructor() {
    }

    addObserver(observer: Observer<LectureEvent>): Terminable {
        return this.observable.addObserver(observer)
    }

    appendWords(words: string): this {
        return this.appendSentence(new Sentence().appendWords(words))
    }

    appendSentence(sentence: Sentence): this {
        return this.appendProcess({
            start: (complete: CallableFunction): Terminable => {
                const callback = () => complete()
                const utterance = sentence.createUtterance()
                // const voices = speechSynthesis.getVoices()
                // const voice = voices.find(voice => voice.lang === "en-US")
                // utterance.voice = voice === undefined ? null : voice
                utterance.addEventListener('end', callback)
                utterance.addEventListener('boundary', (event: SpeechSynthesisEvent) => this.observable.notify({
                    type: 'sentence',
                    sentence: utterance.text,
                    charStart: event.charIndex,
                    charEnd: event.charIndex + event.charLength,
                }))
                speechSynthesis.speak(utterance)
                return {
                    terminate: () => {
                        utterance.removeEventListener('end', callback)
                        speechSynthesis.cancel()
                    }
                }
            }
        })
    }

    appendEvent(callback: CallableFunction): this {
        return this.appendProcess({
            start: (complete: CallableFunction): Terminable => {
                callback()
                complete()
                return TerminableVoid
            }
        })
    }

    appendPause(seconds: number): this {
        return this.awaitInteraction({
            start: (complete: CallableFunction): Terminable => {
                const id = setTimeout(complete, seconds * 1000)
                return { terminate: () => clearTimeout(id) }
            },
            name: () => 'paused',
        })
    }

    awaitInteraction(interaction: Interaction): this {
        return this.appendProcess({
            start: (complete: CallableFunction): Terminable => {
                this.observable.notify({
                    type: 'interaction',
                    message: interaction.name()
                })
                return interaction.start(complete)
            },
        })
    }

    private appendProcess(process: Process): this {
        this.processes.push(process)
        return this
    }

    async start(): Promise<void> {
        this.running.ifPresent(() => this.cancel())

        return new Promise<void>((resolve: () => void, reject: () => void) => {
            this.reject = Options.valueOf(reject)

            const processes = this.processes.slice()
            const next = () => {
                if (processes.length > 0) {
                    this.running = Options.valueOf(processes.shift()!.start(() => {
                        if (!this.cancelling) {
                            next()
                        }
                    }))
                } else {
                    this.running = Options.None
                    resolve()
                }
            }
            next()
        })
    }

    cancel(): void {
        this.cancelling = true

        this.running.ifPresent(terminable => terminable.terminate())
        this.running = Options.None
        this.reject.ifPresent(reject => reject())
        this.reject = Options.None
        this.cancelling = false
    }

    terminate(): void {
        if (this.running.nonEmpty() || this.reject.nonEmpty()) this.cancel()
    }
}