import css from "./PatternFunctions.sass?inline"
import {Lifecycle} from "@opendaw/lib-std"
import {Html} from "@opendaw/lib-dom"
import {createElement} from "@opendaw/lib-jsx"
import {UIContext} from "@/control/context"
import {FunctionKeyIndex} from "@/control/keys"
import {FunctionKey} from "./FunctionKey"

const className = Html.adoptStyleSheet(css, "PatternFunctions")

type Construct = {
    lifecycle: Lifecycle
    ui: UIContext
    style?: Partial<CSSStyleDeclaration>
}

export const PatternFunctions = ({lifecycle, ui, style}: Construct) => {
    const key = (index: FunctionKeyIndex) => <FunctionKey lifecycle={lifecycle} ui={ui} index={index}/>
    return (
        <div className={className} style={style}>
            {key(FunctionKeyIndex.LastStep)}
            {key(FunctionKeyIndex.Scale)}
            <span>LAST STEP</span>
            <span>SCALE</span>
            {key(FunctionKeyIndex.ShuffleFlam)}
            {key(FunctionKeyIndex.Clear)}
            <span>SHUFFLE<br/>/FLAM</span>
            <span>CLEAR</span>
            {key(FunctionKeyIndex.InstrumentSelect)}
            {key(FunctionKeyIndex.Shift)}
            <span>INSTRUMENT<br/>SELECT</span>
            <span className="shift">SHIFT</span>
        </div>
    )
}
