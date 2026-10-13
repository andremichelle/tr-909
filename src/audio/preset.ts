import {asDefined, clamp, DefaultParameter, isDefined, Option, StringMapping, Terminable, Terminator, unitValue, ValueMapping} from "@opendaw/lib-std"

export type BassdrumPreset = {
    tune: DefaultParameter<number>
    level: DefaultParameter<number>
    attack: DefaultParameter<number>
    decay: DefaultParameter<number>
}

export type SnaredrumPreset = {
    tune: DefaultParameter<number>
    level: DefaultParameter<number>
    tone: DefaultParameter<number>
    snappy: DefaultParameter<number>
}

export type TomPreset = {
    tune: DefaultParameter<number>
    level: DefaultParameter<number>
    decay: DefaultParameter<number>
}

export type RimOrClapPreset = {
    level: DefaultParameter<number>
}

export type HihatPreset = {
    level: DefaultParameter<number>
    decay: DefaultParameter<number>
}

export type CrashOrRidePreset = {
    level: DefaultParameter<number>
    tune: DefaultParameter<number>
}

export type BasicVoicePreset = {
    level: DefaultParameter<number>
    tune?: DefaultParameter<number>
    decay?: DefaultParameter<number>
}

export interface PresetFormat {
    tempo: number
    volume: number
    accent: number
    bassdrum: { tune: number, level: number, attack: number, decay: number }
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

const rounded = (mapping: ValueMapping<number>): ValueMapping<number> => ({
    x: (y: number): unitValue => mapping.x(y),
    y: (x: unitValue): number => Math.round(mapping.y(x)),
    clamp: (y: number): number => Math.round(mapping.clamp(y)),
    floating: (): boolean => false
})

export const TempoMapping = rounded(ValueMapping.powerByCenter(120, 37, 290))

const BassdrumTuneMapping = ValueMapping.exponential(0.007, 0.0294)
const BassdrumDecayMapping = ValueMapping.exponential(0.012, 0.100)
const TomDecayMapping = ValueMapping.exponential(0.04, 0.15)
const SnaredrumDecayMapping = ValueMapping.exponential(0.04, 0.2)
const OpenedHihatMapping = ValueMapping.exponential(0.03, 0.16)
const ClosedHihatMapping = ValueMapping.exponential(0.008, 0.06)
const TuneMapping = ValueMapping.linear(-0.5, 0.5)
const LevelMapping = ValueMapping.DefaultDecibel

const TempoString = StringMapping.numeric({unit: "bpm", fractionDigits: 0})
const TimeString = StringMapping.numeric({unit: "s", fractionDigits: 3})
const TuneString = StringMapping.numeric({unit: "oct", fractionDigits: 2, bipolar: true})

const level = (name: string, value: number) => new DefaultParameter<number>(LevelMapping, StringMapping.decible, name, value)
const tune = (name: string) => new DefaultParameter<number>(TuneMapping, TuneString, name, 0.0)
const time = (name: string, mapping: ValueMapping<number>, unit: unitValue) =>
    new DefaultParameter<number>(mapping, TimeString, name, mapping.y(clamp(unit, 0.0, 1.0)))

export class Preset implements Terminable {
    readonly #terminator: Terminator = new Terminator()
    readonly #parameters: Map<string, DefaultParameter<number>> = new Map<string, DefaultParameter<number>>()

    readonly tempo: DefaultParameter<number>
    readonly volume: DefaultParameter<number>
    readonly accent: DefaultParameter<number>
    readonly bassdrum: Readonly<BassdrumPreset>
    readonly snaredrum: Readonly<SnaredrumPreset>
    readonly tomLow: Readonly<TomPreset>
    readonly tomMid: Readonly<TomPreset>
    readonly tomHi: Readonly<TomPreset>
    readonly rim: Readonly<RimOrClapPreset>
    readonly clap: Readonly<RimOrClapPreset>
    readonly hihatLevel: DefaultParameter<number>
    readonly closedHihat: Readonly<HihatPreset>
    readonly openedHihat: Readonly<HihatPreset>
    readonly crash: Readonly<CrashOrRidePreset>
    readonly ride: Readonly<CrashOrRidePreset>

