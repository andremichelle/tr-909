import {Terminable, Terminator} from "@opendaw/lib-std"
import {dbToGain} from "../common"

export const SilentGain = dbToGain(-72.0)

export type isRunning = boolean

export abstract class Voice implements Terminable {
    protected readonly terminator: Terminator = new Terminator()
    protected readonly sampleRateInv: number

    protected constructor(readonly sampleRate: number) {this.sampleRateInv = 1.0 / sampleRate}

    abstract stop(): void
    abstract process(output: Float32Array, from: number, to: number): isRunning

    terminate(): void {this.terminator.terminate()}
}
