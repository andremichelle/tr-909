import { TrackIndex } from '../audio/tr909/memory.js'
import { HTML } from '../lib/dom.js'
import { Lecture, Sentence } from '../lib/speech.js'
import { Transport } from './../audio/common.js'
import { Class, Events, ObservableValue, Terminable, TerminableVoid, Terminator } from './../lib/common.js'
import { Interaction } from './../lib/speech'
import { UIContext } from './context.js'
import { FunctionKeyIndex, MainKeyIndex } from './keys.js'
import { Mode } from './mode.js'
import PatternWrite from './modes/pattern-write.js'
import { InstrumentMode } from './utils.js'

const highlight = (element: HTMLElement): void => element.classList.add('highlight')
const resetHighlights = (): void => HTML.queryAll('button.highlight').forEach(element => element.classList.remove('highlight'))

const waitForMode = (context: UIContext, modeType: Class<Mode>): Interaction => ({
    start: (complete: CallableFunction): Terminable => {
        const subscription = context.mode.addObserver((mode: Mode) => {
            if (mode instanceof modeType) {
                subscription.terminate()
                complete()
            }
        }, false)
        return subscription

    }, name: () => 'Press the right arrow key',
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

    }, name: () => 'Press the right arrow key',
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

    }, name: () => 'Waiting for you...',
})

export const startTutorial = (context: UIContext, nextButton: HTMLButtonElement): Lecture => {
    context.machine.memory.clear()
    context.machine.transport.stop()
    context.switchToTrackPlayMode(TrackIndex.I)
    const waitForInteraction = (): Interaction => ({
        start: (complete: CallableFunction): Terminable => {
            const terminator: Terminator = new Terminator()
            terminator.with(Events.bind(window, 'keydown', (event: KeyboardEvent) => {
                if (event.code === 'ArrowRight') {
                    terminator.terminate()
                    complete()
                }
            }))
            terminator.with(Events.bind(nextButton, 'pointerdown', (event: PointerEvent) => {
                terminator.terminate()
                complete()
            }))
            nextButton.classList.remove('hidden')
            terminator.with({ terminate: () => nextButton.classList.add('hidden') })
            return terminator

        }, name: () => 'Press the right arrow key',
    })
    return new Lecture()
        .appendWords(`Welcome to the 9o9 tutorial!`)
        .appendSentence(new Sentence()
            .appendWords('You can already play the iconic sounds of the 9o9 by pressing the')
            .appendEvent(() => {
                context.mainKeys.forEach(key => {
                    if (key.keyIndex < 16) highlight(key.element)
                })
            })
            .appendWords(`highlighted keys.`))
        .awaitInteraction(waitForInteraction())
        .appendEvent(resetHighlights)
        .appendSentence(new Sentence()
            .appendWords(`The 9o9 is currently in`)
            .appendEvent(() => highlight(context.functionKeys.byIndex(FunctionKeyIndex.Track1).element))
            .appendWords(`track-play mode.`))
        .appendPause(2)
        .appendEvent(resetHighlights)
        .appendWords(`Now... Let's program a drum-pattern!`)
        .appendSentence(new Sentence()
            .appendWords(`Hold the`)
            .appendEvent(() => highlight(context.functionKeys.byIndex(FunctionKeyIndex.Shift).element))
            .appendWords(`shift-key on your computer and select the first`)
            .appendEvent(() => highlight(context.functionKeys.byIndex(FunctionKeyIndex.PatternGroup1).element))
            .appendWords(`pattern group key`)
        )
        .awaitInteraction(waitForMode(context, PatternWrite))
        .appendEvent(resetHighlights)
        .appendSentence(new Sentence()
            .appendWords(`Very good! The`)
            .appendEvent(() => highlight(context.functionKeys.byIndex(FunctionKeyIndex.PatternGroup1).element))
            .appendWords(`blinking pattern key tells you, the 9o9 is in pattern-writing mode.`)
            .appendEvent(resetHighlights)
            .appendWords(`To program the pattern, the 9o9 must also be playing. Now press`)
            .appendEvent(() => highlight(context.startKey))
            .appendWords(`Start.`)
        )
        .awaitInteraction(waitForTransportState(context.machine.transport, true))
        .appendEvent(resetHighlights)
        .appendWords(`Well done! You see now which step is currently at playback time.`)
        .appendPause(2)
        .appendWords(`Let's enter some steps. The selected instrument is currently the bass-drum...`)
        .appendPause(1)
        .appendSentence(new Sentence()
            .appendWords(`Now double-click step`)
            .appendEvent(() => highlight(context.mainKeys.byIndex(MainKeyIndex.Step1).element))
            .appendWords(`1,`)
            .appendEvent(() => highlight(context.mainKeys.byIndex(MainKeyIndex.Step5).element))
            .appendWords(`5,`)
            .appendEvent(() => highlight(context.mainKeys.byIndex(MainKeyIndex.Step9).element))
            .appendWords(`9,`)
            .appendEvent(() => highlight(context.mainKeys.byIndex(MainKeyIndex.Step13).element))
            .appendWords(` 13 for a simple four-to-the-floor beat.`))
        .awaitInteraction(waitForInteraction())
        .appendEvent(resetHighlights)
        .appendSentence(new Sentence()
            .appendWords(`Now some funky claps! Hold the`)
            .appendEvent(() => highlight(context.functionKeys.byIndex(FunctionKeyIndex.InstrumentSelect).element))
            .appendWords(`select-instrument key or the I-Key on your computer keyboard and press the step`)
            .appendEvent(() => highlight(context.mainKeys.byIndex(MainKeyIndex.Step12).element))
            .appendWords(`12 to select the hand-clap.`)
        )
        .awaitInteraction(waitForValue(context.instrumentMode, InstrumentMode.Clap))
        .appendEvent(resetHighlights)
        .appendSentence(new Sentence()
            .appendWords(`Now single-click step`)
            .appendEvent(() => highlight(context.mainKeys.byIndex(MainKeyIndex.Step5).element))
            .appendWords(`5 and`)
            .appendEvent(() => highlight(context.mainKeys.byIndex(MainKeyIndex.Step13).element))
            .appendWords(`13!`)
        )
        .awaitInteraction(waitForInteraction())
        .appendWords(`Sounds about right, doesn't it? I now leave you to it. Check the manual for more 9o9 funkyness!`)
        .appendEvent(resetHighlights)
        .appendWords(`Bye bye...`)
}