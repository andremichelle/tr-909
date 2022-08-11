import { HTML } from '../lib/dom.js'
import { Transport } from './../audio/common.js'
import { Class, Events, ifDefined, ObservableValue, Waiting } from './../lib/common.js'
import { UIContext } from './context.js'
import { FunctionKeyIndex, MainKeyIndex } from './keys.js'
import { Mode } from './mode.js'
import PatternWrite from './modes/pattern-write.js'
import { InstrumentMode } from './utils.js'

const speech = window.speechSynthesis
speech.getVoices().filter(voice => voice.name)

let voice: SpeechSynthesisVoice | null = null

const talk = async (text: string): Promise<void> => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = voice
    speech.speak(utterance)
    return Waiting.forEvent(utterance, 'end')
}

const waitForMode = async (context: UIContext, modeType: Class<Mode>): Promise<void> => {
    return new Promise<void>(resolve => {
        const subscription = context.mode.addObserver((mode: Mode) => {
            if (mode instanceof modeType) {
                subscription.terminate()
                resolve()
            }
        }, false)
    })
}

const waitForValue = async <T>(value: ObservableValue<T>, expected: T): Promise<void> => {
    if (value.get() === expected) {
        return Promise.resolve()
    }
    return new Promise<void>(resolve => {
        const subscription = value.addObserver((value: T) => {
            if (value === expected) {
                subscription.terminate()
                resolve()
            }
        }, false)
    })
}

const waitForTransportState = async (transport: Transport, expected: boolean): Promise<void> => {
    return new Promise<void>(resolve => {
        const subscription = transport.addObserver(() => {
            if (transport.isPlaying() === expected) {
                subscription.terminate()
                resolve()
            }
        }, true)
    })
}

const next = async (): Promise<void> => {
    return new Promise<void>((resolve) => {
        const subscription = Events.bind(window, 'keydown', (event: KeyboardEvent) => {
            if (event.code === 'ArrowRight') {
                subscription.terminate()
                resolve()
            }
        })
    })
}

const highlight = (element: HTMLElement): void => element.classList.add('highlight')
const resetHighlights = (): void => HTML.queryAll('button.highlight').forEach(element => element.classList.remove('highlight'))

export const startTutorial = async (context: UIContext) => {
    context.machine.transport.stop()
    context.machine.memory.clear()
    ifDefined(speech.getVoices().find(voice => voice.voiceURI === 'Google UK English Female'), found => voice = found)
    await talk('Welcome to the 9o9 tutorial!')
    await talk('You can already play the iconic sounds of the 9o9 by pressing the highlighted keys.')
    context.mainKeys.forEach(key => {
        if (key.keyIndex < 16) highlight(key.element)
    })
    await talk(`Continue by pressing the right arrow key!`)
    await next()
    resetHighlights()
    await talk('The 9o9 is currently in track-play mode.')
    highlight(context.functionKeys.byIndex(FunctionKeyIndex.Track1).element)
    await talk(`Now... Let's program a drum-pattern!`)
    resetHighlights()
    await talk(`Hold the shift-key and select the first pattern group`)
    highlight(context.functionKeys.byIndex(FunctionKeyIndex.Shift).element)
    highlight(context.functionKeys.byIndex(FunctionKeyIndex.PatternGroup1).element)
    await waitForMode(context, PatternWrite)
    resetHighlights()
    await talk('Well done! The blinking pattern key tells you, the 9o9 is in pattern-writing mode.')
    await talk('To program the pattern, the 9o9 needs to play. Now press Start.')
    highlight(context.startKey)
    await waitForTransportState(context.machine.transport, true)
    resetHighlights()
    await talk(`Great! You see now which step is currently at playback time.`)
    await talk(`Let's enter some steps. The selected instrument is currently the bassdrum...`)
    highlight(context.mainKeys.byIndex(MainKeyIndex.Step1).element)
    highlight(context.mainKeys.byIndex(MainKeyIndex.Step5).element)
    highlight(context.mainKeys.byIndex(MainKeyIndex.Step9).element)
    highlight(context.mainKeys.byIndex(MainKeyIndex.Step13).element)
    await talk(`Now double-click step 1, 5, 9, 13 for a simple four-to-the-floor beat.`)
    await talk(`Continue by pressing the right arrow key!`)
    await next()
    resetHighlights()
    await talk(`Now some funky claps. Hold the select-instrument key or 'I' on your keyboard and press the step 12 to select the hand-clap.`)
    await waitForValue(context.instrumentMode, InstrumentMode.Clap)
    await talk(`Now single-click step 5 and 13.`)
    highlight(context.mainKeys.byIndex(MainKeyIndex.Step5).element)
    highlight(context.mainKeys.byIndex(MainKeyIndex.Step13).element)
    await next()
    await talk(`Sounds about right, doesn't it? I now leave you to it. Check the manual for more 9o9 funkyness!`)
}