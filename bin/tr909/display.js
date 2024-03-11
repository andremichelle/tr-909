import { ObservableValueImpl, TerminableVoid, Terminator } from "../lib/common.js";
var Segment;
(function (Segment) {
    Segment[Segment["TT"] = 1] = "TT";
    Segment[Segment["TR"] = 2] = "TR";
    Segment[Segment["BR"] = 4] = "BR";
    Segment[Segment["BB"] = 8] = "BB";
    Segment[Segment["BL"] = 16] = "BL";
    Segment[Segment["TL"] = 32] = "TL";
    Segment[Segment["CR"] = 64] = "CR";
})(Segment || (Segment = {}));
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
];
const Chars = new Map([
    ['E', Segment.TT | Segment.BB | Segment.CR | Segment.TL | Segment.BL],
    ['R', Segment.TT | Segment.CR | Segment.TL | Segment.BR | Segment.BL | Segment.TR],
]);
class Digit {
    constructor(segments) {
        this.segments = segments;
    }
    clear() {
        this.segments.forEach(s => s.classList.toggle('active', false));
    }
    showDigit(value) {
        console.assert(value >= 0 && value <= 9);
        this.showBits(Digits[value]);
    }
    showLetter(char) {
        this.showBits(Chars.get(char));
    }
    showBits(bits) {
        for (let index = 0; index < this.segments.length; index++) {
            this.segments[index].classList.toggle('active', (1 << index & bits) !== 0);
        }
    }
}
class DisplayObservableValueProvider {
    constructor(observableValue, debugName, mapping = DisplayObservableValueProvider.Identity) {
        this.observableValue = observableValue;
        this.debugName = debugName;
        this.mapping = mapping;
        this.terminator = new Terminator();
    }
    addObserver(observer, notify) {
        this.terminator.with(this.observableValue.addObserver(value => observer(this.mapping(value)), notify));
        return this.terminator;
    }
    displayValue() {
        return this.mapping(this.observableValue.get());
    }
    terminate() {
        this.terminator.terminate();
    }
}
DisplayObservableValueProvider.Identity = (x) => x;
DisplayObservableValueProvider.PlusOne = (x) => x + 1;
export { DisplayObservableValueProvider };
export class Display {
    constructor(svg) {
        this.providerStack = [];
        this.digits = Array.from(svg.querySelectorAll('g g'))
            .map(g => new Digit(Array.from(g.querySelectorAll('path'))));
        window.addEventListener('error', event => this.show(new Error(event.message)));
        window.addEventListener('unhandledrejection', event => this.show(new Error(event.reason)));
    }
    push(provider) {
        console.debug(`push(${provider.debugName})`);
        const terminator = new Terminator();
        terminator.with(provider.addObserver(value => this.show(value), true));
        this.providerStack.forEach(pair => pair[1].terminate());
        this.providerStack.push([provider, terminator]);
        return {
            terminate: () => {
                const index = this.providerStack.findIndex(([p]) => p === provider);
                console.assert(index !== -1);
                const remove = this.providerStack.splice(index, 1)[0];
                remove[1].terminate();
                console.debug(`pop(${remove[0].debugName})`);
                if (this.providerStack.length === 0) {
                    this.show('none');
                }
                else {
                    const last = this.providerStack[this.providerStack.length - 1];
                    last[1].with(last[0].addObserver(value => this.show(value), true));
                    console.debug(`top(${last[0].debugName})`);
                }
            }
        };
    }
    terminate() {
        this.providerStack
            .splice(0, this.providerStack.length)
            .forEach(pair => pair[1].terminate());
    }
    show(value) {
        if (value === 'none') {
            this.digits.forEach(digit => digit.clear());
        }
        else if (value instanceof Error) {
            this.digits[0].showLetter('E');
            this.digits[1].showLetter('R');
            this.digits[2].showLetter('R');
        }
        else {
            value = Math.floor(value);
            value
                .toString(10)
                .padStart(3, ' ')
                .split('')
                .forEach((digit, index) => {
                const integer = parseInt(digit);
                if (isNaN(integer)) {
                    this.digits[index].clear();
                }
                else {
                    this.digits[index].showDigit(integer);
                }
            });
        }
    }
}
export class DigitInput {
    constructor(display) {
        this.display = display;
        this.isUserInputting = false;
        this.userInputSubscription = TerminableVoid;
        this.digits = new Uint8Array(3);
        this.value = new ObservableValueImpl(0);
        this.value.addObserver((integer) => {
            this.digits[0] = Math.floor(integer / 100) % 10;
            this.digits[1] = Math.floor(integer / 10) % 10;
            this.digits[2] = integer % 10;
        }, false);
        this.userInputDisplayProvider = new DisplayObservableValueProvider(this.value, 'value input');
    }
    start() {
        if (!this.isUserInputting) {
            console.debug('start', this);
            this.isUserInputting = true;
            this.digits.fill(0);
            this.userInputSubscription = this.display.push(this.userInputDisplayProvider);
        }
    }
    stop() {
        if (this.isUserInputting) {
            console.debug('stop', this);
            this.isUserInputting = false;
            this.userInputSubscription.terminate();
            this.userInputSubscription = TerminableVoid;
        }
    }
    push(digit) {
        this.digits[0] = this.digits[1];
        this.digits[1] = this.digits[2];
        this.digits[2] = digit;
        this.value.set(this.digits[0] * 100 +
            this.digits[1] * 10 +
            this.digits[2]);
    }
    setValue(value) {
        this.value.set(value);
    }
    getValue() {
        return this.value.get();
    }
    terminate() {
        this.value.terminate();
    }
}
//# sourceMappingURL=display.js.map