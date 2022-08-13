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
import { MeterWorklet } from "./audio/meter/worklet.js";
import { Machine } from "./audio/tr909/machine.js";
import { loadResources } from "./audio/tr909/resources.js";
import { Boot, newAudioContext, preloadImagesOfCssFile } from "./lib/boot.js";
import { Events, Options, Waiting } from "./lib/common.js";
import { AnimationFrame, HTML } from "./lib/dom.js";
import { JsonBin } from "./lib/jsonbin.js";
import { UIContext } from "./tr909/context.js";
import { startTutorial as createLecture } from './tr909/tutorial.js';
const showProgress = (() => {
    const progress = document.querySelector("svg.preloader");
    window.onunhandledrejection = window.onerror = (reason) => {
        alert(`An error occurred during booting. Please try Chrome or Safari. [${reason.toString()}]`);
        progress.classList.add("error");
    };
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
    let format = null;
    if (location.hash !== "") {
        try {
            format = (yield JsonBin.load(location.hash.substring(1))).record;
        }
        catch (reason) {
            console.warn(reason);
        }
    }
    document.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });
    document.addEventListener('dblclick', (event) => event.preventDefault(), { passive: false });
    document.addEventListener('contextmenu', event => event.preventDefault());
    const size = { width: 1226 + 64, height: 728 };
    const resize = () => {
        const style = document.body.style;
        style.height = `${window.innerHeight}px`;
        style.width = `${window.innerWidth}px`;
        const scale = Math.min(wrapper.clientWidth / size.width, wrapper.clientHeight / size.height);
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
    const ui = new UIContext(machine, parentNode);
    machine.master.connect(context.destination);
    if (format !== null) {
        ui.deserialize(format);
    }
    if (location.hostname.includes('localhost') || location.hostname.includes('127.0.0.1')) {
        if (false) {
            console.log("INSTALLED TEST DATA");
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
    }
    AnimationFrame.init();
    let lecturing = Options.None;
    const tutorialButton = HTML.query('a[target=tutorial]');
    const subscription = Events.bind(tutorialButton, 'click', (event) => {
        event.preventDefault();
        if (!confirm(`This will reset the machine.`)) {
            return;
        }
        if (lecturing.isEmpty()) {
            const lecture = createLecture(ui, HTML.query('[data-action=tutorial-advance-button]'));
            lecturing = Options.valueOf(lecture);
            tutorialButton.style.opacity = "0.3";
            lecture.start().catch(() => null).then(() => {
                tutorialButton.style.opacity = "1.0";
                lecturing = Options.None;
            });
        }
        else {
            lecturing.get().cancel();
            lecturing = Options.None;
        }
    });
}))();
//# sourceMappingURL=main.js.map