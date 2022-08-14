import { Option, Options, Parameter, PrintMapping, Terminable, Terminator } from "../../lib/common.js"
import { Exp, Linear, Pow, Round as RoundMapping, Volume } from "../../lib/mapping.js"
import { Serializer } from './../../lib/common'

export type BassdrumPreset = {
    tune: Parameter<number>
    level: Parameter<number>
    attack: Parameter<number>
    decay: Parameter<number>
}

export type SnaredrumPreset = {
    tune: Parameter<number>
    level: Parameter<number>
    tone: Parameter<number>
    snappy: Parameter<number>
}

export type TomPreset = {
    tune: Parameter<number>
    level: Parameter<number>
    decay: Parameter<number>
}

export type RimOrClapPreset = {
    level: Parameter<number>
}

export type HihatPreset = {
    level: Parameter<number>
    decay: Parameter<number>
}

export type CrashOrRidePreset = {
    level: Parameter<number>
    tune: Parameter<number>
}

export const TempoMapping = new RoundMapping(Pow.byCenter(120, 37, 290))

const BassdrumTuneMapping = new Exp(0.007, 0.0294)
const BassdrumDecayMapping = new Exp(0.012, 0.100)
const TomDecayMapping = new Exp(0.04, 0.15)
const SnaredrumDecayMapping = new Exp(0.04, 0.2)
const OpenedHihatMapping = new Exp(0.03, 0.16)
const ClosedHihatMapping = new Exp(0.008, 0.06)
const TuneMapping = new Linear(-0.5, 0.5)

export interface PresetFormat {
    tempo: number
    volume: number
    accent: number
    bassdrum: { tune: number, level: number, attack: number, decay: number },
    snaredrum: { tune: number, level: number, tone: number, snappy: number }
    tomLow: { tune: number, level: number, decay: number }
    tomMid: { tune: number, level: number, decay: number }
    tomHi: { tune: number, level: number, decay: number }
    rim: { level: number }
    clap: { level: number }
    hihatLevel: number
    closedHihat: { decay: number }
    openedHihat: { decay: number }
    crash: { level: number, tune: number }
    ride: { level: number, tune: number }
}

export class Preset implements Serializer<PresetFormat> {
    readonly tempo = new Parameter<number>(TempoMapping, PrintMapping.FLOAT_ONE, 120.0)
    readonly volume = new Parameter<number>(Volume.Default, PrintMapping.DECIBEL, 0.0)
    readonly accent = new Parameter<number>(Linear.Identity, PrintMapping.UnipolarPercent, 0.5)
    readonly bassdrum: Readonly<BassdrumPreset> = Object.seal({
        tune: new Parameter<number>(BassdrumTuneMapping, PrintMapping.UnipolarPercent, BassdrumTuneMapping.y(0.0)),
        level: new Parameter<number>(Volume.Default, PrintMapping.DECIBEL, -6.0),
        attack: new Parameter<number>(Volume.Default, PrintMapping.DECIBEL, 0.0),
        decay: new Parameter<number>(BassdrumDecayMapping, PrintMapping.UnipolarPercent, BassdrumDecayMapping.y(0.5))
    })
    readonly snaredrum: Readonly<SnaredrumPreset> = Object.seal({
        tune: new Parameter<number>(TuneMapping, PrintMapping.UnipolarPercent, TuneMapping.y(0.5)),
        level: new Parameter<number>(Volume.Default, PrintMapping.DECIBEL, -6.0),
        tone: new Parameter<number>(SnaredrumDecayMapping, PrintMapping.UnipolarPercent, SnaredrumDecayMapping.y(1.0)),
        snappy: new Parameter<number>(Volume.Default, PrintMapping.DECIBEL, 0.0)
    })
    readonly tomLow: Readonly<TomPreset> = Object.seal({
        tune: new Parameter<number>(TuneMapping, PrintMapping.UnipolarPercent, TuneMapping.y(0.5)),
        level: new Parameter<number>(Volume.Default, PrintMapping.DECIBEL, -6.0),
        decay: new Parameter<number>(TomDecayMapping, PrintMapping.UnipolarPercent, TomDecayMapping.y(1.0))
    })
    readonly tomMid: Readonly<TomPreset> = Object.seal({
        tune: new Parameter<number>(TuneMapping, PrintMapping.UnipolarPercent, TuneMapping.y(0.5)),
        level: new Parameter<number>(Volume.Default, PrintMapping.DECIBEL, -6.0),
        decay: new Parameter<number>(TomDecayMapping, PrintMapping.UnipolarPercent, TomDecayMapping.y(1.0))
    })
    readonly tomHi: Readonly<TomPreset> = Object.seal({
        tune: new Parameter<number>(TuneMapping, PrintMapping.UnipolarPercent, TuneMapping.y(0.5)),
        level: new Parameter<number>(Volume.Default, PrintMapping.DECIBEL, -6.0),
        decay: new Parameter<number>(TomDecayMapping, PrintMapping.UnipolarPercent, TomDecayMapping.y(1.0))
    })
    readonly rim: Readonly<RimOrClapPreset> = Object.seal({
        level: new Parameter<number>(Volume.Default, PrintMapping.DECIBEL, -6.0)
    })
    readonly clap: Readonly<RimOrClapPreset> = Object.seal({
        level: new Parameter<number>(Volume.Default, PrintMapping.DECIBEL, -6.0)
    })
    readonly hihatLevel = new Parameter<number>(Volume.Default, PrintMapping.DECIBEL, -6.0)
    readonly closedHihat: Readonly<HihatPreset> = {
        level: this.hihatLevel,
        decay: new Parameter<number>(ClosedHihatMapping, PrintMapping.UnipolarPercent, ClosedHihatMapping.y(0.0))
    }
    readonly openedHihat: Readonly<HihatPreset> = {
        level: this.hihatLevel,
        decay: new Parameter<number>(OpenedHihatMapping, PrintMapping.UnipolarPercent, OpenedHihatMapping.y(0.5))
    }
    readonly crash: Readonly<CrashOrRidePreset> = Object.seal({
        level: new Parameter<number>(Volume.Default, PrintMapping.DECIBEL, -6.0),
        tune: new Parameter<number>(TuneMapping, PrintMapping.UnipolarPercent, TuneMapping.y(0.5))
    })
    readonly ride: Readonly<CrashOrRidePreset> = Object.seal({
        level: new Parameter<number>(Volume.Default, PrintMapping.DECIBEL, -6.0),
        tune: new Parameter<number>(TuneMapping, PrintMapping.UnipolarPercent, TuneMapping.y(0.5))
    })

