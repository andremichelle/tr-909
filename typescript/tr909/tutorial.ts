import { TrackIndex } from '../audio/tr909/memory.js'
import { HTML } from '../lib/dom.js'
import { Lecture } from '../lib/speech.js'
import { Transport } from './../audio/common.js'
import { Class, Events, ObservableValue, Terminable, TerminableVoid, Terminator } from './../lib/common.js'
import { Interaction } from './../lib/speech'
import { UIContext } from './context.js'
import { FunctionKeyIndex, MainKeyIndex } from './keys.js'
import { Mode, StepsEditingMode } from './mode.js'
import PatternWrite from './modes/pattern-write.js'
import { InstrumentMode } from './utils.js'

const highlight = (element: HTMLElement): void => element.classList.add('highlight')
export const resetHighlights = (): void => HTML.queryAll('button.highlight').forEach(element => element.classList.remove('highlight'))

const waitForMode = (context: UIContext, modeType: Class<Mode>): Interaction => ({
    start: (complete: CallableFunction): Terminable => {
        const subscription = context.mode.addObserver((mode: Mode) => {
            if (mode instanceof modeType) {
                subscription.terminate()
                complete()
            }
        }, false)
        return subscription

    }, name: () => 'Waiting for you.',
})
const waitForTransportState = (transport: Transport, expected: boolean): Interaction => ({
    start: (complete: CallableFunction): Terminable => {
        if (transport.isPlaying() === expected) {
            complete()
            return TerminableVoid
        }
        const subscription = transport.addObserver(() => {
            if (transport.isPlaying() === expected) {
                subscription.terminate()
                complete()
            }
        }, true)
        return subscription

    }, name: () => 'Waiting for you.',
})
const waitForValue = <T>(value: ObservableValue<T>, expected: T): Interaction => ({
    start: (complete: CallableFunction): Terminable => {
        if (value.get() === expected) {
            complete()
            return TerminableVoid
        }
        const subscription = value.addObserver((value: T) => {
            if (value === expected) {
                subscription.terminate()
                complete()
            }
        }, true)
        return subscription

    }, name: () => 'Waiting for you.',
})

