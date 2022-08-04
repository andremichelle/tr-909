import { Observable, ObservableValue, Observer, Terminable, Terminator } from "../lib/common.js";
export declare type DisplayValue = number | 'none' | Error;
export interface DisplayValueProvider extends Observable<DisplayValue> {
    displayValue(): DisplayValue;
}
export declare class DisplayObservableValueProvider implements DisplayValueProvider {
    readonly observableValue: ObservableValue<number>;
    readonly mapping: (value: number) => number;
    static Identity: (x: number) => number;
    static PlusOne: (x: number) => number;
    readonly terminator: Terminator;
    constructor(observableValue: ObservableValue<number>, mapping?: (value: number) => number);
    addObserver(observer: Observer<DisplayValue>, notify: boolean): Terminable;
    displayValue(): DisplayValue;
    terminate(): void;
}
export declare class Display implements Terminable {
    private readonly providerStack;
    private readonly digits;
    constructor(svg: SVGSVGElement);
    pushProvider(provider: DisplayValueProvider): Terminable;
    terminate(): void;
    private show;
}