    constructor() {
        Object.defineProperty(this.closedHihat, 'level', { enumerable: false })
        Object.defineProperty(this.openedHihat, 'level', { enumerable: false })
    }

    serialize(): PresetFormat {
        return {
            tempo: this.tempo.get(),
            volume: this.volume.get(),
            accent: this.accent.get(),
            bassdrum: {
                tune: this.bassdrum.tune.get(),
                level: this.bassdrum.level.get(),
                attack: this.bassdrum.attack.get(),
                decay: this.bassdrum.decay.get()
            },
            snaredrum: {
                tune: this.snaredrum.tune.get(),
                level: this.snaredrum.level.get(),
                tone: this.snaredrum.tone.get(),
                snappy: this.snaredrum.snappy.get()
            },
            tomLow: {
                tune: this.tomLow.tune.get(),
                level: this.tomLow.level.get(),
                decay: this.tomLow.decay.get()
            },
            tomMid: {
                tune: this.tomMid.tune.get(),
                level: this.tomMid.level.get(),
                decay: this.tomMid.decay.get()
            },
            tomHi: {
                tune: this.tomHi.tune.get(),
                level: this.tomHi.level.get(),
                decay: this.tomHi.decay.get()
            },
            rim: { level: this.rim.level.get() },
            clap: { level: this.clap.level.get() },
            hihatLevel: this.hihatLevel.get(),
            closedHihat: { decay: this.closedHihat.decay.get() },
            openedHihat: { decay: this.openedHihat.decay.get() },
            crash: { level: this.crash.level.get(), tune: this.crash.tune.get() },
            ride: { level: this.ride.level.get(), tune: this.ride.tune.get() }
        }
    }

    deserialize(format: PresetFormat): this {
        this.tempo.set(format.tempo)
        this.volume.set(format.volume)
        this.accent.set(format.accent)
        this.bassdrum.tune.set(format.bassdrum.tune)
        this.bassdrum.level.set(format.bassdrum.level)
        this.bassdrum.attack.set(format.bassdrum.attack)
        this.bassdrum.decay.set(format.bassdrum.decay)
        this.snaredrum.tune.set(format.snaredrum.tune)
        this.snaredrum.level.set(format.snaredrum.level)
        this.snaredrum.tone.set(format.snaredrum.tone)
        this.snaredrum.snappy.set(format.snaredrum.snappy)
        this.tomLow.tune.set(format.tomLow.tune)
        this.tomLow.level.set(format.tomLow.level)
        this.tomLow.decay.set(format.tomLow.decay)
        this.tomMid.tune.set(format.tomMid.tune)
        this.tomMid.level.set(format.tomMid.level)
        this.tomMid.decay.set(format.tomMid.decay)
        this.tomHi.tune.set(format.tomHi.tune)
        this.tomHi.level.set(format.tomHi.level)
        this.tomHi.decay.set(format.tomHi.decay)
        this.rim.level.set(format.rim.level)
        this.clap.level.set(format.clap.level)
        this.hihatLevel.set(format.hihatLevel)
        this.closedHihat.decay.set(format.closedHihat.decay)
        this.openedHihat.decay.set(format.openedHihat.decay)
        this.crash.level.set(format.crash.level)
        this.crash.tune.set(format.crash.tune)
        this.ride.level.set(format.ride.level)
        this.ride.tune.set(format.ride.tune)
        return this
    }

    observeAll(callback: (parameter: Parameter<any>, path: string[]) => void): Terminable {
        const terminator = new Terminator()
        const search = <T>(object: T, path: string[]): void => {
            for (let key in object) {
                const element = object[key]
                const elementPath = path.concat(key)
                if (element instanceof Parameter) {
                    terminator.with(element.addObserver(() => callback(element, elementPath)))
                } else if (element instanceof Object) {
                    search(element, elementPath)
                }
            }
        }
        search(this, [])
        return terminator
    }

    find(path: string[]): Option<Parameter<any>> {
        return Options.valueOf(path.reduce((object: any, key: string) => object[key], this))
    }
}