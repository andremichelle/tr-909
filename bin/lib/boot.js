var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Options } from "./common.js";
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
class DependencyImpl {
    constructor(factory) {
        this.factory = factory;
        this.dependencies = [];
        this.result = Options.None;
        this.promise = Options.None;
    }
    require(...keys) {
        keys.forEach(type => this.dependencies.push(type));
        return this;
    }
    loadable(available) {
        return this.dependencies.every(type => available.has(type));
    }
    load() {
        if (this.promise.isEmpty()) {
            this.promise = Options.valueOf(this.factory()
                .then(value => {
                this.result = Options.valueOf(value);
                return value;
            }));
        }
        return this.promise.get();
    }
    idle() {
        return this.promise.isEmpty();
    }
    get() {
        return this.result.get();
    }
}
export class Boot {
    constructor() {
        this.dependencies = new Map();
        this.available = new Set();
        this.promise = Options.None;
    }
    add(key, factory) {
        return this.await(key, () => Promise.resolve(factory()));
    }
    await(key, construct) {
        console.assert(this.promise.isEmpty());
        console.assert(!this.dependencies.has(key));
        const factory = construct instanceof (Promise) ? () => construct : construct;
        const dependency = new DependencyImpl(factory);
        this.dependencies.set(key, dependency);
        return dependency;
    }
    get(key) {
        const dependency = this.dependencies.get(key);
        if (dependency === undefined) {
            throw new Error(`No dependency found for key: ${key}`);
        }
        return dependency.get();
    }
    normalizedPercentage() {
        return 0 === this.dependencies.size ? 1.0 : this.available.size / this.dependencies.size;
    }
    percentage() {
        return Math.round(this.normalizedPercentage() * 100.0);
    }
    awaitCompletion() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.promise.nonEmpty()) {
                return this.promise.get();
            }
            this.promise = Options.valueOf(new Promise((resolve, reject) => {
                console.time('Boot(Total)');
                let timeoutId;
                const check = () => {
                    let complete = true;
                    this.dependencies.forEach((dependency, key) => {
                        if (this.available.has(key)) {
                            return;
                        }
                        if (dependency.idle() && dependency.loadable(this.available)) {
                            const label = `Boot(${typeof (key) === 'string' || typeof (key) === 'number' ? key : key.name})`;
                            console.time(label);
                            dependency.load()
                                .catch(reason => reject(reason))
                                .then(() => {
                                this.available.add(key);
                                console.timeEnd(label);
                                clearTimeout(timeoutId);
                                timeoutId = setTimeout(check, 1);
                            });
                        }
                        complete = false;
                    });
                    if (complete) {
                        console.timeEnd('Boot(Total)');
                        resolve();
                    }
                };
                check();
            }));
            return this.promise.get();
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