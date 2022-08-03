import { Options, Parameter, PrintMapping, Terminator } from "../../lib/common.js";
import { Exp, Linear, Pow, Volume } from "../../lib/mapping.js";
const TempoMapping = Pow.byCenter(120, 37, 290);
const BassdrumTuneMapping = new Exp(0.007, 0.0294);
const BassdrumDecayMapping = new Exp(0.012, 0.100);
const TomDecayMapping = new Exp(0.04, 0.15);
const SnaredrumDecayMapping = new Exp(0.04, 0.2);
const OpenedHihatMapping = new Exp(0.03, 0.16);
const ClosedHihatMapping = new Exp(0.008, 0.06);
const TuneMapping = new Linear(-0.5, 0.5);
export class Preset {
    constructor() {
        this.tempo = new Parameter(TempoMapping, PrintMapping.FLOAT_ONE, 120.0);
        this.volume = new Parameter(Volume.Default, PrintMapping.DECIBEL, 0.0);
        this.accent = new Parameter(Linear.Identity, PrintMapping.UnipolarPercent, 0.5);
        this.bassdrum = Object.seal({
            tune: new Parameter(BassdrumTuneMapping, PrintMapping.UnipolarPercent, BassdrumTuneMapping.y(0.0)),
            level: new Parameter(Volume.Default, PrintMapping.DECIBEL, -6.0),
            attack: new Parameter(Volume.Default, PrintMapping.DECIBEL, 0.0),
            decay: new Parameter(BassdrumDecayMapping, PrintMapping.UnipolarPercent, BassdrumDecayMapping.y(0.5))
        });
        this.snaredrum = Object.seal({
            tune: new Parameter(TuneMapping, PrintMapping.UnipolarPercent, TuneMapping.y(0.5)),
            level: new Parameter(Volume.Default, PrintMapping.DECIBEL, -6.0),
            tone: new Parameter(SnaredrumDecayMapping, PrintMapping.UnipolarPercent, SnaredrumDecayMapping.y(1.0)),
            snappy: new Parameter(Volume.Default, PrintMapping.DECIBEL, 0.0)
        });
        this.tomLow = Object.seal({
            tune: new Parameter(TuneMapping, PrintMapping.UnipolarPercent, TuneMapping.y(0.5)),
            level: new Parameter(Volume.Default, PrintMapping.DECIBEL, -6.0),
            decay: new Parameter(TomDecayMapping, PrintMapping.UnipolarPercent, TomDecayMapping.y(1.0))
        });
        this.tomMid = Object.seal({
            tune: new Parameter(TuneMapping, PrintMapping.UnipolarPercent, TuneMapping.y(0.5)),
            level: new Parameter(Volume.Default, PrintMapping.DECIBEL, -6.0),
            decay: new Parameter(TomDecayMapping, PrintMapping.UnipolarPercent, TomDecayMapping.y(1.0))
        });
        this.tomHi = Object.seal({
            tune: new Parameter(TuneMapping, PrintMapping.UnipolarPercent, TuneMapping.y(0.5)),
            level: new Parameter(Volume.Default, PrintMapping.DECIBEL, -6.0),
            decay: new Parameter(TomDecayMapping, PrintMapping.UnipolarPercent, TomDecayMapping.y(1.0))
        });
        this.rim = Object.seal({
            level: new Parameter(Volume.Default, PrintMapping.DECIBEL, -6.0)
        });
        this.clap = Object.seal({
            level: new Parameter(Volume.Default, PrintMapping.DECIBEL, -6.0)
        });
        this.hihatLevel = new Parameter(Volume.Default, PrintMapping.DECIBEL, -6.0);
        this.closedHihat = {
            level: this.hihatLevel,
            decay: new Parameter(ClosedHihatMapping, PrintMapping.UnipolarPercent, ClosedHihatMapping.y(0.0))
        };
        this.openedHihat = {
            level: this.hihatLevel,
            decay: new Parameter(OpenedHihatMapping, PrintMapping.UnipolarPercent, OpenedHihatMapping.y(0.5))
        };
        this.crash = Object.seal({
            level: new Parameter(Volume.Default, PrintMapping.DECIBEL, -6.0),
            tune: new Parameter(TuneMapping, PrintMapping.UnipolarPercent, TuneMapping.y(0.5))
        });
        this.ride = Object.seal({
            level: new Parameter(Volume.Default, PrintMapping.DECIBEL, -6.0),
            tune: new Parameter(TuneMapping, PrintMapping.UnipolarPercent, TuneMapping.y(0.5))
        });
        Object.defineProperty(this.closedHihat, 'level', { enumerable: false });
        Object.defineProperty(this.openedHihat, 'level', { enumerable: false });
    }
    observeAll(callback) {
        const terminator = new Terminator();
        const search = (object, path) => {
            for (let key in object) {
                const element = object[key];
                const elementPath = path.concat(key);
                if (element instanceof Parameter) {
                    terminator.with(element.addObserver(() => callback(element, elementPath)));
                }
                else if (element instanceof Object) {
                    search(element, elementPath);
                }
            }
        };
        search(this, []);
        return terminator;
    }
    find(path) {
        return Options.valueOf(path.reduce((object, key) => object[key], this));
    }
}
//# sourceMappingURL=preset.js.map