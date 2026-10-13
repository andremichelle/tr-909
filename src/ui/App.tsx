import css from "./App.sass?inline"
import {DefaultObservableValue, Lifecycle, Notifier, Option} from "@opendaw/lib-std"
import {Events, Html} from "@opendaw/lib-dom"
import {createElement} from "@opendaw/lib-jsx"
import {UIContext} from "@/control/context"
import {createTutorial} from "@/control/tutorial"
import {Lecture} from "@/lib/speech"
import {Hero} from "./Hero"
import {TR909} from "./TR909"
import {WorkingOverlay} from "./WorkingOverlay"

const className = Html.adoptStyleSheet(css, "App")

const ManualUrl = "https://github.com/andremichelle/tr-909/wiki/Manual"
const SurfaceSize = {width: 1226 + 64, height: 728}

type Construct = {
    lifecycle: Lifecycle
    ui: UIContext
}

export const App = ({lifecycle, ui}: Construct) => {
    const context = ui.machine.context
    const tutorialAdvanceVisible = new DefaultObservableValue<boolean>(false)
    const tutorialAdvanceRequests = new Notifier<void>()
    const surface: HTMLElement = (
        <TR909 lifecycle={lifecycle} ui={ui}
               tutorialAdvanceVisible={tutorialAdvanceVisible}
               onTutorialAdvance={() => tutorialAdvanceRequests.notify()}/>
    )
    const wrapper: HTMLDivElement = <div className="wrapper">{surface}</div>
    const tutorialLink: HTMLAnchorElement = <a href="#">Tutorial</a>
    let lecture: Option<Lecture> = Option.None
    // iOS Safari suspends the AudioContext while speaking
    const keepRunning = () => {if (context.state !== "running") {context.resume().then()}}
    const startTutorial = () => {
        const instance = createTutorial(ui, {
            visible: visible => tutorialAdvanceVisible.setValue(visible),
            requests: tutorialAdvanceRequests
        })
        lecture = Option.wrap(instance)
        tutorialLink.classList.add("active")
        context.addEventListener("statechange", keepRunning)
        instance.start().catch(() => null).then(() => {
            context.removeEventListener("statechange", keepRunning)
            tutorialLink.classList.remove("active")
            ui.resetHighlights()
            instance.terminate()
            lecture = Option.None
        })
    }
    lifecycle.ownAll(
        tutorialAdvanceVisible,
        tutorialAdvanceRequests,
        Html.watchResize(wrapper, () => {
            const scale = Math.min(wrapper.clientWidth / SurfaceSize.width, wrapper.clientHeight / SurfaceSize.height)
            surface.style.setProperty("--scale", `${scale}`)
        }),
        Events.subscribe(tutorialLink, "click", (event: Event) => {
            event.preventDefault()
            lecture.match({none: startTutorial, some: running => running.terminate()})
        })
    )
    return (
        <main className={className}>
            <div/>
            {wrapper}
            <footer>
                <a href={ManualUrl} target="manual" className="new-window">Manual</a>
                <a href="./keyboard.html" target="keyboard" className="new-window">Keyboard</a>
                {tutorialLink}
            </footer>
            <Hero manualUrl={ManualUrl}/>
            <WorkingOverlay lifecycle={lifecycle} working={ui.working}/>
        </main>
    )
}
