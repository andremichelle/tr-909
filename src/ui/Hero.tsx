import css from "./Hero.sass?inline"
import {Html} from "@opendaw/lib-dom"
import {createElement} from "@opendaw/lib-jsx"

const className = Html.adoptStyleSheet(css, "Hero")

type Construct = {
    manualUrl: string
}

export const Hero = ({manualUrl}: Construct) => {
    const element: HTMLDivElement = (
        <div className={className}>
            <div>
                <h1>Welcome to the 909 Kitchen</h1>
                <h2>A web-replica of an iconic drum-machine</h2>
            </div>
            <p>
                The Roland TR-909 is one of the most iconic drum-machines released 1984. It laid down the foundation of
                house and techno music in the late 80s and it still the most recognisable drum-machine to this date.
            </p>
            <p>
                This project has no affiliation with the original manufacturer <a href="https://www.roland.com/"
                                                                                  target="roland">Roland</a>.
                It is meant as an admiration to the original machine and a tribute to its original sounds.
                This project does not follow any commercial interests.
            </p>
            <p>
                This machine is quite cumbersome to operate. It is highly recommended to read
                the <a href={manualUrl} target="manual">Manual</a> and keep
                the <a href="./keyboard.html" target="keyboard">Keyboard</a> map open.
            </p>
            <button onclick={() => element.remove()}>START</button>
        </div>
    )
    return element
}
