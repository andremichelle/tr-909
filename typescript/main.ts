import {LimiterWorklet} from "./audio/limiter/worklet.js"
import {MeterWorklet, StereoMeterWorklet} from "./audio/meter/worklet.js"
import {Machine} from "./audio/tr909/machine.js"
import {loadResources} from "./audio/tr909/resources.js"
import {Boot, newAudioContext, preloadImagesOfCssFile} from "./lib/boot.js"
import {Waiting} from "./lib/common.js"
import {HTML} from "./lib/dom.js"
import {UIContext} from "./tr909/context.js"

const showProgress = (() => {
        const progress: SVGSVGElement = document.querySelector("svg.preloader")
        window.onerror = () => progress.classList.add("error")
        window.onunhandledrejection = () => progress.classList.add("error")
        return (percentage: number) => progress.style.setProperty("--percentage", percentage.toFixed(2))
    })()

;(async () => {
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
    const debugZoom = HTML.query('[data-output=zoom]')
    const debugMode = HTML.query('[data-output=mode]')
    const debugTransporting = HTML.query('[data-output=transporting]')
    const debugInstrument = HTML.query('[data-output=instrument]')
    const debugNumberOfKeys = HTML.query('[data-output=number-of-keys]')

    // prevent dragging entire document on mobile
    document.addEventListener('touchmove', (event: TouchEvent) => event.preventDefault(), {passive: false})
    document.addEventListener('dblclick', (event: Event) => event.preventDefault(), {passive: false})
    document.addEventListener('contextmenu', event => event.preventDefault())
    const resize = () => {
        document.body.style.height = `${window.innerHeight}px`
        const padding = 96
        let scale = Math.min(
            window.innerWidth / (parentNode.clientWidth + padding),
            window.innerHeight / (parentNode.clientHeight + padding))
        if (scale > 1.0) {
            scale = 1.0
        }
        debugZoom.textContent = `${Math.round(scale * 100)}%`
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
    const interfaceContext: UIContext = new UIContext(machine, parentNode)

    const meter = new StereoMeterWorklet(context)
    machine.master.connect(meter).connect(context.destination)

    meter.domElement.classList.add('meter')
    HTML.query('body').appendChild(meter.domElement)

    // TODO > Test Data < REMOVE WHEN DONE TESTING
    const memory = machine.memory
    const memoryBank = memory.banks[0]
    memoryBank.patternByIndices(0, 0).testA()
    memoryBank.patternByIndices(0, 1).testB()
    memoryBank.patternByIndices(0, 2).testC()
    memoryBank.patternByIndices(0, 3).testD()
    const chained = new Array(15).fill(false)
    chained[0] = true
    chained[1] = true
    chained[2] = true

    chained[4] = true
    chained[5] = true
    chained[6] = true
    memoryBank.patternGroups[0].writeChain(chained)
    const track = memoryBank.tracks[1]
    track.writeLocation({patternGroupIndex: 0, patternIndex: 0})
    track.writeLocation({patternGroupIndex: 0, patternIndex: 1})
    track.writeLocation({patternGroupIndex: 0, patternIndex: 0})
    track.writeLocation({patternGroupIndex: 0, patternIndex: 1})

    // debugging
    const run = () => {
        debugMode.textContent = interfaceContext.modeName()
        debugTransporting.textContent = machine.transport.isPlaying() ? 'Playing' : 'Paused'
        debugInstrument.textContent = interfaceContext.instrumentMode.get().name
        debugNumberOfKeys.textContent = interfaceContext.multiTapsEmulated.size.toString()
        requestAnimationFrame(run)
    }
    requestAnimationFrame(run)
})()