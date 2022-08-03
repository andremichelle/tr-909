import { UIContext } from "../context.js";
import { FunctionKeyLabel, MainKeyIndex } from "../keys.js";
import { complete, Mode } from "../mode.js";
export default class extends Mode {
    private terminableAvailableMeasureDisplay;
    private writeIndex;
    private readonly availableMeasures;
    constructor(context: UIContext);
    onFunctionKeyPress(label: FunctionKeyLabel<any>): complete;
    onFunctionKeyRelease(key: FunctionKeyLabel<any>): void;
    onMainKeyPress(keyIndex: MainKeyIndex): complete;
    setMainKeyValue(value: number): void;
    name(): string;
}
