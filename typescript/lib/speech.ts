import { elseIfUndefined, Observable, ObservableImpl, Observer, Option, Options, Terminable, TerminableVoid } from "./common.js"

/**
 * Since the web-speech-api does not really understand SSML (which would support breaks and markers), 
 * we have to workaround to embed events between words and actions, the user has to perform between sentences.
 * The boundary event is a great help, but if you pause the speech, it glitches and sounds broken. 
 * Hence we use speaking only between user-interactions (processes).
 * 
 * I had a version where for each word you got an event, 
 * but Safari does not send all necessary information. Bummer!
 */

class Paragraph {
    readonly events: { charIndex: number, callback: CallableFunction }[] = []

    text: string = ''

    constructor() {
    }

    appendWords(words: string): this {
        if (this.text.length === 0) {
            this.text = words
        } else if (words.startsWith(' ')) {
            this.text += words
        } else {
            this.text += ' ' + words // force space
        }
        return this
    }

    appendEvent(callback: CallableFunction): this {
        this.events.push({ charIndex: this.text.length, callback })
        return this
    }
}

export interface Process {
    start(complete: CallableFunction): Terminable
}

export interface Interaction extends Process {
    name(): string
}

export type LectureEvent =
    | { type: 'sentence', sentence: string }
    | { type: 'interaction', message: string }
    | { type: 'pause', seconds: number }
    | { type: 'update-state', speaking: boolean }

export class Lecture implements Observable<LectureEvent> {
    private readonly observable = new ObservableImpl<LectureEvent>()

    private readonly processes: Process[] = []
    private paragraph: Option<Paragraph> = Options.None

    private cancelling: boolean = false
    private running: Option<Terminable> = Options.None
    private reject: Option<CallableFunction> = Options.None
    private voice: SpeechSynthesisVoice | null = null

    constructor() {
    }

    addObserver(observer: Observer<LectureEvent>): Terminable {
        return this.observable.addObserver(observer)
    }

    appendWords(words: string): this {
        if (this.paragraph.isEmpty()) {
            this.paragraph = Options.valueOf(new Paragraph().appendWords(words))
        } else {
            this.paragraph.get().appendWords(words)
        }
        return this
    }

    appendBreak(): this {
        this.optCloseParagraph()
        return this
    }

    appendEvent(callback: CallableFunction): this {
        if (this.paragraph.isEmpty()) {
            this.paragraph = Options.valueOf(new Paragraph().appendEvent(callback))
        } else {
            this.paragraph.get().appendEvent(callback)
        }
        return this
    }

    awaitInteraction(interaction: Interaction): this {
        this.optCloseParagraph()
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

    appendPause(seconds: number): this {
        this.optCloseParagraph()
        return this.appendProcess({
            start: (complete: CallableFunction): Terminable => {
                this.observable.notify({
                    type: 'pause',
                    seconds
                })
                const id = setTimeout(complete, seconds * 1000)
                return { terminate: () => clearTimeout(id) }
            }
        })
    }

    private optCloseParagraph() {
        if (this.paragraph.nonEmpty()) {
            this.appendParagraph(this.paragraph.get())
            this.paragraph = Options.None
        }
    }

    private appendParagraph(paragraph: Paragraph): this {
        return this.appendProcess({
            start: (complete: CallableFunction): Terminable => {
                const events = paragraph.events.length > 0 ? paragraph.events.slice() : paragraph.events
                const callback = () => {
                    while (events.length > 0) {
                        // delivery remaining events
                        events.shift()!.callback()
                    }
                    complete()
                }
                const utterance = new SpeechSynthesisUtterance(paragraph.text)
                utterance.voice = this.voice
                utterance.addEventListener('boundary', (event: SpeechSynthesisEvent) => {
                    while (events.length > 0 && event.charIndex >= events[0].charIndex) { events.shift()!.callback() }
                })
                this.observable.notify({ type: 'sentence', sentence: utterance.text })
                utterance.addEventListener('end', callback)
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

    private appendProcess(process: Process): this {
        this.processes.push(process)
        return this
    }

    async start(lang = 'en-GB'): Promise<void> {
        const now = Date.now()
        while (speechSynthesis.getVoices().length === 0) {
            if (Date.now() - now > 1000) {
                throw new Error('Could not load voices.')
            }
            await new Promise(resolve => setTimeout(resolve, 20))
        }

        this.voice =
            speechSynthesis.getVoices().find(voice => voice.lang === lang) ||
            speechSynthesis.getVoices().find(voice => voice.lang === 'en-US') || null // whatever the system picks now
        console.debug(`using voice '${this.voice}'`)

        this.optCloseParagraph()
        this.running.ifPresent(() => this.cancel())

        window.onunload = () => speechSynthesis.cancel() // Chrome kept talking...

        return new Promise<void>((resolve: () => void, reject: () => void) => {
            this.reject = Options.valueOf(reject)

            const processes = this.processes.slice()
            const next = () => {
                if (processes.length > 0) {
                    this.running = Options.valueOf(processes.shift()!.start(() => {
                        if (!this.cancelling) {
                            next()
                        }
                        this.observable.notify({ type: 'update-state', speaking: speechSynthesis.speaking })
                    }))
                } else {
                    this.running = Options.None
                    this.observable.notify({ type: 'update-state', speaking: false })
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
        this.paragraph = Options.None
        this.observable.terminate()
    }
}