import {Exec, isDefined, Nullable, Option, Terminable} from "@opendaw/lib-std"

type ParagraphEvent = { charIndex: number, exec: Exec }

class Paragraph {
    readonly events: Array<ParagraphEvent> = []

    text: string = ""

    appendWords(words: string): this {
        this.text = this.text.length === 0 ? words : words.startsWith(" ") ? this.text + words : `${this.text} ${words}`
        return this
    }

    appendEvent(exec: Exec): this {
        this.events.push({charIndex: this.text.length, exec})
        return this
    }
}

export interface Process {
    start(complete: Exec): Terminable
}

export class Lecture implements Terminable {
    readonly #processes: Array<Process> = []

    #paragraph: Option<Paragraph> = Option.None
    #cancelling: boolean = false
    #running: Option<Terminable> = Option.None
    #reject: Option<Exec> = Option.None
    #voice: Nullable<SpeechSynthesisVoice> = null

    appendWords(words: string): this {
        this.#currentParagraph().appendWords(words)
        return this
    }

    appendBreak(): this {
        this.#closeParagraph()
        return this
    }

    appendEvent(exec: Exec): this {
        this.#currentParagraph().appendEvent(exec)
        return this
    }

    awaitInteraction(process: Process): this {
        this.#closeParagraph()
        this.#processes.push(process)
        return this
    }

    appendPause(seconds: number): this {
        this.#closeParagraph()
        this.#processes.push({
            start: (complete: Exec): Terminable => {
                const id = setTimeout(complete, seconds * 1000)
                return Terminable.create(() => clearTimeout(id))
            }
        })
        return this
    }

    async start(lang: string = "en-GB"): Promise<void> {
        const startTime = Date.now()
        while (speechSynthesis.getVoices().length === 0) {
            if (Date.now() - startTime > 1000) {throw new Error("Could not load voices.")}
            await new Promise(resolve => setTimeout(resolve, 20))
        }
        const voices = speechSynthesis.getVoices()
        this.#voice = voices.find(voice => voice.lang === lang) ?? voices.find(voice => voice.lang === "en-US") ?? null
        this.#closeParagraph()
        this.#running.ifSome(() => this.cancel())
        window.addEventListener("pagehide", () => speechSynthesis.cancel(), {once: true})
        return new Promise<void>((resolve, reject) => {
            this.#reject = Option.wrap(reject)
            const processes = this.#processes.slice()
            const next = (): void => {
                const process = processes.shift()
                if (isDefined(process)) {
                    this.#running = Option.wrap(process.start(() => {if (!this.#cancelling) {next()}}))
                } else {
                    this.#running = Option.None
                    resolve()
                }
            }
            next()
        })
    }

    cancel(): void {
        this.#cancelling = true
        this.#running.ifSome(terminable => terminable.terminate())
        this.#running = Option.None
        this.#reject.ifSome(reject => reject())
        this.#reject = Option.None
        this.#cancelling = false
    }

    terminate(): void {
        if (this.#running.nonEmpty() || this.#reject.nonEmpty()) {this.cancel()}
        this.#paragraph = Option.None
    }

    #currentParagraph(): Paragraph {
        if (this.#paragraph.isEmpty()) {this.#paragraph = Option.wrap(new Paragraph())}
        return this.#paragraph.unwrap()
    }

    #closeParagraph(): void {
        this.#paragraph.ifSome(paragraph => this.#processes.push(this.#speak(paragraph)))
        this.#paragraph = Option.None
    }

    #speak(paragraph: Paragraph): Process {
        return {
            start: (complete: Exec): Terminable => {
                const events = paragraph.events.slice()
                const onEnd = () => {
                    events.splice(0).forEach(({exec}) => exec())
                    complete()
                }
                const utterance = new SpeechSynthesisUtterance(paragraph.text)
                utterance.voice = this.#voice
                utterance.addEventListener("boundary", (event: SpeechSynthesisEvent) => {
                    while (events.length > 0 && event.charIndex >= events[0].charIndex) {events.shift()?.exec()}
                })
                utterance.addEventListener("end", onEnd)
                speechSynthesis.speak(utterance)
                return Terminable.create(() => {
                    utterance.removeEventListener("end", onEnd)
                    speechSynthesis.cancel()
                })
            }
        }
    }
}