    constructor() {
        this.tempo = this.#register("tempo", new DefaultParameter<number>(TempoMapping, TempoString, "Tempo", 120.0))
        this.volume = this.#register("volume", level("Volume", 0.0))
        this.accent = this.#register("accent", new DefaultParameter<number>(ValueMapping.unipolar(), StringMapping.percent(), "Total Accent", 0.5))
        this.bassdrum = {
            tune: this.#register("bassdrum.tune", time("BD Tune", BassdrumTuneMapping, 0.0)),
            level: this.#register("bassdrum.level", level("BD Level", -6.0)),
            attack: this.#register("bassdrum.attack", level("BD Attack", 0.0)),
            decay: this.#register("bassdrum.decay", time("BD Decay", BassdrumDecayMapping, 0.5))
        }
        this.snaredrum = {
            tune: this.#register("snaredrum.tune", tune("SD Tune")),
            level: this.#register("snaredrum.level", level("SD Level", -6.0)),
            tone: this.#register("snaredrum.tone", time("SD Tone", SnaredrumDecayMapping, 1.0)),
            snappy: this.#register("snaredrum.snappy", level("SD Snappy", 0.0))
        }
        this.tomLow = this.#createTom("tomLow", "LT")
        this.tomMid = this.#createTom("tomMid", "MT")
        this.tomHi = this.#createTom("tomHi", "HT")
        this.rim = {level: this.#register("rim.level", level("RS Level", -6.0))}
        this.clap = {level: this.#register("clap.level", level("HC Level", -6.0))}
        this.hihatLevel = this.#register("hihatLevel", level("HH Level", -6.0))
        this.closedHihat = {
            level: this.hihatLevel,
            decay: this.#register("closedHihat.decay", time("CH Decay", ClosedHihatMapping, 0.0))
        }
        this.openedHihat = {
            level: this.hihatLevel,
            decay: this.#register("openedHihat.decay", time("OH Decay", OpenedHihatMapping, 0.5))
        }
        this.crash = {
            level: this.#register("crash.level", level("Crash Level", -6.0)),
            tune: this.#register("crash.tune", tune("Crash Tune"))
        }
        this.ride = {
            level: this.#register("ride.level", level("Ride Level", -6.0)),
            tune: this.#register("ride.tune", tune("Ride Tune"))
        }
    }

    parameters(): ReadonlyMap<string, DefaultParameter<number>> {return this.#parameters}

    find(path: string): Option<DefaultParameter<number>> {return Option.wrap(this.#parameters.get(path))}

    serialize(): PresetFormat {
        const value = (path: string): number => asDefined(this.#parameters.get(path)).getValue()
        return {
            tempo: value("tempo"),
            volume: value("volume"),
            accent: value("accent"),
            bassdrum: {
                tune: value("bassdrum.tune"), level: value("bassdrum.level"),
                attack: value("bassdrum.attack"), decay: value("bassdrum.decay")
            },
            snaredrum: {
                tune: value("snaredrum.tune"), level: value("snaredrum.level"),
                tone: value("snaredrum.tone"), snappy: value("snaredrum.snappy")
            },
            tomLow: {tune: value("tomLow.tune"), level: value("tomLow.level"), decay: value("tomLow.decay")},
            tomMid: {tune: value("tomMid.tune"), level: value("tomMid.level"), decay: value("tomMid.decay")},
            tomHi: {tune: value("tomHi.tune"), level: value("tomHi.level"), decay: value("tomHi.decay")},
            rim: {level: value("rim.level")},
            clap: {level: value("clap.level")},
            hihatLevel: value("hihatLevel"),
            closedHihat: {decay: value("closedHihat.decay")},
            openedHihat: {decay: value("openedHihat.decay")},
            crash: {level: value("crash.level"), tune: value("crash.tune")},
            ride: {level: value("ride.level"), tune: value("ride.tune")}
        }
    }

    deserialize(format: PresetFormat): this {
        const flatten = (object: object, prefix: string): void => Object.entries(object).forEach(([key, value]) => {
            const path = prefix === "" ? key : `${prefix}.${key}`
            if (typeof value === "number") {
                this.find(path).ifSome(parameter => parameter.setValue(value))
            } else if (isDefined(value) && typeof value === "object") {
                flatten(value, path)
            }
        })
        flatten(format, "")
        return this
    }

    terminate(): void {this.#terminator.terminate()}

    #createTom(key: string, prefix: string): TomPreset {
        return {
            tune: this.#register(`${key}.tune`, tune(`${prefix} Tune`)),
            level: this.#register(`${key}.level`, level(`${prefix} Level`, -6.0)),
            decay: this.#register(`${key}.decay`, time(`${prefix} Decay`, TomDecayMapping, 1.0))
        }
    }

    #register(path: string, parameter: DefaultParameter<number>): DefaultParameter<number> {
        this.#parameters.set(path, parameter)
        return this.#terminator.own(parameter)
    }
}
