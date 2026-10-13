import css from "./Scales.sass?inline"
import {Lifecycle, ObservableValue} from "@opendaw/lib-std"
import {Html} from "@opendaw/lib-dom"
import {createElement} from "@opendaw/lib-jsx"
import {ScaleIndex} from "@/audio/memory"

const className = Html.adoptStyleSheet(css, "Scales")

const Note8 = "M418.39 231.34c14.32 21.136 21.682 46.728 40.135 64.982 21.135 27.835 48.146 50.891 69.089 79.058 15.157 19.681 31.771 40.599 36.074 65.357 11.587 31.757 6.556 67.409-5.806 98.498-13.947 16.765-23.482-4.932-19.589-18.365.594-18.535.323-37.021-6.785-54.528-6.305-26.255-17.834-51.101-37.136-70.366-16.772-14.701-35.813-47.095-61.382-35.941-16.885 10.637-9.53 32.139-11.346 48.712-1.004 101.95-1.071 203.94-2.701 305.87-1.246 42.809-38.247 71.529-72.88 89.908-30.854 18.567-67.795 28.966-103.61 20.691-33.304-3.417-67.756-27.73-68.454-63.704-2.22-41.711 27.904-80.552 64.988-97.024 36.404-20.749 82.429-25.246 121.63-10.331 19.156 6.055 24.483-11.721 26.874-28.819 2.212-129.77 3.983-259.54 4.435-389.33.366-12.973 21.496-16.139 26.461-4.66z"
const Note4 = "M418.39 231.34c5.307 163.8 3.01 316.18.553 483.27-1.246 42.809-38.247 71.529-72.88 89.908-30.854 18.567-67.795 28.966-103.61 20.691-33.304-3.417-67.756-27.73-68.454-63.704-2.22-41.711 27.904-80.552 64.988-97.024 36.404-20.749 82.43-25.246 121.63-10.331 19.156 6.055 24.483-11.721 26.874-28.819 2.213-129.77 3.983-259.54 4.436-389.33.366-12.973 26.294-17.166 26.46-4.66z"

type Construct = {
    lifecycle: Lifecycle
    scaleIndex: ObservableValue<ScaleIndex>
    style?: Partial<CSSStyleDeclaration>
}

export const Scales = ({lifecycle, scaleIndex, style}: Construct) => {
    const note = (id: string, x: number, y: number) => <use href={`#${id}`} x={x} y={y} width="11" height="14"/>
    const rect = (x: number, y: number, width: number) => <rect x={x} y={y} width={width} height="14" rx="1" ry="1"/>
    const indicator: SVGUseElement = <use href="#led-on" x="0" y="48" filter="url(#blur-led)"/>
    const svg: SVGSVGElement = (
        <svg classList={className} viewBox="0 0 920 80" style={style}>
            <defs>
                <filter id="blur-led">
                    <feGaussianBlur stdDeviation="1"/>
                </filter>
                <symbol id="note-8" width="11" height="14" viewBox="0 0 744.09 1052.4">
                    <path fill="#d9d5d0" d={Note8}/>
                </symbol>
                <symbol id="note-4" width="11" height="14" viewBox="0 0 744.09 1052.4">
                    <path fill="#d9d5d0" d={Note4}/>
                </symbol>
                <symbol id="notes-6-16">
                    {note("note-8", 32, 0)}
                    {note("note-8", 146, 0)}
                    {note("note-8", 260, 0)}
                    <path d="M18 6.5L26 1.5H334L342 6.5" stroke="#d9d5d0" fill="none"/>
                </symbol>
                <symbol id="notes-3-8">
                    {note("note-8", 32, 0)}
                    {note("note-8", 89, 0)}
                    {note("note-8", 146, 0)}
                    <path d="M18 6.5L26 1.5H164L172 6.5" stroke="#d9d5d0" fill="none"/>
                </symbol>
                <symbol id="notes-1-16">
                    {note("note-4", 32, 0)}
                    {note("note-4", 260, 0)}
                    {note("note-4", 488, 0)}
                    {note("note-4", 716, 0)}
                </symbol>
                <symbol id="notes-1-32">
                    {note("note-4", 32, 0)}
                    {note("note-4", 488, 0)}
                </symbol>
                <symbol id="led-on">
                    <circle cx="8" cy="6" r="4" fill="#ee3b2e"/>
                    <circle cx="8" cy="8" r="0.75" fill="#f8aaa4"/>
                    <circle cx="8" cy="4" r="0.75" fill="white"/>
                </symbol>
            </defs>
            <g>
                {rect(0, 0, 350)}
                {rect(352, 0, 340)}
                {rect(694, 0, 226)}
                <use href="#notes-6-16" x="0" y="1"/>
                <use href="#notes-6-16" x="342" y="1"/>
                <use href="#notes-6-16" x="684" y="1"/>
            </g>
            <g>
                {rect(0, 16, 179)}
                {rect(181, 16, 169)}
                {rect(352, 16, 169)}
                {rect(523, 16, 169)}
                {rect(694, 16, 226)}
                {[0, 171, 342, 513, 684, 855].map(x => <use href="#notes-3-8" x={x} y="17"/>)}
            </g>
            <g>
                {rect(0, 32, 464)}
                {rect(466, 32, 454)}
                <use href="#notes-1-32" x="0" y="32"/>
            </g>
            <g>
                {rect(0, 48, 236)}
                {rect(238, 48, 226)}
                {rect(466, 48, 226)}
                {rect(694, 48, 226)}
                <use href="#notes-1-16" x="0" y="48"/>
            </g>
            <g>
                {[6, 22, 38, 54].map(cy => <circle cx="8" cy={cy} r="4" fill="#1c0809"/>)}
                {indicator}
            </g>
        </svg>
    )
    lifecycle.own(scaleIndex.catchupAndSubscribe(owner => indicator.setAttribute("y", String(owner.getValue() * 16))))
    return svg
}
