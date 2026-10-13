import css from "./KeyLabels.sass?inline"
import {Html} from "@opendaw/lib-dom"
import {createElement} from "@opendaw/lib-jsx"

const className = Html.adoptStyleSheet(css, "KeyLabels")

const FunctionLabels: ReadonlyArray<string> = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "COPY", "INS", "DEL", "SAVE", "VERIFY", "LOAD"
]

const TriggerLabels: ReadonlyArray<{ labels: ReadonlyArray<string>, bend: boolean, light: boolean }> = [
    {labels: ["BASS DRUM"], bend: true, light: false},
    {labels: ["SNARE DRUM"], bend: true, light: false},
    {labels: ["LOW TOM"], bend: true, light: false},
    {labels: ["MID TOM"], bend: true, light: false},
    {labels: ["HI TOM"], bend: true, light: false},
    {labels: ["RIM SHOT", "HAND CLAP"], bend: false, light: true},
    {labels: ["CLOSED", "OPEN", "CLOSED"], bend: true, light: true},
    {labels: ["CRASH", "RIDE"], bend: false, light: true}
]

type Construct = {
    style?: Partial<CSSStyleDeclaration>
}

export const FunctionKeyLabels = ({style}: Construct) => (
    <div className={Html.buildClassList(className, "functions")} style={style}>
        {FunctionLabels.map(label => <div>{label}</div>)}
    </div>
)

export const TriggerKeyLabels = ({style}: Construct) => (
    <div className={Html.buildClassList(className, "triggers")} style={style}>
        {TriggerLabels.map(({labels, bend, light}) => (
            <div className={Html.buildClassList(bend && "bend", light && "light")}>
                {labels.map(label => <span>{label}</span>)}
            </div>
        ))}
    </div>
)
