import { LimiterWorklet } from "./audio/limiter/worklet.js"
import { MeterWorklet } from "./audio/meter/worklet.js"
import { Machine } from "./audio/tr909/machine.js"
import { loadResources } from "./audio/tr909/resources.js"
import { Boot, newAudioContext, preloadImagesOfCssFile } from "./lib/boot.js"
import { Events, Waiting } from "./lib/common.js"
import { AnimationFrame, HTML } from "./lib/dom.js"
import { JsonBin } from "./lib/jsonbin.js"
import { Format, UIContext } from "./tr909/context.js"
import { startTutorial } from './tr909/tutorial.js'

const showProgress = (() => {
    const progress: SVGSVGElement = document.querySelector("svg.preloader")!
    window.onunhandledrejection = window.onerror = (reason: any) => {
        alert(`An error occurred during booting. Please try Chrome or Safari. [${reason.toString()}]`)
        progress.classList.add("error")
    }
    return (percentage: number) => progress.style.setProperty("--percentage", percentage.toFixed(2))
})();

(async () => {
    console.debug("booting...")

    // --- BOOT STARTS ---
    const context = newAudioContext()
    console.debug(`sampleRate: ${context.sampleRate}Hz`)
    const boot = new Boot()
    boot.addObserver(boot => showProgress(boot.normalizedPercentage()))
    boot.registerProcess(preloadImagesOfCssFile("./bin/main.css"))
    boot.registerProcess(LimiterWorklet.loadModule(context))
    boot.registerProcess(MeterWorklet.loadModule(context))
    boot.registerProcess(Machine.loadModule(context))
    const getResources = loadResources(boot)
    await boot.waitForCompletion()
    // --- BOOT ENDS ---

    const main: HTMLElement = HTML.query('main')
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
        style.height = `${window.innerHeight}px`
        style.width = `${window.innerWidth}px`
        const scale = Math.min(wrapper.clientWidth / size.width, wrapper.clientHeight / size.height)
        parentNode.style.setProperty("--scale", `${scale}`)
    }
    window.addEventListener("resize", resize)
    resize()
    const body: HTMLBodyElement = HTML.query("body")
    HTML.queryAll("svg.preloader", body).forEach(element => element.remove())
    await Waiting.forFrames(20)
    HTML.queryAll("main", body).forEach(element => element.classList.remove("invisible"))
    console.debug("boot complete.")

    const machine = new Machine(context, getResources())
    const ui: UIContext = new UIContext(machine, parentNode)
    machine.master.connect(context.destination)

    if (format !== null) {
        ui.deserialize(format)
    }

    // TODO > Test Data < REMOVE WHEN DONE TESTING
    if (location.hostname.includes('localhost') || location.hostname.includes('127.0.0.1')) {
        if (false) {
            console.log("INSTALLED TEST DATA")
            const memory = machine.memory
            const memoryBank = memory.banks[0]
            memoryBank.patternByIndices(0, 0).testA()
            memoryBank.patternByIndices(0, 1).testB()
            memoryBank.patternByIndices(0, 2).testC()
            memoryBank.patternByIndices(0, 3).testD()
            /*const chained = new Array(15).fill(false)
            chained[0] = true
            chained[1] = true
            chained[2] = true
     
            chained[4] = true
            chained[5] = true
            chained[6] = true
            memoryBank.patternGroups[0].writeChain(chained)*/
            const track = memoryBank.tracks[1]
            track.writeLocation({ patternGroupIndex: 0, patternIndex: 0 })
            track.writeLocation({ patternGroupIndex: 0, patternIndex: 1 })
            track.writeLocation({ patternGroupIndex: 0, patternIndex: 0 })
            track.writeLocation({ patternGroupIndex: 0, patternIndex: 1 })
        }
    }
    AnimationFrame.init()

    const tutorialButton = HTML.query('a[target=tutorial]') as HTMLElement
    const subscription = Events.bind(tutorialButton, 'click', (event: Event) => {
        event.preventDefault()
        if (!confirm('This tutorial cannot be stopped. Continue?')) return
        subscription.terminate()
        tutorialButton.style.opacity = "0.3"
        startTutorial(ui)
    })
})()