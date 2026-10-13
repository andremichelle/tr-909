import css from "./LedDisplay.sass?inline"
import {Arrays, int, Lifecycle, ObservableValue} from "@opendaw/lib-std"
import {Html} from "@opendaw/lib-dom"
import {createElement} from "@opendaw/lib-jsx"
import {DisplayValue} from "@/control/display"

const className = Html.adoptStyleSheet(css, "LedDisplay")

const SegmentPaths: ReadonlyArray<string> = [
    "M10.46 3.07 13.97 0h18.42l2.64 3.07-3.5 3.07H13.1l-2.64-3.07z",
    "m35.58 3.72 2.64 3.07-2.59 18.42-3.5 3.07-2.64-3.07 2.59-18.42 3.5-3.07z",
    "m31.95 29.58 2.64 3.07L32 51.07l-3.5 3.07-2.64-3.07 2.59-18.42 3.5-3.07z",
    "m27.76 54.79-3.5 3.07H5.83l-2.64-3.07 3.51-3.07h18.42l2.64 3.07z",
    "M2.64 54.14 0 51.07l2.59-18.42 3.5-3.07 2.64 3.07-2.59 18.42-3.5 3.07z",
    "m6.27 28.28-2.64-3.07L6.22 6.79l3.51-3.07 2.63 3.07-2.58 18.42-3.51 3.07z",
    "m6.83 28.93 3.5-3.07h18.43l2.63 3.07-3.5 3.07H9.47l-2.64-3.07z"
]

enum Segment {TT = 1 << 0, TR = 1 << 1, BR = 1 << 2, BB = 1 << 3, BL = 1 << 4, TL = 1 << 5, CR = 1 << 6}

const Digits: ReadonlyArray<int> = [
    Segment.TT | Segment.BB | Segment.BL | Segment.TL | Segment.BR | Segment.TR,
    Segment.TR | Segment.BR,
    Segment.TT | Segment.BB | Segment.CR | Segment.TR | Segment.BL,
    Segment.TT | Segment.BB | Segment.CR | Segment.TR | Segment.BR,
    Segment.CR | Segment.TR | Segment.TL | Segment.BR,
    Segment.TT | Segment.BB | Segment.CR | Segment.TL | Segment.BR,
    Segment.TT | Segment.BB | Segment.CR | Segment.TL | Segment.BR | Segment.BL,
    Segment.TR | Segment.BR | Segment.TT,
    Segment.TT | Segment.BB | Segment.CR | Segment.TL | Segment.BR | Segment.BL | Segment.TR,
    Segment.TT | Segment.BB | Segment.CR | Segment.TL | Segment.BR | Segment.TR
]

const LetterE = Segment.TT | Segment.BB | Segment.CR | Segment.TL | Segment.BL
const LetterR = Segment.TT | Segment.CR | Segment.TL | Segment.BR | Segment.BL | Segment.TR

const toBits = (value: DisplayValue): ReadonlyArray<int> => {
    if (value === "none") {return [0, 0, 0]}
    if (value === "error") {return [LetterE, LetterR, LetterR]}
    return Math.floor(value).toString(10).padStart(3, " ").slice(-3).split("")
        .map(char => char === " " || char === "-" ? 0 : Digits[parseInt(char, 10)])
}

type Construct = {
    lifecycle: Lifecycle
    value: ObservableValue<DisplayValue>
}

export const LedDisplay = ({lifecycle, value}: Construct) => {
    const digits: ReadonlyArray<ReadonlyArray<SVGPathElement | SVGCircleElement>> = Arrays.create(() => [
        ...SegmentPaths.map(path => <path classList="digit" d={path}/>),
        <circle classList="digit" cx="35.11" cy="54.75" r="3.11"/>
    ], 3)
    const svg: SVGSVGElement = (
        <svg classList={className} viewBox="0 0 142 70" width="97" height="48">
            <defs>
                <filter id="blur-digits">
                    <feGaussianBlur stdDeviation="1"/>
                </filter>
            </defs>
            <rect x="0" y="0" width="142" height="70" fill="#601010"/>
            <g filter="url(#blur-digits)">
                {digits.map((segments, index) => <g transform={`translate(${6 + index * 46}, 6)`}>{segments}</g>)}
            </g>
        </svg>
    )
    lifecycle.own(value.catchupAndSubscribe(owner => toBits(owner.getValue()).forEach((bits, index) =>
        digits[index].forEach((segment, bit) => segment.classList.toggle("active", (bits & (1 << bit)) !== 0)))))
    return svg
}
