const applyOptional = (element, attributes) => {
    Object.entries(attributes)
        .forEach(([name, value]) => {
        if (name === 'textContent') {
            element.textContent = value.toString();
        }
        else if (name === 'class') {
            if (typeof value === 'string') {
                value.split(" ").forEach(token => element.classList.add(token.trim()));
            }
        }
        else if (name === 'style') {
            if (typeof value === 'string') {
                value.split(";").filter(s => s.length > 0).forEach(token => {
                    const style = token.split(":");
                    element.style.setProperty(style[0].trim(), style[1].trim());
                });
            }
        }
        else {
            element.setAttribute(name, value.toString());
        }
    });
};
export class HTML {
    static create(tagName, attributes) {
        const element = document.createElement(tagName);
        if (attributes !== undefined) {
            applyOptional(element, attributes);
        }
        return element;
    }
    static query(selectors, parent = document) {
        const element = parent.querySelector(selectors);
        if (selectors === null) {
            throw new Error(`'${selectors}' not found.`);
        }
        return element;
    }
    static queryAll(selectors, parent = document) {
        return Array.from(parent.querySelectorAll(selectors));
    }
}
export class SVG {
    static create(tagName, attributes) {
        const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
        if (attributes !== undefined) {
            applyOptional(element, attributes);
        }
        return element;
    }
    static createUse(href, width, height, attributes) {
        const svg = SVG.create("svg", Object.assign({ xlink: "http://www.w3.org/1999/xlink", width, height }, attributes));
        svg.appendChild(SVG.create("use", { href }));
        return svg;
    }
    static createLine(x1, y1, x2, y2, attributes) {
        const line = SVG.create("line", attributes);
        line.x1.baseVal.value = x1;
        line.y1.baseVal.value = y1;
        line.x2.baseVal.value = x2;
        line.y2.baseVal.value = y2;
        return line;
    }
    static createRect(x, y, width, height, rx = 0.0, ry = 0.0, attributes) {
        const rect = SVG.create("rect", attributes);
        rect.x.baseVal.value = x;
        rect.y.baseVal.value = y;
        rect.width.baseVal.value = width;
        rect.height.baseVal.value = height;
        rect.rx.baseVal.value = rx;
        rect.ry.baseVal.value = ry;
        return rect;
    }
    static createCircle(x, y, radius, attributes) {
        const circle = SVG.create("circle", attributes);
        circle.cx.baseVal.value = x;
        circle.cy.baseVal.value = y;
        circle.r.baseVal.value = radius;
        return circle;
    }
    static createPath(attributes) {
        return SVG.create("path", attributes);
    }
    static compilePathString(dx = 0.0, dy = 0.0) {
        let d = '';
        return new class {
            moveTo(x, y) {
                d += `M${(x + dx).toFixed(3)} ${(y + dy).toFixed(3)}`;
                return this;
            }
            lineTo(x, y) {
                d += `L${(x + dx).toFixed(3)} ${(y + dy).toFixed(3)}`;
                return this;
            }
            quadraticCurve(x1, y1, x, y) {
                d += `Q${(x1 + dx).toFixed(3)} ${(y1 + dy).toFixed(3)} ${(x + dx).toFixed(3)} ${(y + dy).toFixed(3)}`;
                return this;
            }
            cubicCurve(x1, y1, x2, y2, x, y) {
                d += `Q${(x1 + dx).toFixed(3)} ${(y1 + dy).toFixed(3)} ${(x2 + dx).toFixed(3)} ${(y2 + dx).toFixed(3)} ${(x + dx).toFixed(3)} ${(y + dy).toFixed(3)}`;
                return this;
            }
            arc(rx, ry, deg, largeArc, sweep, x, y) {
                d += `A${rx} ${ry} ${deg} ${largeArc ? 1 : 0} ${sweep ? 1 : 0} ${(x + dx).toFixed(3)} ${(y + dy).toFixed(3)}`;
                return this;
            }
            circleSegment(cx, cy, radius, a0, a1) {
                const x0 = cx + Math.cos(a0) * radius;
                const y0 = cy + Math.sin(a0) * radius;
                const x1 = cx + Math.cos(a1) * radius;
                const y1 = cy + Math.sin(a1) * radius;
                let range = a1 - a0;
                while (range < 0.0)
                    range += Math.PI * 2.0;
                return this.moveTo(x0, y0).arc(radius, radius, 0, range > Math.PI, true, x1, y1);
            }
            for(from, to, step, build) {
                for (let phase = from; phase < to; phase += step) {
                    build(this, phase);
                }
                return this;
            }
            close() {
                d += "Z";
                return this;
            }
            build() {
                return d;
            }
        };
    }
    static func(fn, w, h, step = 1) {
        const centerY = h * 0.5;
        const scaleX = 1.0 / w;
        const scaleY = (1.0 - h) * 0.5;
        const fy = (x) => fn(x) * scaleY + centerY;
        return SVG.compilePathString()
            .moveTo(0, fy(0))
            .for(step, w + step, step, (builder, x) => builder.lineTo(x, fy(x * scaleX)))
            .build();
    }
}
export class RenderRequest {
    constructor(render) {
        this.render = render;
        this.requested = false;
        this.fire = () => {
            this.requested = false;
            this.render();
        };
    }
    request() {
        if (this.requested) {
            return;
        }
        this.requested = true;
        requestAnimationFrame(this.fire);
    }
}
//# sourceMappingURL=dom.js.map