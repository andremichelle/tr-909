import "./style.sass"
import {Option, Terminator} from "@opendaw/lib-std"
import {AnimationFrame, Events} from "@opendaw/lib-dom"
import {createElement, replaceChildren} from "@opendaw/lib-jsx"
import {Machine} from "@/audio/machine"
import {Resources} from "@/audio/resources"
import {Format, UIContext} from "@/control/context"
import {JsonBin} from "@/lib/jsonbin"
import {App} from "@/ui/App"

const resumeOnGesture = (context: AudioContext): void => {
    if (context.state === "running") {return}
    const options = {capture: true}
    const resume = () => context.resume().then(() => {
        if (context.state !== "running") {return}
        window.removeEventListener("pointerdown", resume, options)
        window.removeEventListener("keydown", resume, options)
    }, () => null)
    window.addEventListener("pointerdown", resume, options)
    window.addEventListener("keydown", resume, options)
}

(async () => {
    console.debug("booting...")
    const context = new AudioContext({sampleRate: 44100, latencyHint: "interactive"})
    resumeOnGesture(context)
    const [machine, format] = await Promise.all([
        Resources.fetchAll().then(resources => Machine.create(context, resources)),
        location.hash === ""
            ? Promise.resolve(Option.None)
            : JsonBin.load<Format>(location.hash.substring(1)).then(result => result.map(response => response.record))
    ])
    const lifecycle = new Terminator()
    const ui = lifecycle.own(new UIContext(machine))
    machine.master.connect(context.destination)
    format.ifSome(value => ui.deserialize(value))
    AnimationFrame.start(window)
    lifecycle.ownAll(
        ui.bindKeyboard(window),
        Events.subscribe(document, "touchmove", event => event.preventDefault(), {passive: false}),
        Events.subscribe(document, "dblclick", event => event.preventDefault(), {passive: false}),
        Events.subscribe(document, "contextmenu", event => event.preventDefault()),
        Events.subscribe(window, "error", () => ui.display.showError()),
        Events.subscribe(window, "unhandledrejection", () => ui.display.showError())
    )
    replaceChildren(document.body, <App lifecycle={lifecycle} ui={ui}/>)
})().catch(reason => {
    console.error(reason)
    alert("Failed to boot. Please use a recent Chrome, Safari or Firefox.")
})
