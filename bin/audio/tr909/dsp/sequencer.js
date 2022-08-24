import { ifDefined } from "../../../lib/common.js";
export class StepSequencer {
    constructor(environment) {
        this.environment = environment;
        this.firstRun = true;
        this.position = 0.0;
    }
    sequence(increment) {
        const environment = this.environment;
        if (this.firstRun) {
            console.assert(this.position === 0.0);
            environment.nextPattern();
            ifDefined(environment.currentPattern(), pattern => environment.onPatternStep(pattern, 0, 0.0));
            this.firstRun = false;
        }
        let pattern = environment.currentPattern();
        if (pattern === null) {
            return;
        }
        const p0 = this.position;
        const p1 = p0 + increment;
        const duration = pattern.duration();
        if (p1 >= duration) {
            this.sequenceSection(pattern, p0, duration);
            this.position = 0.0;
            environment.nextPattern();
            pattern = environment.currentPattern();
            if (pattern !== null) {
                const pTarget = p1 % duration;
                this.sequenceSection(pattern, this.position, pTarget);
                this.position = pTarget;
            }
        }
        else {
            this.sequenceSection(pattern, p0, p1);
            this.position = p1;
        }
    }
    moveTo(position) {
        console.assert(position === 0.0, 'only rewind is implemented');
        this.firstRun = true;
        this.position = 0.0;
    }
    sequenceSection(pattern, p0, p1) {
        const scale = pattern.scaleRatio();
        const lastStep = pattern.lastStep.get();
        {
            const searchStart = pattern.shuffleInverse(p0);
            const searchLimit = pattern.shuffleInverse(p1);
            let searchIndex = Math.floor(searchStart / scale);
            let searchPosition = searchIndex * scale;
            while (searchPosition < searchLimit) {
                if (searchPosition >= searchStart) {
                    this.environment.onPatternStep(pattern, searchIndex, pattern.shuffleTransform(searchPosition) - p0);
                }
                searchPosition = ++searchIndex * scale;
            }
        }
        {
            const shift = -scale * 0.5;
            p0 -= shift;
            p1 -= shift;
            const searchStart = pattern.shuffleInverse(p0);
            const searchLimit = pattern.shuffleInverse(p1);
            let searchIndex = Math.floor(searchStart / scale);
            let searchPosition = searchIndex * scale;
            while (searchPosition < searchLimit) {
                if (searchPosition >= searchStart) {
                    this.environment.onRoundStep((searchIndex + lastStep) % lastStep);
                }
                searchPosition = ++searchIndex * scale;
            }
        }
    }
}
//# sourceMappingURL=sequencer.js.map