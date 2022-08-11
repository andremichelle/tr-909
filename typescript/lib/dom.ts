import { Events, Option, Options, Terminable, Terminator } from "./common.js"

type Attributes = {
    [name in 'textContent' | 'class' | string]: number | string | boolean
}

const applyOptional = (element: HTMLElement, attributes: Attributes): void => {
    Object.entries(attributes)
        .forEach(([name, value]) => {
            if (name === 'textContent') {
                element.textContent = value.toString()
            } else if (name === 'class') {
                if (typeof value === 'string') {
                    value.split(" ").forEach(token => element.classList.add(token.trim()))
                }
            } else if (name === 'style') {
                if (typeof value === 'string') {
                    value.split(";").filter(s => s.length > 0).forEach(token => {
                        const style = token.split(":")
                        element.style.setProperty(style[0].trim(), style[1].trim())
                    })
                }
            } else {
                element.setAttribute(name, value.toString())
            }
        })
}

export class HTML {
    static create<K extends keyof HTMLElementTagNameMap>(tagName: K, attributes?: Attributes): HTMLElementTagNameMap[K] {
        const element = document.createElement(tagName)
        if (attributes !== undefined) {
            applyOptional(element, attributes)
        }
        return element
    }

    static query<E extends Element>(selectors: string, parent: ParentNode = document): E {
        const element = parent.querySelector(selectors)
        if (selectors === null) {
            throw new Error(`'${selectors}' not found.`)
        }
        return element as E
    }

    static queryAll<E extends Element>(selectors: string, parent: ParentNode = document): E[] {
        return Array.from(parent.querySelectorAll(selectors))
    }
}

export type Exec = () => void

export class AnimationFrame {
    static add(exec: Exec): Terminable {
        if (AnimationFrame.list.length === 0) {
            AnimationFrame.start()
        }
        AnimationFrame.list.push(exec)
        return {
            terminate: () => {
                const index = AnimationFrame.list.indexOf(exec)
                console.assert(-1 < index)
                AnimationFrame.list.splice(index, 1)
            }
        }
    }

    static init(): void {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.debug('AnimationFrame stop (will hide)', Date.now())
            } else {
                AnimationFrame.start()
            }
        })
    }

    static start(): void {
        const exe = () => {
            if (AnimationFrame.list.length > 0) {
                AnimationFrame.list.forEach(e => e())
                if (document.hidden) {
                    console.debug('AnimationFrame stop (hidden)')
                } else {
                    window.requestAnimationFrame(exe)
                }
            } else {
                console.debug('AnimationFrame stop (no callbacks)')
            }
        }
        console.debug('AnimationFrame start', Date.now())
        window.requestAnimationFrame(exe)
    }

    private static list: Exec[] = []
}

export interface SVGPathBuilder {
    moveTo(x: number, y: number): this

    lineTo(x: number, y: number): this

    quadraticCurve(x1: number, y1: number, x: number, y: number): this

    cubicCurve(x1: number, y1: number, x2: number, y2: number, x: number, y: number): this

    arc(rx: number, ry: number, deg: number, largeArc: boolean, sweep: boolean, x: number, y: number): this

    circleSegment(cx: number, cy: number, radius: number, a0: number, a1: number): this

    for(from: number, to: number, step: number, build: (builder: this, x: number) => void): this

    close(): this

    build(): string
}

export class SVG {
    static create<K extends keyof SVGElementTagNameMap>(tagName: K, attributes?: Attributes): SVGElementTagNameMap[K] & HTMLElement {
        const element = document.createElementNS("http://www.w3.org/2000/svg", tagName)
        if (attributes !== undefined) {
            applyOptional(element as unknown as HTMLElement, attributes)
        }
        return element as unknown as SVGElementTagNameMap[K] & HTMLElement
    }

    static createUse(href: string, width: number, height: number, attributes?: Attributes): SVGSVGElement & HTMLElement {
        const svg = SVG.create("svg", { xlink: "http://www.w3.org/1999/xlink", width, height, ...attributes })
        svg.appendChild(SVG.create("use", { href }))
        return svg
    }

