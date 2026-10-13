import css from "./FunctionKey.sass?inline"
import {isDefined, Lifecycle} from "@opendaw/lib-std"
import {Events, Html} from "@opendaw/lib-dom"
import {createElement} from "@opendaw/lib-jsx"
import {UIContext} from "@/control/context"
import {FunctionKeyIndex} from "@/control/keys"
import {LightClasses} from "./LightClasses"

const className = Html.adoptStyleSheet(css, "FunctionKey")

type Construct = {
    lifecycle: Lifecycle
    ui: UIContext
    index: FunctionKeyIndex
}

export const FunctionKey = ({lifecycle, ui, index}: Construct) => {
    const model = ui.functionKeys.byIndex(index)
    const button: HTMLButtonElement = <button className={className}/>
    if (isDefined(model.shortcut)) {button.title = model.shortcut}
    lifecycle.ownAll(
        model.catchupAndSubscribe(key => LightClasses.apply(button, key)),
        Events.subscribe(button, "pointerdown", (event: PointerEvent) => {
            button.setPointerCapture(event.pointerId)
            ui.pressFunctionKey(index)
        }),
        Events.subscribe(button, "pointerup", () => ui.releaseFunctionKey(index))
    )
    return button
}
