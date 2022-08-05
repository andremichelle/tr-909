import { Terminable, Terminator } from "../lib/common.js"
import { UIContext } from "./context.js"
import { FunctionKeyLabel, MainKeyIndex } from "./keys.js"

export enum StepsEditingMode {
    Step, Tap
}

/**
 * complete is for emulating multi-touch on keys to reach extended functionalities.
 * It will define the life-time of a key sequence. It should return true,
 * if the action ends here and no more multi-tapping should be recorded.
 */
export type complete = boolean

export abstract class Mode implements Terminable {
    private readonly terminator: Terminator = new Terminator()

    protected constructor(readonly context: UIContext) {
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): complete {
        return true
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
    }

    onMainKeyPress(keyIndex: MainKeyIndex): complete {
        return true
    }

    setMainKeyValue(value: number): void {
    }

    abstract name(): string

    readonly with = <T extends Terminable>(terminable: T): T => this.terminator.with(terminable)
    readonly terminate = (): void => this.terminator.terminate()
}