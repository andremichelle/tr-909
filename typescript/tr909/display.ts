import {Observable, ObservableValue, Observer, Terminable, Terminator} from "../lib/common.js"

enum Segment {
    TT = 1 << 0, TR = 1 << 1, BR = 1 << 2, BB = 1 << 3, BL = 1 << 4, TL = 1 << 5, CR = 1 << 6
}

const Digits = [
    Segment.TT | Segment.BB | Segment.BL | Segment.TL | Segment.BR | Segment.TR,
    Segment.TR | Segment.BR,
    Segment.TT | Segment.BB | Segment.CR | Segment.TR | Segment.BL,
    Segment.TT | Segment.BB | Segment.CR | Segment.TR | Segment.BR,
    Segment.CR | Segment.TR | Segment.TL | Segment.BR,
    Segment.TT | Segment.BB | Segment.CR | Segment.TL | Segment.BR,
    Segment.TT | Segment.BB | Segment.CR | Segment.TL | Segment.BR | Segment.BL,
    Segment.TR | Segment.BR | Segment.TT,
    Segment.TT | Segment.BB | Segment.CR | Segment.TL | Segment.BR | Segment.BL | Segment.TR,
    Segment.TT | Segment.BB | Segment.CR | Segment.TL | Segment.BR | Segment.TR,
]

const Chars: Map<string, number> = new Map<string, number>([
    ['E', Segment.TT | Segment.BB | Segment.CR | Segment.TL | Segment.BL],
    ['R', Segment.TT | Segment.CR | Segment.TL | Segment.BR | Segment.BL | Segment.TR],
])

class Digit {
    constructor(private readonly segments: SVGPathElement[]) {
    }

    clear(): void {
        this.segments.forEach(s => s.classList.toggle('active', false))
    }

    showDigit(value: number): void {
        console.assert(value >= 0 && value <= 9)
        this.showBits(Digits[value])
    }

    showLetter(char: 'E' | 'R'): void {
        this.showBits(Chars.get(char)!)
    }

    private showBits(bits: number) {
        for (let index = 0; index < this.segments.length; index++) {
            this.segments[index].classList.toggle('active', (1 << index & bits) !== 0)
        }
    }
}

export type DisplayValue = number | 'none' | Error

export interface DisplayValueProvider extends Observable<DisplayValue> {
    displayValue(): DisplayValue
}

export class DisplayObservableValueProvider implements DisplayValueProvider {
    static Identity = (x: number): number => x
    static PlusOne = (x: number): number => x + 1

    readonly terminator: Terminator = new Terminator()

    constructor(readonly observableValue: ObservableValue<number>,
                readonly mapping: (value: number) => number = DisplayObservableValueProvider.Identity) {
    }

    addObserver(observer: Observer<DisplayValue>, notify: boolean): Terminable {
        this.terminator.with(this.observableValue.addObserver(value => observer(this.mapping(value)), notify))
        return this.terminator
    }

    displayValue(): DisplayValue {
        return this.mapping(this.observableValue.get())
    }

    terminate(): void {
        this.terminator.terminate()
    }
}

export class Display implements Terminable {
    private readonly providerStack: [DisplayValueProvider, Terminator][] = []
    private readonly digits: Digit[]

    constructor(svg: SVGSVGElement) {
        this.digits = Array.from(svg.querySelectorAll('g g'))
            .map(g => new Digit(Array.from(g.querySelectorAll('path'))))

        // No explicit error handling. We just want to inform the user that something went wrong.
        window.addEventListener('error', event => this.show(new Error(event.message)))
        window.addEventListener('unhandledrejection', event => this.show(new Error(event.reason)))
    }

    pushProvider(provider: DisplayValueProvider): Terminable {
        const terminator = new Terminator()
        terminator.with(provider.addObserver(value => this.show(value), true))
        this.providerStack.forEach(pair => pair[1].terminate())
        this.providerStack.push([provider, terminator])
        return {
            terminate: () => {
                const index = this.providerStack.findIndex(([p]) => p === provider)
                console.assert(index !== -1)
                const remove: [DisplayValueProvider, Terminator] = this.providerStack.splice(index, 1)[0]
                remove[1].terminate()

                if (this.providerStack.length === 0) {
                    this.show('none')
                } else {
                    const last: [DisplayValueProvider, Terminator] = this.providerStack[this.providerStack.length - 1]
                    last[1].with(last[0].addObserver(value => this.show(value), true))
                }
            }
        }
    }

    terminate(): void {
        this.providerStack
            .splice(0, this.providerStack.length)
            .forEach(pair => pair[1].terminate())
    }

    private show(value: DisplayValue): void {
        if (value === 'none') {
            this.digits.forEach(digit => digit.clear())
        } else if (value instanceof Error) {
            this.digits[0].showLetter('E')
            this.digits[1].showLetter('R')
            this.digits[2].showLetter('R')
        } else {
            value = Math.floor(value)
            value
                .toString(10)
                .padStart(3, ' ')
                .split('')
                .forEach((digit: string, index: number) => {
                    const integer = parseInt(digit)
                    if (isNaN(integer)) {
                        this.digits[index].clear()
                    } else {
                        this.digits[index].showDigit(integer)
                    }
                })
        }
    }
}