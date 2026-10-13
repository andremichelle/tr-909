import {Exec, Notifier, ObservableValue, Terminable, Terminator} from "@opendaw/lib-std"
import {Events} from "@opendaw/lib-dom"
import {TrackIndex} from "@/audio/memory"
import {Transport} from "@/audio/transport"
import {Lecture, Process} from "@/lib/speech"
import type {UIContext} from "./context"
import {InstrumentMode} from "./instrument"
import {FunctionKeyIndex, MainKeyIndex, StepsEditingMode} from "./keys"
import {Mode} from "./mode"
import {PatternWriteMode} from "./modes/pattern-write"

const waitFor = <T>(value: ObservableValue<T>, predicate: (value: T) => boolean): Process => ({
    start: (complete: Exec): Terminable => {
        if (predicate(value.getValue())) {
            complete()
            return Terminable.Empty
        }
        const subscription = value.subscribe(owner => {
            if (predicate(owner.getValue())) {
                subscription.terminate()
                complete()
            }
        })
        return subscription
    }
})

const waitForTransportState = (transport: Transport, expected: boolean): Process => ({
    start: (complete: Exec): Terminable => {
        if (transport.isPlaying() === expected) {
            complete()
            return Terminable.Empty
        }
        const subscription = transport.subscribe(() => {
            if (transport.isPlaying() === expected) {
                subscription.terminate()
                complete()
            }
        })
        return subscription
    }
})

export type TutorialAdvance = {
    readonly visible: (visible: boolean) => void
    readonly requests: Notifier<void>
}

export const createTutorial = (ui: UIContext, advance: TutorialAdvance): Lecture => {
    ui.machine.memory.clear()
    ui.machine.transport.stop()
    ui.switchToTrackPlayMode(TrackIndex.I)
    const highlightMain = (...indices: Array<MainKeyIndex>) => () =>
        indices.forEach(index => ui.mainKeys.byIndex(index).setHighlighted(true))
    const highlightFunction = (index: FunctionKeyIndex) => () => ui.functionKeys.byIndex(index).setHighlighted(true)
    const resetHighlights = () => ui.resetHighlights()
    const waitForInteraction = (): Process => ({
        start: (complete: Exec): Terminable => {
            const terminator = new Terminator()
            const done = () => {
                terminator.terminate()
                complete()
            }
            terminator.own(Events.subscribe(window, "keydown", (event: KeyboardEvent) => {
                if (event.code === "ArrowRight") {done()}
            }))
            terminator.own(advance.requests.subscribe(done))
            advance.visible(true)
            terminator.own(Terminable.create(() => advance.visible(false)))
            return terminator
        }
    })
    return new Lecture()
        .appendWords("Welcome to the 9o9 tutorial!")
        .appendBreak()
        .appendWords("I am a drum-machine from the early 80s.")
        .appendBreak()
        .appendWords("You can already play my iconic sounds by pressing the")
        .appendEvent(() => ui.mainKeys.forEach((key, index) => key.setHighlighted(index < 16)))
        .appendWords("highlighted keys.")
        .awaitInteraction(waitForInteraction())
        .appendEvent(resetHighlights)
        .appendWords("I am currently in")
        .appendEvent(highlightFunction(FunctionKeyIndex.Track1))
        .appendWords("track-play mode, where there is not much you can do without any data.")
        .appendPause(1)
        .appendEvent(resetHighlights)
        .appendWords("Now... Let's program a drum-pattern!")
        .appendWords("Hold the")
        .appendEvent(highlightFunction(FunctionKeyIndex.Shift))
        .appendWords("shift-key and select the first")
        .appendEvent(highlightFunction(FunctionKeyIndex.PatternGroup1))
        .appendWords("pattern group key")
        .awaitInteraction(waitFor<Mode>(ui.mode, mode => mode instanceof PatternWriteMode))
        .appendEvent(resetHighlights)
        .appendWords("Very good! The")
        .appendEvent(highlightFunction(FunctionKeyIndex.PatternGroup1))
        .appendWords("blinking pattern key tells you I am in pattern-writing mode.")
        .appendEvent(resetHighlights)
        .appendWords("To program the pattern, I must also play! Now press")
        .appendEvent(() => ui.startKeyHighlighted.setValue(true))
        .appendWords("Start.")
        .awaitInteraction(waitForTransportState(ui.machine.transport, true))
        .appendEvent(resetHighlights)
        .appendWords("Well done! You see now which step is currently at playback time.")
        .appendPause(2)
        .appendWords("Let's enter some steps. The selected instrument is currently the bass-drum...")
        .appendPause(1)
        .appendWords("Now click step")
        .appendEvent(highlightMain(MainKeyIndex.Step1))
        .appendWords("1,")
        .appendEvent(highlightMain(MainKeyIndex.Step5))
        .appendWords("5,")
        .appendEvent(highlightMain(MainKeyIndex.Step9))
        .appendWords("9,")
        .appendEvent(highlightMain(MainKeyIndex.Step13))
        .appendWords("13 two times for a simple four-to-the-floor beat.")
        .awaitInteraction(waitForInteraction())
        .appendEvent(resetHighlights)
        .appendWords("Now some funky claps! Hold the")
        .appendEvent(highlightFunction(FunctionKeyIndex.InstrumentSelect))
        .appendWords("select-instrument key or the G-Key on your computer keyboard and press the step")
        .appendEvent(highlightMain(MainKeyIndex.Step12))
        .appendWords("12 to select the hand-clap.")
        .awaitInteraction(waitFor(ui.instrumentMode, mode => mode === InstrumentMode.Clap))
        .appendEvent(resetHighlights)
        .appendWords("Now click step")
        .appendEvent(highlightMain(MainKeyIndex.Step5))
        .appendWords("5 and")
        .appendEvent(highlightMain(MainKeyIndex.Step13))
        .appendWords("13!")
        .awaitInteraction(waitForInteraction())
        .appendEvent(resetHighlights)
        .appendWords("You can also record steps in tap-mode.")
        .appendWords("Hold")
        .appendEvent(highlightFunction(FunctionKeyIndex.Shift))
        .appendWords("shift and press")
        .appendEvent(highlightFunction(FunctionKeyIndex.BackTap))
        .appendWords("tap.")
        .awaitInteraction(waitFor(ui.stepsEditMode, mode => mode === StepsEditingMode.Tap))
        .appendEvent(resetHighlights)
        .appendWords("Now press some keys to record drum strokes.")
        .awaitInteraction(waitForInteraction())
        .appendWords("Sounds about right, doesn't it?")
        .appendWords("I now leave you to it. Check the manual for more 9o9 funkyness!")
        .appendWords("Bye bye...")
}
