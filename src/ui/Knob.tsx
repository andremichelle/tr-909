import css from "./Knob.sass?inline"
import {Lifecycle, Optional, Parameter, Terminator} from "@opendaw/lib-std"
import {Events, Html} from "@opendaw/lib-dom"
import {createElement} from "@opendaw/lib-jsx"

const className = Html.adoptStyleSheet(css, "Knob")

type Construct = {
    lifecycle: Lifecycle
    parameter: Parameter<number>
    label: string
    big?: boolean
    units?: [string, string]
    style?: Partial<CSSStyleDeclaration>
}

export const Knob = ({lifecycle, parameter, label, big, units, style}: Construct) => {
    const element: HTMLDivElement = (
        <div className={Html.buildClassList(className, big === true && "big")} data-label={label} style={style}>
            <div className="knob"/>
            {units?.map(unit => <span>{unit}</span>)}
        </div>
    )
    let dragging: Optional<Terminator> = undefined
    lifecycle.ownAll(
        parameter.catchupAndSubscribe(() =>
            element.style.setProperty("--angle", `${-150.0 + parameter.getUnitValue() * 300.0}deg`)),
        Events.subscribe(element, "pointerdown", (event: PointerEvent) => {
            element.setPointerCapture(event.pointerId)
            const startValue = parameter.getUnitValue()
            const startPointer = event.clientY
            dragging?.terminate()
            const terminator = new Terminator()
            terminator.ownAll(
                Events.subscribe(element, "pointermove", (moveEvent: PointerEvent) =>
                    parameter.setUnitValue(startValue - (moveEvent.clientY - startPointer) * 0.01)),
                Events.subscribe(element, "pointerup", () => terminator.terminate()),
                Events.subscribe(element, "lostpointercapture", () => terminator.terminate())
            )
            dragging = terminator
        }),
        {terminate: () => dragging?.terminate()}
    )
    return element
}
