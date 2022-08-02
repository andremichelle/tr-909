import {Terminable, Terminator} from "../lib/common.js"
import {UIContext} from "./context.js"
import {FunctionKeyLabel, MainKeyIndex} from "./keys.js"

/**
 * consumed is for emulating multi-touch on keys to reach extended functionalities.
 * It will define the life-time of a key sequence. It should return true,
 * if the corresponding action of a key is executed, so no new tap-fingers will be displayed on screen
 * and will not be part of the currently active keys.
 */
export type consumed = boolean

export abstract class Mode implements Terminable {
    private readonly terminator: Terminator = new Terminator()

    protected constructor(readonly context: UIContext) {
    }

    onFunctionKeyPress(label: FunctionKeyLabel<any>): consumed {
        return false
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
    }

    onMainKeyPress(keyIndex: MainKeyIndex): consumed {
        return false
    }

    setMainKeyValue(value: number): void {
    }

    abstract name(): string

    readonly with = <T extends Terminable>(terminable: T): T => this.terminator.with(terminable)
    readonly terminate = (): void => this.terminator.terminate()
}