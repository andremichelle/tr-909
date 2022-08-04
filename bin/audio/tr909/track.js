import { ObservableImpl } from "../../lib/common.js";
export class Track {
    constructor() {
        this.observable = new ObservableImpl();
        this.sequence = [];
    }
    addObserver(observer, notify) {
        if (notify)
            observer();
        return this.observable.addObserver(observer);
    }
    deserialize(format) {
        this.sequence.splice(0, this.sequence.length, ...format.sequence);
        return this;
    }
    serialize() {
        return { sequence: this.sequence };
    }
    writeLocation(location, index = Number.MAX_SAFE_INTEGER) {
        if (index >= this.sequence.length) {
            this.sequence.push(location);
        }
        else {
            this.sequence[index] = location;
        }
        this.observable.notify();
    }
    get(index) {
        console.assert(index >= 0 && index < this.sequence.length);
        return this.sequence[index];
    }
    isEmpty() {
        return this.sequence.length === 0;
    }
    nonEmpty() {
        return this.sequence.length > 0;
    }
    clear() {
        if (this.nonEmpty()) {
            this.sequence.splice(0, this.size());
            this.observable.notify();
        }
    }
    size() {
        return this.sequence.length;
    }
    terminate() {
        this.observable.terminate();
    }
}
//# sourceMappingURL=track.js.map