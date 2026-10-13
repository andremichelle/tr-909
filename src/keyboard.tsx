import "./style.sass"
import {Events} from "@opendaw/lib-dom"
import {createElement, replaceChildren} from "@opendaw/lib-jsx"
import {KeyboardLayout} from "@/ui/KeyboardLayout"

const root: HTMLElement = <KeyboardLayout/>
replaceChildren(document.body, root)
const resize = () => {
    const body = document.body
    const padding = Math.min(body.clientWidth, body.clientHeight) * 0.2
    const scale = Math.min((body.clientWidth - padding) / 534, (body.clientHeight - padding) / 192)
    root.style.setProperty("--scale", `${scale}`)
}
Events.subscribe(window, "resize", resize)
resize()
