import {Terminable, Terminator} from "@opendaw/lib-std"
import type {UIContext} from "./context"
import {FunctionKeyLabel, MainKeyLabel} from "./keys"

// true ends the key sequence, false keeps recording multi-key presses
export type complete = boolean

export abstract class Mode implements Terminable {
    readonly #terminator: Terminator = new Terminator()

    protected constructor(readonly context: UIContext) {}

    onFunctionKeyPress(_label: FunctionKeyLabel): complete {return true}
    onFunctionKeyRelease(_label: FunctionKeyLabel): void {}
    onMainKeyPress(_label: MainKeyLabel): complete {return true}
    allowMainKeyValueInput(): boolean {return false}
    setMainKeyValue(_value: number): void {}

    abstract name(): string

    own<T extends Terminable>(terminable: T): T {return this.#terminator.own(terminable)}

    terminate(): void {this.#terminator.terminate()}
}
