import css from "./HardButton.sass?inline"
import {Exec, isDefined, Lifecycle, ObservableValue} from "@opendaw/lib-std"
import {Events, Html} from "@opendaw/lib-dom"
import {createElement} from "@opendaw/lib-jsx"
import {Key} from "@/control/keys"
import {LightClasses} from "./LightClasses"

const className = Html.adoptStyleSheet(css, "HardButton")

type Construct = {
    lifecycle: Lifecycle
    kind: "switch" | "trigger"
    bright?: boolean
    model?: Key
    highlighted?: ObservableValue<boolean>
    onPress: Exec
    onRelease?: Exec
}

export const HardButton = ({lifecycle, kind, bright, model, highlighted, onPress, onRelease}: Construct) => {
    const button: HTMLButtonElement = (
        <button className={Html.buildClassList(className, kind, bright === true && "bright")}/>
    )
    lifecycle.ownAll(
        Events.subscribe(button, "pointerdown", (event: PointerEvent) => {
            button.setPointerCapture(event.pointerId)
            onPress()
        }),
        Events.subscribe(button, "pointerup", () => onRelease?.())
    )
    if (isDefined(model)) {
        if (isDefined(model.shortcut)) {button.title = model.shortcut}
        lifecycle.own(model.catchupAndSubscribe(key => LightClasses.apply(button, key)))
    }
    if (isDefined(highlighted)) {
        lifecycle.own(highlighted.catchupAndSubscribe(owner => button.classList.toggle("highlight", owner.getValue())))
    }
    return button
}
