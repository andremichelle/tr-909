import { Terminable } from "../lib/common.js";
import { UIContext } from "./context.js";
import { FunctionKeyLabel, MainKeyIndex } from "./keys.js";
export declare type complete = boolean;
export declare abstract class Mode implements Terminable {
    readonly context: UIContext;
    private readonly terminator;
    protected constructor(context: UIContext);
    onFunctionKeyPress(label: FunctionKeyLabel<any>): complete;
    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void;
    onMainKeyPress(keyIndex: MainKeyIndex): complete;
    setMainKeyValue(value: number): void;
    abstract name(): string;
    readonly with: <T extends Terminable>(terminable: T) => T;
    readonly terminate: () => void;
}
