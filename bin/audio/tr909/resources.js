var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const ResourceSampleRate = 44100.0;
export class AudioFiles {
    static load() {
        return __awaiter(this, void 0, void 0, function* () {
            const load = (path) => fetch(path)
                .then(x => x.arrayBuffer())
                .then(x => new Float32Array(x));
            const promises = {
                bassdrum: {
                    attack: load('./resources/bassdrum-attack.raw'),
                    cycle: load('./resources/bassdrum-cycle.raw')
                },
                snaredrum: {
                    tone: load('./resources/snare-tone.raw'),
                    noise: load('./resources/snare-noise.raw'),
                },
                tomLow: load('./resources/tom-low.raw'),
                tomMid: load('./resources/tom-mid.raw'),
                tomHi: load('./resources/tom-hi.raw'),
                rim: load('./resources/rim.raw'),
                clap: load('./resources/clap.raw'),
                closedHihat: load('./resources/closed-hihat.raw'),
                openedHihat: load('./resources/opened-hihat.raw'),
                crash: load('./resources/crash.raw'),
                ride: load('./resources/ride.raw')
            };
            return new AudioFiles({
                bassdrum: {
                    attack: yield promises.bassdrum.attack,
                    cycle: yield promises.bassdrum.cycle
                },
                snaredrum: {
                    tone: yield promises.snaredrum.tone,
                    noise: yield promises.snaredrum.noise
                },
                tomLow: yield promises.tomLow,
                tomMid: yield promises.tomMid,
                tomHi: yield promises.tomHi,
                rim: yield promises.rim,
                clap: yield promises.clap,
                closedHihat: yield promises.closedHihat,
                openedHihat: yield promises.openedHihat,
                crash: yield promises.crash,
                ride: yield promises.ride
            });
        });
    }
    constructor(resources) {
        this.resources = resources;
    }
}
//# sourceMappingURL=resources.js.map