export const ResourceSampleRate = 44100.0;
export const loadResources = (boot) => {
    const load = (path) => boot.registerProcess(fetch(path)
        .then(x => x.arrayBuffer())
        .then(x => new Float32Array(x)));
    const dependencies = {
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
    return () => ({
        bassdrum: {
            attack: dependencies.bassdrum.attack.get(),
            cycle: dependencies.bassdrum.cycle.get()
        },
        snaredrum: {
            tone: dependencies.snaredrum.tone.get(),
            noise: dependencies.snaredrum.noise.get()
        },
        tomLow: dependencies.tomLow.get(),
        tomMid: dependencies.tomMid.get(),
        tomHi: dependencies.tomHi.get(),
        rim: dependencies.rim.get(),
        clap: dependencies.clap.get(),
        closedHihat: dependencies.closedHihat.get(),
        openedHihat: dependencies.openedHihat.get(),
        crash: dependencies.crash.get(),
        ride: dependencies.ride.get()
    });
};
//# sourceMappingURL=resources.js.map