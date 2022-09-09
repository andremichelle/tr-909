var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MeterWorkletFactory } from "./audio/meter/worklet.js";
import { MachineFactory, Machine } from "./audio/tr909/machine.js";
import { AudioFiles } from "./audio/tr909/resources.js";
import { Boot, newAudioContext, preloadImagesOfCssFile } from "./lib/boot.js";
import { Events, Options, Waiting } from "./lib/common.js";
import { AnimationFrame, HTML } from "./lib/dom.js";
import { JsonBin } from "./lib/jsonbin.js";
import { UIContext } from "./tr909/context.js";
import { resetHighlights, startTutorial as createLecture } from './tr909/tutorial.js';
(() => __awaiter(void 0, void 0, void 0, function* () {
    console.debug("booting...");
    const onBootError = () => alert(new Error('Failed to boot. Please use Chrome or Safari.'));
    window.addEventListener('error', onBootError);
    window.addEventListener('unhandledrejection', onBootError);
    const context = newAudioContext();
    const boot = new Boot();
    boot.await('css', preloadImagesOfCssFile("./bin/main.css"));
    boot.add(Machine, () => boot.get(MachineFactory)
        .create(context, boot.get(AudioFiles).resources, boot.get(MeterWorkletFactory)))
        .require(MachineFactory, AudioFiles, MeterWorkletFactory);
    boot.await(MachineFactory, MachineFactory.load(context));
    boot.await(MeterWorkletFactory, MeterWorkletFactory.load(context));
    boot.await(AudioFiles, AudioFiles.load());
    yield Waiting.forFrames(12);
    yield boot.awaitCompletion();
    window.removeEventListener('error', onBootError);
    window.removeEventListener('unhandledrejection', onBootError);
    const machine = boot.get(Machine);
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
        style.minWidth = `${window.innerWidth}px`;
        style.minHeight = `${window.innerHeight}px`;
        const scale = Math.min(wrapper.clientWidth / size.width, wrapper.clientHeight / size.height);
        parentNode.style.setProperty("--scale", `${scale}`);
    };
    window.addEventListener("resize", resize);
    resize();
    const body = HTML.query("body");
    HTML.queryAll("svg.preloader", body).forEach(element => element.remove());
    yield Waiting.forFrames(20);
    HTML.queryAll("main", body).forEach(element => element.classList.remove("invisible"));
    const ui = new UIContext(machine, parentNode);
    machine.master.connect(context.destination);
    if (format !== null) {
        ui.deserialize(format);
    }
    AnimationFrame.init();
    let lecturing = Options.None;
    const tutorialButton = HTML.query('a[target=tutorial]');
    const onAudioContextStateChange = () => {
        if (context.state !== 'running') {
            context.resume().then(() => console.debug('resume'));
        }
    };
    Events.bind(tutorialButton, 'click', (event) => {
        event.preventDefault();
        if (lecturing.isEmpty()) {
            const lecture = createLecture(ui, HTML.query('[data-action=tutorial-advance-button]'), context);
            lecturing = Options.valueOf(lecture);
            tutorialButton.classList.add('active');
            context.addEventListener('statechange', onAudioContextStateChange);
            lecture.start().catch(() => null).then(() => {
                context.removeEventListener('statechange', onAudioContextStateChange);
                tutorialButton.classList.remove('active');
                resetHighlights();
                lecture.terminate();
                lecturing = Options.None;
            });
        }
        else {
            lecturing.get().terminate();
            lecturing = Options.None;
        }
    });
}))();
//# sourceMappingURL=main.js.map