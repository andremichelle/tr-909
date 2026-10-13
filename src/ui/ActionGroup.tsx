import css from "./ActionGroup.sass?inline"
import {int} from "@opendaw/lib-std"
import {Html} from "@opendaw/lib-dom"
import {createElement, JsxValue} from "@opendaw/lib-jsx"

const className = Html.adoptStyleSheet(css, "ActionGroup")

type Construct = {
    columns: int
    style?: Partial<CSSStyleDeclaration>
}

export const ActionGroup = ({columns, style}: Construct, children: JsxValue) => (
    <div className={className} style={style} onInit={element => element.style.setProperty("--columns", String(columns))}>
        {children}
    </div>
)
