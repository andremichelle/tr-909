export const AudioFilesSampleRate = 44100.0

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

export class AudioFiles {
    static async load(): Promise<AudioFiles> {
        const load = (path: string): Promise<Float32Array> => fetch(path)
            .then(x => x.arrayBuffer())
            .then(x => new Float32Array(x))
        const promises: Resources<Promise<Float32Array>> = {
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
        return new AudioFiles({
            bassdrum: {
                attack: await promises.bassdrum.attack,
                cycle: await promises.bassdrum.cycle
            },
            snaredrum: {
                tone: await promises.snaredrum.tone,
                noise: await promises.snaredrum.noise
            },
            tomLow: await promises.tomLow,
            tomMid: await promises.tomMid,
            tomHi: await promises.tomHi,
            rim: await promises.rim,
            clap: await promises.clap,
            closedHihat: await promises.closedHihat,
            openedHihat: await promises.openedHihat,
            crash: await promises.crash,
            ride: await promises.ride
        })
    }

    constructor(readonly resources: Resources<Float32Array>) { }
}