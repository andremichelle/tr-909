import css from "./Labeled.sass?inline"
import {Html} from "@opendaw/lib-dom"
import {createElement, JsxValue} from "@opendaw/lib-jsx"

const className = Html.adoptStyleSheet(css, "Labeled")

type Construct = {
    label: string
    below?: string
    style?: Partial<CSSStyleDeclaration>
}

export const Labeled = ({label, below, style}: Construct, children: JsxValue) => (
    <div className={className} data-label={label} data-below={below ?? ""} style={style}>{children}</div>
)
