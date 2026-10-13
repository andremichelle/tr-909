import {Key} from "@/control/keys"

export namespace LightClasses {
    export const apply = (element: Element, key: Key): void => {
        const light = key.light()
        const classList = element.classList
        classList.toggle("light-on", light === "on")
        classList.toggle("light-blink", light === "blink")
        classList.toggle("light-flash", light === "flash")
        classList.toggle("pressed", key.pressed)
        classList.toggle("highlight", key.highlighted)
    }
}
