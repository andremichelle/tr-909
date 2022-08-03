import { UIContext } from "../context.js";
import { FunctionKeyLabel, MainKeyIndex } from "../keys.js";
import { complete, Mode } from "../mode.js";
export default class extends Mode {
    constructor(context: UIContext);
    onFunctionKeyPress(label: FunctionKeyLabel<any>): complete;
    onMainKeyPress(keyIndex: MainKeyIndex): complete;
    setMainKeyValue(value: number): void;
    name(): string;
    private initButtons;
}
