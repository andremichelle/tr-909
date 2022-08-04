import { ObservableValue } from "../../lib/common.js";
import { UIContext } from "../context.js";
import { FunctionKeyLabel, MainKeyIndex } from "../keys.js";
import { complete, Mode } from "../mode.js";
declare enum TransientEditing {
    Off = 0,
    ShuffleFlam = 1,
    InstrumentSelect = 2
}
export default class extends Mode {
    readonly transientEditing: ObservableValue<TransientEditing>;
    private inputMode;
    constructor(context: UIContext);
    onFunctionKeyPress(label: FunctionKeyLabel<any>): complete;
    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void;
    onMainKeyPress(keyIndex: MainKeyIndex): complete;
    name(): string;
}
export {};
