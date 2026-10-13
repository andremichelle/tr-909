import css from "./KeyboardLayout.sass?inline"
import {int} from "@opendaw/lib-std"
import {Html} from "@opendaw/lib-dom"
import {createElement} from "@opendaw/lib-jsx"

const className = Html.adoptStyleSheet(css, "KeyboardLayout")

type KeyCap = { width: int, char: string, func?: string, classes?: string }

const main = (char: string, step: int): KeyCap => ({width: 32, char, func: `Step ${step}`, classes: "group-main"})
const plain = (char: string, width: int = 32): KeyCap => ({width, char})

export const QWERTY: ReadonlyArray<ReadonlyArray<KeyCap>> = [
    [
        plain("~"), main("1", 1), main("2", 2), main("3", 3), main("4", 4), main("5", 5), main("6", 6),
        main("7", 7), main("8", 8), main("9", 9), main("0", 10), main("-", 11), main("=", 12),
        {width: 50, char: "delete", classes: "align-bottom align-right"}
    ],
    [
        plain("", 50),
        {width: 32, char: "Q", func: "Track 1", classes: "group-track"},
        {width: 32, char: "W", func: "Track 2", classes: "group-track"},
        {width: 32, char: "E", func: "Track 3", classes: "group-track"},
        {width: 32, char: "R", func: "Track 4", classes: "group-track"},
        {width: 32, char: "T", func: "Pattern 1", classes: "group-pattern"},
        {width: 32, char: "Y", func: "Pattern 2", classes: "group-pattern"},
        {width: 32, char: "U", func: "Pattern 3", classes: "group-pattern"},
        {width: 32, char: "I", func: "Ext\nInst", classes: "group-pattern"},
        plain("O"), main("P", 13), main("[", 14), main("]", 15), main("\\", 16)
    ],
    [
        plain("", 59),
        {width: 32, char: "A", func: "Last Step", classes: "group-func"},
        {width: 32, char: "S", func: "Scale", classes: "group-func"},
        {width: 32, char: "D", func: "Shuffle\n/Flam", classes: "group-func"},
        {width: 32, char: "F", func: "Clear", classes: "group-func"},
        {width: 32, char: "G", func: "Instrument\nSelect", classes: "group-func"},
        {width: 32, char: "H", func: "Tempo\nStep", classes: "group-other"},
        {width: 32, char: "J", func: "Back\nTap", classes: "group-other"},
        {width: 32, char: "K", func: "Fwd\nBank 1", classes: "group-other"},
        {width: 32, char: "L", func: "Available\nBank 2", classes: "group-other"},
        {width: 32, char: ";", func: "Cycle\nGuide", classes: "group-other"},
        {width: 32, char: "'", func: "Tape\nSync", classes: "group-other"},
        {width: 59, char: "return", func: "Enter", classes: "align-bottom align-right group-meta"}
    ],
    [
        {width: 77, char: "shift", func: "Shift", classes: "align-bottom group-meta"},
        plain("Z"), plain("X"), plain("C"), plain("V"), plain("B"),
        plain("N"), plain("M"), plain(","), plain("."), plain("/"),
        {width: 77, char: "shift", func: "Shift", classes: "align-bottom align-right group-meta"}
    ],
    [
        plain(""), plain(""), plain(""), plain("", 41),
        {width: 176, char: "", func: "Stop/Cont", classes: "group-meta"},
        plain("", 41), plain(""), plain(""), plain(""), plain("")
    ]
]

export const KeyboardLayout = () => (
    <div className={className}>
        {QWERTY.map(row => (
            <div className="row">
                {row.map(({width, char, func, classes}) => (
                    <div className={Html.buildClassList("key", classes)}
                         style={{width: `${width}px`}}
                         data-char={char}
                         data-func={func ?? ""}/>
                ))}
            </div>
        ))}
    </div>
)
