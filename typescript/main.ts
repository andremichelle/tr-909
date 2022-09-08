import { LimiterWorklet } from "./audio/limiter/worklet.js"
import { MeterWorklet } from "./audio/meter/worklet.js"
import { Machine } from "./audio/tr909/machine.js"
import { loadResources } from "./audio/tr909/resources.js"
import { Boot, newAudioContext, preloadImagesOfCssFile } from "./lib/boot.js"
import { Events, Option, Options, Waiting } from "./lib/common.js"
import { AnimationFrame, HTML } from "./lib/dom.js"
import { JsonBin } from "./lib/jsonbin.js"
import { Lecture } from "./lib/speech.js"
import { Format, UIContext } from "./tr909/context.js"
import { resetHighlights, startTutorial as createLecture } from './tr909/tutorial.js'

(async () => {
    console.debug("booting...")

    const onBootError = () => alert(new Error('Failed to boot. Please use Chrome or Safari.')) // likely firefox

    // --- BOOT STARTS ---
    window.addEventListener('error', onBootError)
    window.addEventListener('unhandledrejection', onBootError)
    const context = newAudioContext()
    const boot = new Boot()
    boot.await('css', preloadImagesOfCssFile("./bin/main.css"))
    boot.await('limiter', LimiterWorklet.loadModule(context))
    boot.await('meter', MeterWorklet.loadModule(context))
    boot.await('machine', Machine.loadModule(context))
    const getResources = loadResources(boot)
    await Waiting.forFrames(12)
    await boot.awaitCompletion()
    window.removeEventListener('error', onBootError)
    window.removeEventListener('unhandledrejection', onBootError)
    // --- BOOT ENDS ---

    const parentNode: HTMLElement = HTML.query('div.tr-909')
    const wrapper: HTMLElement = HTML.query('div.wrapper')

    let format: Format | null = null
    if (location.hash !== "") {
        try {
            format = (await JsonBin.load<Format>(location.hash.substring(1))).record
        } catch (reason) {
            console.warn(reason)
        }
    }

    // prevent dragging entire document on mobile
    document.addEventListener('touchmove', (event: TouchEvent) => event.preventDefault(), { passive: false })
    document.addEventListener('dblclick', (event: Event) => event.preventDefault(), { passive: false })
    document.addEventListener('contextmenu', event => event.preventDefault())
    const size = { width: 1226 + 64 /* Padding */, height: 728 }
    const resize = () => {
        const style = document.body.style
        style.minWidth = `${window.innerWidth}px`
        style.minHeight = `${window.innerHeight}px`
        const scale = Math.min(wrapper.clientWidth / size.width, wrapper.clientHeight / size.height)
        parentNode.style.setProperty("--scale", `${scale}`)
    }
    window.addEventListener("resize", resize)
    resize()
    const body: HTMLBodyElement = HTML.query("body")
    HTML.queryAll("svg.preloader", body).forEach(element => element.remove())
    await Waiting.forFrames(20)
    HTML.queryAll("main", body).forEach(element => element.classList.remove("invisible"))

    const machine = new Machine(context, getResources())
    const ui: UIContext = new UIContext(machine, parentNode)
    machine.master.connect(context.destination)

    if (format !== null) {
        ui.deserialize(format)
    }

    AnimationFrame.init()

    let lecturing: Option<Lecture> = Options.None
    const tutorialButton = HTML.query('a[target=tutorial]') as HTMLElement
    const onAudioContextStateChange = () => { // For IOS Safari: AudioContext suspends for speaking.
        if (context.state !== 'running') {
            context.resume().then(() => console.debug('resume'))
        }
    }
    Events.bind(tutorialButton, 'click', (event: Event) => {
        event.preventDefault()
        if (lecturing.isEmpty()) {
            const lecture = createLecture(ui, HTML.query('[data-action=tutorial-advance-button]'), context)
            lecturing = Options.valueOf(lecture)
            tutorialButton.classList.add('active')
            context.addEventListener('statechange', onAudioContextStateChange)
            lecture.start().catch(() => null).then(() => {
                context.removeEventListener('statechange', onAudioContextStateChange)
                tutorialButton.classList.remove('active')
                resetHighlights()
                lecture.terminate()
                lecturing = Options.None
            })
        } else {
            lecturing.get().terminate()
            lecturing = Options.None
        }
    })
})()