    static createLine(x1: number, y1: number, x2: number, y2: number, attributes?: Attributes): SVGLineElement & HTMLElement {
        const line: SVGLineElement & HTMLElement = SVG.create("line", attributes)
        line.x1.baseVal.value = x1
        line.y1.baseVal.value = y1
        line.x2.baseVal.value = x2
        line.y2.baseVal.value = y2
        return line
    }

    static createRect(x: number, y: number, width: number, height: number, rx: number = 0.0, ry: number = 0.0, attributes?: Attributes): SVGRectElement & HTMLElement {
        const rect: SVGRectElement & HTMLElement = SVG.create("rect", attributes)
        rect.x.baseVal.value = x
        rect.y.baseVal.value = y
        rect.width.baseVal.value = width
        rect.height.baseVal.value = height
        rect.rx.baseVal.value = rx
        rect.ry.baseVal.value = ry
        return rect
    }

    static createCircle(x: number, y: number, radius: number, attributes?: Attributes): SVGCircleElement & HTMLElement {
        const circle: SVGCircleElement & HTMLElement = SVG.create("circle", attributes)
        circle.cx.baseVal.value = x
        circle.cy.baseVal.value = y
        circle.r.baseVal.value = radius
        return circle
    }

    static createPath(attributes?: Attributes): SVGPathElement & HTMLElement {
        return SVG.create("path", attributes)
    }

    static compilePathString(dx: number = 0.0, dy: number = 0.0): SVGPathBuilder {
        let d = ''
        return new class implements SVGPathBuilder {
            moveTo(x: number, y: number): this {
                d += `M${(x + dx).toFixed(3)} ${(y + dy).toFixed(3)}`
                return this
            }

            lineTo(x: number, y: number): this {
                d += `L${(x + dx).toFixed(3)} ${(y + dy).toFixed(3)}`
                return this
            }

            quadraticCurve(x1: number, y1: number, x: number, y: number): this {
                d += `Q${(x1 + dx).toFixed(3)} ${(y1 + dy).toFixed(3)} ${(x + dx).toFixed(3)} ${(y + dy).toFixed(3)}`
                return this
            }

            cubicCurve(x1: number, y1: number, x2: number, y2: number, x: number, y: number): this {
                d += `Q${(x1 + dx).toFixed(3)} ${(y1 + dy).toFixed(3)} ${(x2 + dx).toFixed(3)} ${(y2 + dx).toFixed(3)} ${(x + dx).toFixed(3)} ${(y + dy).toFixed(3)}`
                return this
            }

            arc(rx: number, ry: number, deg: number, largeArc: boolean, sweep: boolean, x: number, y: number): this {
                d += `A${rx} ${ry} ${deg} ${largeArc ? 1 : 0} ${sweep ? 1 : 0} ${(x + dx).toFixed(3)} ${(y + dy).toFixed(3)}`
                return this
            }

            circleSegment(cx: number, cy: number, radius: number, a0: number, a1: number): this {
                const x0 = cx + Math.cos(a0) * radius
                const y0 = cy + Math.sin(a0) * radius
                const x1 = cx + Math.cos(a1) * radius
                const y1 = cy + Math.sin(a1) * radius
                let range = a1 - a0
                while (range < 0.0) range += Math.PI * 2.0
                return this.moveTo(x0, y0).arc(radius, radius, 0, range > Math.PI, true, x1, y1)
            }

            for(from: number, to: number, step: number, build: (builder: this, x: number) => void): this {
                for (let phase = from; phase < to; phase += step) {
                    build(this, phase)
                }
                return this
            }

            close(): this {
                d += "Z"
                return this
            }

            build(): string {
                return d
            }
        }
    }

    static func(fn: (x: number) => number, w: number, h: number, step: number = 1): string {
        const centerY = h * 0.5
        const scaleX = 1.0 / w
        const scaleY = (1.0 - h) * 0.5
        const fy = (x: number) => fn(x) * scaleY + centerY
        return SVG.compilePathString()
            .moveTo(0, fy(0))
            .for(step, w + step, step, (builder, x) => builder.lineTo(x, fy(x * scaleX)))
            .build()
    }
}

export class RenderRequest {
    private requested: boolean = false

    constructor(private readonly render: (() => void)) {
    }

    request(): void {
        if (this.requested) {
            return
        }
        this.requested = true
        requestAnimationFrame(this.fire)
    }

    private fire = () => {
        this.requested = false
        this.render()
    }
}