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
    serialize() {
        return {
            tempo: this.tempo.get(),
            volume: this.volume.get(),
            accent: this.accent.get(),
            bassdrum: {
                tune: this.bassdrum.tune.get(),
                level: this.bassdrum.level.get(),
                attack: this.bassdrum.attack.get(),
                decay: this.bassdrum.decay.get()
            },
            snaredrum: {
                tune: this.snaredrum.tune.get(),
                level: this.snaredrum.level.get(),
                tone: this.snaredrum.tone.get(),
                snappy: this.snaredrum.snappy.get()
            },
            tomLow: {
                tune: this.tomLow.tune.get(),
                level: this.tomLow.level.get(),
                decay: this.tomLow.decay.get()
            },
            tomMid: {
                tune: this.tomMid.tune.get(),
                level: this.tomMid.level.get(),
                decay: this.tomMid.decay.get()
            },
            tomHi: {
                tune: this.tomHi.tune.get(),
                level: this.tomHi.level.get(),
                decay: this.tomHi.decay.get()
            },
            rim: { level: this.rim.level.get() },
            clap: { level: this.clap.level.get() },
            hihatLevel: this.hihatLevel.get(),
            closedHihat: { decay: this.closedHihat.decay.get() },
            openedHihat: { decay: this.openedHihat.decay.get() },
            crash: { level: this.crash.level.get(), tune: this.crash.tune.get() },
            ride: { level: this.ride.level.get(), tune: this.ride.tune.get() }
        };
    }
    deserialize(format) {
        this.tempo.set(format.tempo);
        this.volume.set(format.volume);
        this.accent.set(format.accent);
        this.bassdrum.tune.set(format.bassdrum.tune);
        this.bassdrum.level.set(format.bassdrum.level);
        this.bassdrum.attack.set(format.bassdrum.attack);
        this.bassdrum.decay.set(format.bassdrum.decay);
        this.snaredrum.tune.set(format.snaredrum.tune);
        this.snaredrum.level.set(format.snaredrum.level);
        this.snaredrum.tone.set(format.snaredrum.tone);
        this.snaredrum.snappy.set(format.snaredrum.snappy);
        this.tomLow.tune.set(format.tomLow.tune);
        this.tomLow.level.set(format.tomLow.level);
        this.tomLow.decay.set(format.tomLow.decay);
        this.tomMid.tune.set(format.tomMid.tune);
        this.tomMid.level.set(format.tomMid.level);
        this.tomMid.decay.set(format.tomMid.decay);
        this.tomHi.tune.set(format.tomHi.tune);
        this.tomHi.level.set(format.tomHi.level);
        this.tomHi.decay.set(format.tomHi.decay);
        this.rim.level.set(format.rim.level);
        this.clap.level.set(format.clap.level);
        this.hihatLevel.set(format.hihatLevel);
        this.closedHihat.decay.set(format.closedHihat.decay);
        this.openedHihat.decay.set(format.openedHihat.decay);
        this.crash.level.set(format.crash.level);
        this.crash.tune.set(format.crash.tune);
        this.ride.level.set(format.ride.level);
        this.ride.tune.set(format.ride.tune);
        return this;
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