import {Terminable, Terminator} from "../lib/common.js"
import {MachineContext} from "./context.js"
import {DisplayValue} from "./display.js"
import {FunctionKeyLabel, MainKeyIndex} from "./keys.js"

export type consumed = boolean

export abstract class Mode implements Terminable {
    private readonly terminator: Terminator = new Terminator()

    protected constructor(readonly context: MachineContext) {
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

    getDisplayValue(): DisplayValue {
        return 'none'
    }

    abstract name(): string

    readonly with = <T extends Terminable>(terminable: T): T => this.terminator.with(terminable)
    readonly terminate = (): void => this.terminator.terminate()
}