import { ArrayUtils, ObservableValueImpl, Terminator } from "../../lib/common.js";
import { barsToSeconds, dbToGain, Transport } from "../common.js";
import { MeterWorklet } from "../meter/worklet.js";
import { ChannelIndex, Memory } from "./memory.js";
import { Preset } from "./preset.js";
export class Machine {
    constructor(context, resources) {
        this.context = context;
        this.terminator = new Terminator();
        this.scheduleUpdates = [];
        this.bundledUpdates = [];
        this.running = true;
        this.processorStepIndex = new ObservableValueImpl(0);
        this.processorTrackMeasure = new ObservableValueImpl(0);
        this.worklet = new AudioWorkletNode(context, "tr-909", {
            numberOfInputs: 1,
            numberOfOutputs: ChannelIndex.End,
            outputChannelCount: ArrayUtils.fill(ChannelIndex.End, () => 1),
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers",
            processorOptions: { resources }
        });
        this.preset = new Preset();
        this.memory = new Memory();
        this.transport = new Transport();
        this.transport.addObserver(message => this.worklet.port.postMessage(message), false);
        this.meterWorklet = new MeterWorklet(context, 10, 1);
        this.master = context.createGain();
        for (let index = 0; index < ChannelIndex.End; index++) {
            this.worklet.connect(this.meterWorklet, index, index).connect(this.master, index, 0);
        }
        this.terminator.with(this.preset.volume.addObserver(value => this.master.gain.value = dbToGain(value), true));
        this.terminator.with(this.preset.observeAll((parameter, path) => {
            this.worklet.port.postMessage({
                type: 'update-parameter',
                path,
                unipolar: parameter.getUnipolar()
            });
        }));
        this.terminator.with(this.memory.state.changeNotification.addObserver(() => this.worklet.port.postMessage({
            type: 'update-memory-state',
            format: this.memory.state.serialize()
        })));
        this.terminator.merge(this.memory.banks
            .map((bank, bankIndex) => {
            return [
                ...bank.tracks
                    .map((track, trackIndex) => track
                    .addObserver(() => this.worklet.port.postMessage({
                    type: 'update-track', bankIndex, arrayIndex: trackIndex, format: track.serialize()
                }), false)),
                ...bank.patternGroups
                    .map((patternGroup, patternGroupIndex) => patternGroup.addObserver(() => this.worklet.port.postMessage({
                    type: 'update-pattern-group-chained',
                    bankIndex,
                    patternGroupIndex,
                    chained: patternGroup.getChained()
                }), false)),
                ...bank.patternGroups
                    .map(patternGroup => patternGroup.patterns)
                    .flat()
                    .map((pattern) => pattern
                    .addObserver(() => this
                    .bundledUpdate(bankIndex, pattern.location), false))
            ];
        }).flat());
        this.terminator.with(this.processorTrackMeasure.addObserver(measure => {
            if (!this.transport.isPlaying()) {
                this.worklet.port.postMessage({ type: 'update-track-measure', measure });
            }
        }, false));
        this.worklet.port.onmessage = event => {
            const message = event.data;
            const schedule = (exec) => this.scheduleUpdates.push({ time: this.context.currentTime + this.context.outputLatency || 0, exec });
            if (message.type === 'update-step') {
                schedule(() => this.processorStepIndex.set(message.stepIndex));
            }
            else if (message.type === 'update-pattern') {
                const state = this.memory.state;
                state.patternIndicesChangeNotification.notify(state.activeBank().patternByLocation(message.location));
            }
            else if (message.type === "update-track-measure") {
                schedule(() => this.processorTrackMeasure.set(message.measure));
            }
            else if (message.type === "track-complete") {
                schedule(() => {
                    this.transport.stop();
                    this.processorTrackMeasure.set(0);
                });
            }
        };
        this.startScheduler();
    }
    static loadModule(context) {
        return context.audioWorklet.addModule("bin/audio/tr909/dsp/processor.js");
    }
    serialize() {
        return {
            preset: this.preset.serialize(),
            memory: this.memory.serialize()
        };
    }
    deserialize(format) {
        this.preset.deserialize(format.preset);
        this.memory.deserialize(format.memory);
        return this;
    }
    stepAbsoluteDuration() {
        return barsToSeconds(this.memory.state.activePattern().scaleRatio(), this.preset.tempo.get());
    }
    play(channelIndex, step) {
        this.worklet.port.postMessage({ type: 'play-channel', channelIndex, step });
    }
    terminate() {
        this.running = false;
        this.terminator.terminate();
    }
    bundledUpdate(bankIndex, location) {
        if (!this.bundledUpdates.some(update => update.bankIndex === bankIndex && update.location === location)) {
            this.bundledUpdates.push({ bankIndex, location });
        }
    }
    startScheduler() {
        const schedule = () => {
            if (this.scheduleUpdates.length > 0) {
                if (this.context.currentTime >= this.scheduleUpdates[0].time) {
                    this.scheduleUpdates.shift().exec();
                }
            }
            while (this.bundledUpdates.length > 0) {
                const update = this.bundledUpdates.pop();
                const bankIndex = update.bankIndex;
                const location = update.location;
                this.worklet.port.postMessage({
                    type: 'update-pattern', bankIndex, location,
                    format: this.memory.banks[bankIndex].patternByLocation(location).serialize()
                });
            }
            if (this.running) {
                setTimeout(schedule, 20);
            }
        };
        schedule();
    }
}
//# sourceMappingURL=machine.js.map