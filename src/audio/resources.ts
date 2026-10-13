export const ResourceSampleRate = 44100.0

export type Resources<T> = {
    bassdrum: { attack: T, cycle: T }
    snaredrum: { tone: T, noise: T }
    tomLow: T
    tomMid: T
    tomHi: T
    rim: T
    clap: T
    closedHihat: T
    openedHihat: T
    crash: T
    ride: T
}

export namespace Resources {
    const load = async (name: string): Promise<Float32Array> => {
        const response = await fetch(`${import.meta.env.BASE_URL}resources/${name}.raw`)
        return new Float32Array(await response.arrayBuffer())
    }

    export const fetchAll = async (): Promise<Resources<Float32Array>> => {
        const [attack, cycle, tone, noise, tomLow, tomMid, tomHi, rim, clap, closedHihat, openedHihat, crash, ride] =
            await Promise.all([
                "bassdrum-attack", "bassdrum-cycle", "snare-tone", "snare-noise", "tom-low", "tom-mid", "tom-hi",
                "rim", "clap", "closed-hihat", "opened-hihat", "crash", "ride"
            ].map(load))
        return {
            bassdrum: {attack, cycle}, snaredrum: {tone, noise},
            tomLow, tomMid, tomHi, rim, clap, closedHihat, openedHihat, crash, ride
        }
    }
}
