var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ObservableImpl } from "./common.js";
export const preloadImagesOfCssFile = (pathToCss) => __awaiter(void 0, void 0, void 0, function* () {
    const href = location.href;
    const base = href.substring(0, href.lastIndexOf("/")) + "/bin/";
    const urls = yield fetch(pathToCss)
        .then(x => x.text()).then(x => {
        const matches = x.match(/url\(.+(?=\))/g);
        if (matches === null) {
            console.debug("no image urls found.");
            return [];
        }
        return matches
            .map(path => path.replace(/url\(/, "").slice(1, -1))
            .filter(path => !path.startsWith("#"))
            .map(path => {
            const indexOf = path.lastIndexOf('#');
            return -1 < indexOf ? path.substr(0, indexOf) : path;
        })
            .map(path => new URL(path, base));
    });
    console.debug(`preloadImagesOfCssFile... base: ${base} (${urls.length})`);
    return Promise.all(urls.map(url => fetch(url.href))).then(() => Promise.resolve());
});
export class Boot {
    constructor() {
        this.observable = new ObservableImpl();
        this.finishedTasks = 0 | 0;
        this.totalTasks = 0 | 0;
        this.completed = false;
    }
    addObserver(observer) {
        return this.observable.addObserver(observer);
    }
    terminate() {
        this.observable.terminate();
    }
    registerProcess(promise) {
        this.totalTasks++;
        let result = null;
        promise.then((value) => {
            result = value;
            this.finishedTasks++;
            if (this.isCompleted())
                this.completed = true;
            this.observable.notify(this);
        });
        return {
            get: () => {
                if (result === null) {
                    throw new Error("Dependency has not been resolved.");
                }
                return result;
            }
        };
    }
    registerFont(name, url) {
        return this.registerProcess(document.fonts.ready
            .then((faceSet) => new FontFace(name, url)
            .load()
            .then(fontFace => faceSet.add(fontFace))));
    }
    isCompleted() {
        return this.finishedTasks === this.totalTasks;
    }
    normalizedPercentage() {
        return 0 === this.totalTasks ? 1.0 : this.finishedTasks / this.totalTasks;
    }
    percentage() {
        return Math.round(this.normalizedPercentage() * 100.0);
    }
    waitForCompletion() {
        return this.isCompleted() ? Promise.resolve() : new Promise((resolve) => {
            this.observable.addObserver(boot => {
                if (boot.isCompleted()) {
                    requestAnimationFrame(() => {
                        resolve();
                        boot.terminate();
                    });
                }
            });
        });
    }
}
export const newAudioContext = (options = {
    sampleRate: 44100,
    latencyHint: 'interactive'
}) => {
    const context = new AudioContext(options);
    if (context.state !== "running") {
        const eventOptions = { capture: true };
        const resume = () => __awaiter(void 0, void 0, void 0, function* () {
            if (context.state !== "running") {
                try {
                    yield context.resume();
                    console.debug(`sampleRate: ${context.sampleRate}Hz, baseLatency: ${context.baseLatency}, outputLatency: ${context.outputLatency}`);
                }
                catch (e) {
                    return;
                }
                window.removeEventListener("pointerdown", resume, eventOptions);
                window.removeEventListener("keydown", resume, eventOptions);
            }
        });
        window.addEventListener("pointerdown", resume, eventOptions);
        window.addEventListener("keydown", resume, eventOptions);
    }
    else {
        console.debug(`sampleRate: ${context.sampleRate}Hz, baseLatency: ${context.baseLatency}, outputLatency: ${context.outputLatency}`);
    }
    return context;
};
//# sourceMappingURL=boot.js.map