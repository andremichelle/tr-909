import css from "./WorkingOverlay.sass?inline"
import {Lifecycle, ObservableOption} from "@opendaw/lib-std"
import {Html} from "@opendaw/lib-dom"
import {createElement} from "@opendaw/lib-jsx"

const className = Html.adoptStyleSheet(css, "WorkingOverlay")

type Construct = {
    lifecycle: Lifecycle
    working: ObservableOption<string>
}

export const WorkingOverlay = ({lifecycle, working}: Construct) => {
    const info: HTMLElement = <small/>
    const element: HTMLDivElement = (
        <div className={className}>
            <svg width="64" height="32" viewBox="0 0 24 12">
                <circle cx="4" cy="6" r="1.5"/>
                <circle cx="12" cy="6" r="3"/>
                <circle cx="20" cy="6" r="1.5"/>
            </svg>
            {info}
        </div>
    )
    lifecycle.own(working.catchupAndSubscribe(option => {
        info.textContent = option.unwrapOrElse("")
        element.classList.toggle("hidden", option.isEmpty())
    }))
    return element
}
