import { Boot, Dependency } from "../../lib/boot.js"

export const ResourceSampleRate = 44100.0
export type Resources<T> = {
    bassdrum: { attack: T, cycle: T },
    snaredrum: { tone: T, noise: T },
    tomLow: T,
    tomMid: T,
    tomHi: T,
    rim: T,
    clap: T,
    closedHihat: T,
    openedHihat: T,
    crash: T,
    ride: T
}

type MakeDependencies<T, S> = { [K in keyof T]: T[K] extends S ? Dependency<T[K]> : MakeDependencies<T[K], S> }

export const loadResources = (boot: Boot): () => Resources<Float32Array> => {
    const load = (path: string): Dependency<Float32Array> =>
        boot.registerProcess(fetch(path)
            .then(x => x.arrayBuffer())
            .then(x => new Float32Array(x)))
    const dependencies: MakeDependencies<Resources<Float32Array>, Float32Array> = {
        bassdrum: {
            attack: load('./resources/bassdrum-attack.raw'),
            cycle: load('./resources/bassdrum-cycle.raw')
        },
        snaredrum: {
            tone: load('./resources/snare-tone.raw'),
            noise: load('./resources/snare-noise.raw'),
        },
        tomLow: load('./resources/tom-low.raw'),
        tomMid: load('./resources/tom-mid.raw'),
        tomHi: load('./resources/tom-hi.raw'),
        rim: load('./resources/rim.raw'),
        clap: load('./resources/clap.raw'),
        closedHihat: load('./resources/closed-hihat.raw'),
        openedHihat: load('./resources/opened-hihat.raw'),
        crash: load('./resources/crash.raw'),
        ride: load('./resources/ride.raw')
    }
    return (): Resources<Float32Array> => ({
        bassdrum: {
            attack: dependencies.bassdrum.attack.get(),
            cycle: dependencies.bassdrum.cycle.get()
        },
        snaredrum: {
            tone: dependencies.snaredrum.tone.get(),
            noise: dependencies.snaredrum.noise.get()
        },
        tomLow: dependencies.tomLow.get(),
        tomMid: dependencies.tomMid.get(),
        tomHi: dependencies.tomHi.get(),
        rim: dependencies.rim.get(),
        clap: dependencies.clap.get(),
        closedHihat: dependencies.closedHihat.get(),
        openedHihat: dependencies.openedHihat.get(),
        crash: dependencies.crash.get(),
        ride: dependencies.ride.get()
    })
}