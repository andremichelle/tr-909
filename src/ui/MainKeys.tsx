import css from "./MainKeys.sass?inline"
import {Arrays, Lifecycle} from "@opendaw/lib-std"
import {Html} from "@opendaw/lib-dom"
import {createElement} from "@opendaw/lib-jsx"
import {UIContext} from "@/control/context"
import {MainKeyIndex} from "@/control/keys"
import {HardButton} from "./HardButton"
import {Labeled} from "./Labeled"

const className = Html.adoptStyleSheet(css, "MainKeys")

type Construct = {
    lifecycle: Lifecycle
    ui: UIContext
    style?: Partial<CSSStyleDeclaration>
}

export const MainKey = ({lifecycle, ui, index}: { lifecycle: Lifecycle, ui: UIContext, index: MainKeyIndex }) => (
    <HardButton lifecycle={lifecycle}
                kind="switch"
                model={ui.mainKeys.byIndex(index)}
                onPress={() => ui.pressMainKey(index)}
                onRelease={() => ui.releaseMainKey(index)}/>
)

export const MainKeys = ({lifecycle, ui, style}: Construct) => {
    const pairs = Arrays.create(pair => (
        <div className="two">
            {[pair * 2, pair * 2 + 1].map(index => (
                <Labeled label={String(index + 1)}>
                    <MainKey lifecycle={lifecycle} ui={ui} index={index}/>
                </Labeled>
            ))}
        </div>
    ), 8)
    return (
        <div className={className} style={style}>
            {pairs.flatMap((pair, index) => index === 0 ? [pair] : [<hr/>, pair])}
        </div>
    )
}