export const startTutorial = (ui: UIContext, nextButton: HTMLButtonElement, context: AudioContext): Lecture => {
    ui.machine.memory.clear()
    ui.machine.transport.stop()
    ui.switchToTrackPlayMode(TrackIndex.I)
    const waitForInteraction = (): Interaction => ({
        start: (complete: CallableFunction): Terminable => {
            const terminator: Terminator = new Terminator()
            terminator.with(Events.bind(window, 'keydown', (event: KeyboardEvent) => {
                if (event.code === 'ArrowRight') {
                    terminator.terminate()
                    complete()
                }
            }))
            terminator.with(Events.bind(nextButton, 'pointerdown', () => {
                terminator.terminate()
                complete()
            }))
            nextButton.classList.remove('hidden')
            terminator.with({ terminate: () => nextButton.classList.add('hidden') })
            return terminator

        }, name: () => 'Press the right arrow key to continue',
    })
    return new Lecture()
        .appendWords(`Welcome to the 9o9 tutorial!`)
        .appendBreak()
        .appendWords(`I am a drum-machine from the early 80s.`)
        .appendBreak()
        .appendWords('You can already play my iconic sounds by pressing the')
        .appendEvent(() => {
            ui.mainKeys.forEach(key => {
                if (key.keyIndex < 16) highlight(key.element)
            })
        })
        .appendWords(`highlighted keys.`)
        .awaitInteraction(waitForInteraction())
        .appendEvent(resetHighlights)
        .appendWords(`I am currently in`)
        .appendEvent(() => highlight(ui.functionKeys.byIndex(FunctionKeyIndex.Track1).element))
        .appendWords(`track-play mode, where there is not much you can do without any data.`)
        .appendPause(1)
        .appendEvent(resetHighlights)
        .appendWords(`Now... Let's program a drum-pattern!`)
        .appendWords(`Hold the`)
        .appendEvent(() => highlight(ui.functionKeys.byIndex(FunctionKeyIndex.Shift).element))
        .appendWords(`shift-key and select the first`)
        .appendEvent(() => highlight(ui.functionKeys.byIndex(FunctionKeyIndex.PatternGroup1).element))
        .appendWords(`pattern group key`)
        .awaitInteraction(waitForMode(ui, PatternWrite))
        .appendEvent(resetHighlights)
        .appendWords(`Very good! The`)
        .appendEvent(() => highlight(ui.functionKeys.byIndex(FunctionKeyIndex.PatternGroup1).element))
        .appendWords(`blinking pattern key tells you I am in pattern-writing mode.`)
        .appendEvent(resetHighlights)
        .appendWords(`To program the pattern, I must also play! Now press`)
        .appendEvent(() => highlight(ui.startKey))
        .appendWords(`Start.`)
        .awaitInteraction(waitForTransportState(ui.machine.transport, true))
        .appendEvent(resetHighlights)
        .appendWords(`Well done! You see now which step is currently at playback time.`)
        .appendPause(2)
        .appendWords(`Let's enter some steps. The selected instrument is currently the bass-drum...`)
        .appendPause(1)
        .appendWords(`Now click step`)
        .appendEvent(() => highlight(ui.mainKeys.byIndex(MainKeyIndex.Step1).element))
        .appendWords(`1,`)
        .appendEvent(() => highlight(ui.mainKeys.byIndex(MainKeyIndex.Step5).element))
        .appendWords(`5,`)
        .appendEvent(() => highlight(ui.mainKeys.byIndex(MainKeyIndex.Step9).element))
        .appendWords(`9,`)
        .appendEvent(() => highlight(ui.mainKeys.byIndex(MainKeyIndex.Step13).element))
        .appendWords(`13 two times for a simple four-to-the-floor beat.`)
        .awaitInteraction(waitForInteraction())
        .appendEvent(resetHighlights)
        .appendWords(`Now some funky claps! Hold the`)
        .appendEvent(() => highlight(ui.functionKeys.byIndex(FunctionKeyIndex.InstrumentSelect).element))
        .appendWords(`select-instrument key or the G-Key on your computer keyboard and press the step`)
        .appendEvent(() => highlight(ui.mainKeys.byIndex(MainKeyIndex.Step12).element))
        .appendWords(`12 to select the hand-clap.`)
        .awaitInteraction(waitForValue(ui.instrumentMode, InstrumentMode.Clap))
        .appendEvent(resetHighlights)
        .appendWords(`Now click step`)
        .appendEvent(() => highlight(ui.mainKeys.byIndex(MainKeyIndex.Step5).element))
        .appendWords(`5 and`)
        .appendEvent(() => highlight(ui.mainKeys.byIndex(MainKeyIndex.Step13).element))
        .appendWords(`13!`)
        .awaitInteraction(waitForInteraction())
        .appendEvent(resetHighlights)
        .appendWords(`You can also record steps in tap-mode.`)
        .appendWords(`Hold`)
        .appendEvent(() => highlight(ui.functionKeys.byIndex(FunctionKeyIndex.Shift).element))
        .appendWords(`shift and press`)
        .appendEvent(() => highlight(ui.functionKeys.byIndex(FunctionKeyIndex.BackTap).element))
        .appendWords(`tap.`)
        .awaitInteraction(waitForValue(ui.stepsEditMode, StepsEditingMode.Tap))
        .appendEvent(resetHighlights)
        .appendWords(`Now press some keys to record drum strokes.`)
        .awaitInteraction(waitForInteraction())
        .appendWords(`Sounds about right, doesn't it?`)
        .appendWords(`I now leave you to it. Check the manual for more 9o9 funkyness!`)
        .appendWords(`Bye bye...`)
}