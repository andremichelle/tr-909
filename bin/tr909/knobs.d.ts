import { Parameter, Terminable } from "../lib/common.js";
export declare class Knob implements Terminable {
    private readonly element;
    private readonly parameter;
    private readonly terminator;
    constructor(element: HTMLElement, parameter: Parameter<any>);
    terminate(): void;
    private attachEvents;
}
