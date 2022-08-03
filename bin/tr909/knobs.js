import { Events, Terminator } from "../lib/common.js";
export class Knob {
    constructor(element, parameter) {
        this.element = element;
        this.parameter = parameter;
        this.terminator = new Terminator();
        console.assert(element !== null);
        this.parameter.addObserver(() => {
            const degree = -150.0 + parameter.getUnipolar() * 300.0;
            element.style.setProperty('--angle', `${degree}deg`);
        }, true);
        this.attachEvents();
    }
    terminate() {
        this.terminator.terminate();
    }
    attachEvents() {
        this.terminator.with(Events.bindEventListener(this.element, 'pointerdown', (event) => {
            this.element.setPointerCapture(event.pointerId);
            let startValue = this.parameter.getUnipolar();
            let startPointer = event.clientY;
            const moving = new Terminator();
            moving.with(Events.bindEventListener(this.element, 'pointermove', (event) => this.parameter.setUnipolar(startValue - (event.clientY - startPointer) * 0.01)));
            moving.with(Events.bindEventListener(this.element, 'pointerup', () => moving.terminate()));
        }));
    }
}
//# sourceMappingURL=knobs.js.map