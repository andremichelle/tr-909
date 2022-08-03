export class UserPatternSelect {
    constructor(state, port, isMoving) {
        this.state = state;
        this.port = port;
        this.isMoving = isMoving;
        this.waiting = null;
        this.respectChain = false;
        this.current = this.state.activePattern();
        this.state.patternIndicesChangeNotification.addObserver((pattern) => {
            if (this.isMoving()) {
                this.waiting = pattern;
            }
            else {
                this.current = pattern;
                this.waiting = null;
            }
        });
    }
    pattern() {
        return this.current;
    }
    next() {
        const current = this.current;
        if (current === null) {
            this.respectChain = false;
            return null;
        }
        if (this.waiting === null) {
            if (this.respectChain) {
                const bank = this.state.activeBank();
                if (bank.isChained(current)) {
                    this.current = bank.nextPattern(current);
                }
                else {
                    this.current = bank.firstOfChained(current);
                }
            }
            else {
                this.respectChain = true;
            }
        }
        else {
            this.current = this.waiting;
            this.respectChain = true;
            this.waiting = null;
        }
        if (current !== this.current) {
            this.port.postMessage({ type: "update-pattern", location: this.current.location });
        }
    }
    reevaluate() {
    }
    setTrackMeasure(measure) {
    }
}
export class TrackPatternPlay {
    constructor(state, port) {
        this.state = state;
        this.port = port;
        this.measure = 0;
        this.current = null;
        this.reevaluate();
    }
    pattern() {
        return this.current;
    }
    next() {
        const track = this.state.activeTrack();
        let increment = false;
        if (track.isEmpty()) {
            this.measure = -1;
            this.current = null;
        }
        else {
            const memoryBank = this.state.activeBank();
            console.assert(this.measure >= 0);
            if (this.measure < track.size()) {
                this.current = memoryBank.patternByLocation(track.get(this.measure));
                increment = true;
            }
            else {
                if (this.state.cycleGuideMode.get()) {
                    this.measure = 0;
                    this.current = track.isEmpty() ? null : memoryBank.patternByLocation(track.get(this.measure));
                    increment = true;
                }
                else {
                    this.measure = 0;
                    this.current = null;
                    this.postTrackComplete();
                    return;
                }
            }
        }
        this.postUpdateTrackMeasure();
        if (increment) {
            this.measure++;
        }
    }
    reevaluate() {
        const track = this.state.activeTrack();
        this.current = track.isEmpty()
            ? null
            : this.measure >= 0 && this.measure < track.size()
                ? this.state.activeBank().patternByLocation(track.get(this.measure))
                : null;
    }
    setTrackMeasure(measure) {
        console.debug("setTrackMeasure", measure);
        this.measure = measure;
        this.reevaluate();
    }
    postUpdateTrackMeasure() {
        this.port.postMessage({ type: "update-track-measure", measure: this.measure });
    }
    postTrackComplete() {
        this.port.postMessage({ type: "track-complete" });
    }
}
//# sourceMappingURL=pattern.js.map