import { SVG } from './dom.js';
export class AnalogMeterBuilder {
    constructor(width, height) {
        this.svg = SVG.create('svg', { xlink: "http://www.w3.org/1999/xlink", fill: 'none', width, height });
        this.svg.appendChild(SVG.createLine(0, height / 2, width, height / 2, { stroke: 'white' }));
        const radius = height * 3;
        this.svg.appendChild(SVG.createCircle(width / 2, height / 2 + radius, radius, { stroke: '#5A3119' }));
    }
    build() {
        return new AnalogMeter(this.svg);
    }
}
export class AnalogMeter {
    constructor(svg) {
        this.svg = svg;
    }
    static builder(width, height) {
        return new AnalogMeterBuilder(width, height);
    }
}
//# sourceMappingURL=analog-meter.js.map