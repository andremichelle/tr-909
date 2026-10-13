import css from "./Instruments.sass?inline"
import {Lifecycle, Parameter} from "@opendaw/lib-std"
import {Html} from "@opendaw/lib-dom"
import {createElement, JsxValue} from "@opendaw/lib-jsx"
import {Preset} from "@/audio/preset"
import {Knob} from "./Knob"

const className = Html.adoptStyleSheet(css, "Instruments")

type Construct = {
    lifecycle: Lifecycle
    preset: Preset
    style?: Partial<CSSStyleDeclaration>
}

export const Instruments = ({lifecycle, preset, style}: Construct) => {
    const knob = (label: string, parameter: Parameter<number>) => <Knob lifecycle={lifecycle} label={label} parameter={parameter}/>
    const group = (titles: ReadonlyArray<string>, ...knobs: ReadonlyArray<JsxValue>) => (
        <div className="instrument">
            {titles.map(title => <h1 className={titles.length === 1 ? "single" : ""}>{title}</h1>)}
            {knobs}
        </div>
    )
    const {bassdrum, snaredrum, tomLow, tomMid, tomHi, rim, clap, closedHihat, openedHihat, crash, ride} = preset
    const accent: HTMLElement = knob("", preset.accent)
    accent.classList.add("accent")
    return (
        <div className={className} style={style}>
            <hr/>
            {group(["TOTAL ACCENT"], accent)}
            <hr/>
            {group(["BASS DRUM"],
                knob("TUNE", bassdrum.tune), knob("LEVEL", bassdrum.level),
                knob("ATTACK", bassdrum.attack), knob("DECAY", bassdrum.decay))}
            <hr/>
            {group(["SNARE DRUM"],
                knob("TUNE", snaredrum.tune), knob("LEVEL", snaredrum.level),
                knob("TONE", snaredrum.tone), knob("SNAPPY", snaredrum.snappy))}
            <hr/>
            {group(["LOW TOM"], knob("TUNE", tomLow.tune), knob("LEVEL", tomLow.level), knob("DECAY", tomLow.decay))}
            <hr/>
            {group(["MID TOM"], knob("TUNE", tomMid.tune), knob("LEVEL", tomMid.level), knob("DECAY", tomMid.decay))}
            <hr/>
            {group(["HI TOM"], knob("TUNE", tomHi.tune), knob("LEVEL", tomHi.level), knob("DECAY", tomHi.decay))}
            <hr/>
            {group(["RIM SHOT", "HAND CLAP"], knob("LEVEL", rim.level), knob("LEVEL", clap.level))}
            <hr/>
            {group(["HI HAT"],
                <div/>, knob("LEVEL", preset.hihatLevel),
                knob("CH DECAY", closedHihat.decay), knob("OH DECAY", openedHihat.decay))}
            <hr/>
            {group(["CYMBAL"],
                knob("LEVEL", crash.level), knob("LEVEL", ride.level),
                knob("CRASH TUNE", crash.tune), knob("RIDE TUNE", ride.tune))}
            <hr/>
        </div>
    )
}
