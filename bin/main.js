var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { LimiterWorklet } from "./audio/limiter/worklet.js";
import { MeterWorklet, StereoMeterWorklet } from "./audio/meter/worklet.js";
import { Machine } from "./audio/tr909/machine.js";
import { loadResources } from "./audio/tr909/resources.js";
import { Boot, newAudioContext, preloadImagesOfCssFile } from "./lib/boot.js";
import { Waiting } from "./lib/common.js";
import { HTML } from "./lib/dom.js";
import { UIContext } from "./tr909/context.js";
const showProgress = (() => {
    const progress = document.querySelector("svg.preloader");
    window.onerror = () => progress.classList.add("error");
    window.onunhandledrejection = () => progress.classList.add("error");
    return (percentage) => progress.style.setProperty("--percentage", percentage.toFixed(2));
})();
(() => __awaiter(void 0, void 0, void 0, function* () {
    console.debug("booting...");
    const context = newAudioContext();
    console.debug(`sampleRate: ${context.sampleRate}Hz`);
    const boot = new Boot();
    boot.addObserver(boot => showProgress(boot.normalizedPercentage()));
    boot.registerProcess(preloadImagesOfCssFile("./bin/main.css"));
    boot.registerProcess(LimiterWorklet.loadModule(context));
    boot.registerProcess(MeterWorklet.loadModule(context));
    boot.registerProcess(Machine.loadModule(context));
    const getResources = loadResources(boot);
    yield boot.waitForCompletion();
    const main = HTML.query('main');
    const parentNode = HTML.query('div.tr-909');
    const wrapper = HTML.query('div.wrapper');
    const debugZoom = HTML.query('[data-output=zoom]');
    const debugMode = HTML.query('[data-output=mode]');
    const debugTransporting = HTML.query('[data-output=transporting]');
    const debugInstrument = HTML.query('[data-output=instrument]');
    const debugNumberOfKeys = HTML.query('[data-output=number-of-keys]');
    document.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });
    document.addEventListener('dblclick', (event) => event.preventDefault(), { passive: false });
    document.addEventListener('contextmenu', event => event.preventDefault());
    const resize = () => {
        document.body.style.height = `${window.innerHeight}px`;
        const padding = 32;
        const scale = Math.min(wrapper.clientWidth / (1226 + padding), wrapper.clientHeight / (728 + padding));
        debugZoom.textContent = `${Math.round(scale * 100)}%`;
        parentNode.style.setProperty("--scale", `${scale}`);
    };
    window.addEventListener("resize", resize);
    resize();
    const body = HTML.query("body");
    HTML.queryAll("svg.preloader", body).forEach(element => element.remove());
    yield Waiting.forFrames(20);
    HTML.queryAll("main", body).forEach(element => element.classList.remove("invisible"));
    console.debug("boot complete.");
    const machine = new Machine(context, getResources());
    const interfaceContext = new UIContext(machine, parentNode);
    const meter = new StereoMeterWorklet(context);
    machine.master.connect(meter).connect(context.destination);
    meter.domElement.classList.add('meter');
    HTML.query('div.top-center').appendChild(meter.domElement);
    if (location.hostname.includes('localhost')) {
        console.log("TEST DATA");
        const memory = machine.memory;
        const memoryBank = memory.banks[0];
        memoryBank.patternByIndices(0, 0).testA();
        memoryBank.patternByIndices(0, 1).testB();
        memoryBank.patternByIndices(0, 2).testC();
        memoryBank.patternByIndices(0, 3).testD();
        const track = memoryBank.tracks[1];
        track.writeLocation({ patternGroupIndex: 0, patternIndex: 0 });
        track.writeLocation({ patternGroupIndex: 0, patternIndex: 1 });
        track.writeLocation({ patternGroupIndex: 0, patternIndex: 0 });
        track.writeLocation({ patternGroupIndex: 0, patternIndex: 1 });
    }
    const run = () => {
        debugMode.textContent = interfaceContext.modeName();
        debugTransporting.textContent = machine.transport.isPlaying() ? 'Playing' : 'Paused';
        debugInstrument.textContent = interfaceContext.instrumentMode.get().name;
        debugNumberOfKeys.textContent = interfaceContext.multiTapsEmulated.size.toString();
        requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
}))();
//# sourceMappingURL=main.js.map