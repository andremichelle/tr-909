// noinspection JSUnusedGlobalSymbols

import { Option, Options } from "./common.js"

export const preloadImagesOfCssFile = async (pathToCss: string): Promise<void> => {
    const href = location.href
    const base = href.substring(0, href.lastIndexOf("/")) + "/bin/"
    const urls: URL[] = await fetch(pathToCss)
        .then(x => x.text()).then(x => {
            const matches = x.match(/url\(.+(?=\))/g)
            if (matches === null) {
                console.debug("no image urls found.")
                return []
            }
            return matches
                .map(path => path.replace(/url\(/, "").slice(1, -1))
                .filter(path => !path.startsWith("#"))
                .map(path => {
                    const indexOf = path.lastIndexOf('#')
                    return -1 < indexOf ? path.substr(0, indexOf) : path
                })
                .map(path => new URL(path, base))
        })
    console.debug(`preloadImagesOfCssFile... base: ${base} (${urls.length})`)
    return Promise.all(urls.map(url => fetch(url.href))).then(() => Promise.resolve())
}

export type Key<T = void> = (new (...args: any[]) => T) | string
export type Factory<T> = () => T

export class Dependency<T> {
    private readonly dependencies: Key[] = []

    private result: Option<T> = Options.None
    private promise: Option<Promise<T>> = Options.None

    constructor(private readonly factory: Factory<Promise<T>>) { }

    require(...keys: Key[]): this {
        keys.forEach(type => this.dependencies.push(type))
        return this
    }

    canLoad(available: Set<Key<any>>): boolean {
        return this.dependencies.every(type => available.has(type))
    }

    load(): Promise<T> {
        if (this.promise.isEmpty()) {
            this.promise = Options.valueOf(this.factory()
                .then(value => {
                    this.result = Options.valueOf(value)
                    return value
                }))
        }
        return this.promise.get()
    }

    idle(): boolean {
        return this.promise.isEmpty()
    }

    get(): T {
        return this.result.get()
    }
}

export class Boot {
    private readonly dependencies: Map<Key<any>, Dependency<any>> = new Map<Key<any>, Dependency<any>>()
    private readonly available: Set<Key<any>> = new Set<Key<any>>()

    private promise: Option<Promise<void>> = Options.None

    add<T>(key: Key<T>, factory: Factory<T>): Dependency<T> {
        return this.addAwait(key, () => Promise.resolve(factory()))
    }

    await<T>(key: Key<T>, promise: Promise<T>): Dependency<T> {
        return this.addAwait(key, () => promise)
    }

    addAwait<T>(key: Key<T>, factory: Factory<Promise<T>>): Dependency<T> {
        console.assert(this.promise.isEmpty())
        console.assert(!this.dependencies.has(key))
        const dependency = new Dependency<T>(factory)
        this.dependencies.set(key, dependency)
        return dependency
    }

    resolve<T>(key: Key<T>): T {
        return this.dependencies.get(key)!.get()
    }

    normalizedPercentage() {
        return 0 === this.dependencies.size ? 1.0 : this.available.size / this.dependencies.size
    }

    percentage() {
        return Math.round(this.normalizedPercentage() * 100.0)
    }

    async awaitCompletion(): Promise<void> {
        if (this.promise.nonEmpty()) {
            return this.promise.get()
        }
        this.promise = Options.valueOf(new Promise<void>((resolve, reject) => {
            console.time('Boot complete')
            const check = () => {
                let complete = true
                this.dependencies.forEach(<T extends Object>(dependency: Dependency<T>, key: Key<T>): void => {
                    if (this.available.has(key)) {
                        return
                    }
                    if (dependency.idle() && dependency.canLoad(this.available)) {
                        const label = `Boot(${typeof (key) === 'string' ? key : key.name})`
                        console.time(label)
                        dependency.load()
                            .catch(reason => reject(reason))
                            .then(() => {
                                this.available.add(key)
                                console.timeEnd(label)
                                setTimeout(check, 1)
                            })
                    }
                    complete = false
                })
                if (complete) {
                    console.timeEnd('Boot complete')
                    resolve()
                }
            }
            check()
        }))
        return this.promise.get()
    }
}

export const newAudioContext = (options: AudioContextOptions = {
    sampleRate: 44100,
    latencyHint: 'interactive'
}): AudioContext => {
    const context = new AudioContext(options)
    if (context.state !== "running") {
        const eventOptions = { capture: true }
        const resume = async () => {
            if (context.state !== "running") {
                try {
                    await context.resume()
                    console.debug(`sampleRate: ${context.sampleRate}Hz, baseLatency: ${context.baseLatency}, outputLatency: ${context.outputLatency}`)
                } catch (e) {
                    return
                }
                window.removeEventListener("pointerdown", resume, eventOptions)
                window.removeEventListener("keydown", resume, eventOptions)
            }
        }
        window.addEventListener("pointerdown", resume, eventOptions)
        window.addEventListener("keydown", resume, eventOptions)
    } else {
        console.debug(`sampleRate: ${context.sampleRate}Hz, baseLatency: ${context.baseLatency}, outputLatency: ${context.outputLatency}`)
    }
    return context
}