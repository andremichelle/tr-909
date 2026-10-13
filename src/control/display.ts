import {Arrays, DefaultObservableValue, int, isDefined, ObservableValue, Observer, Subscription, Terminable, Terminator} from "@opendaw/lib-std"

export type DisplayValue = number | "none" | "error"

export interface DisplayValueProvider {
    readonly debugName: string
    catchupAndSubscribe(observer: Observer<DisplayValue>): Subscription
}

export namespace DisplayValueProvider {
    export const constant = (debugName: string, value: DisplayValue): DisplayValueProvider => ({
        debugName,
        catchupAndSubscribe: (observer: Observer<DisplayValue>): Subscription => {
            observer(value)
            return Terminable.Empty
        }
    })

    export const provide = (debugName: string, provider: () => DisplayValue): DisplayValueProvider => ({
        debugName,
        catchupAndSubscribe: (observer: Observer<DisplayValue>): Subscription => {
            observer(provider())
            return Terminable.Empty
        }
    })

    export const observe = (debugName: string, value: ObservableValue<number>,
                            mapping: (value: number) => number = identity): DisplayValueProvider => ({
        debugName,
        catchupAndSubscribe: (observer: Observer<DisplayValue>): Subscription =>
            value.catchupAndSubscribe(owner => observer(mapping(owner.getValue())))
    })

    export const identity = (value: number): number => value
    export const plusOne = (value: number): number => value + 1
}

export class Display implements Terminable {
    readonly #stack: Array<[DisplayValueProvider, Terminator]> = []
    readonly #value: DefaultObservableValue<DisplayValue> = new DefaultObservableValue<DisplayValue>("none")

    get value(): ObservableValue<DisplayValue> {return this.#value}

    push(provider: DisplayValueProvider): Subscription {
        const terminator = new Terminator()
        this.#stack.forEach(([, subscription]) => subscription.terminate())
        terminator.own(provider.catchupAndSubscribe(value => this.#value.setValue(value)))
        this.#stack.push([provider, terminator])
        return {
            terminate: () => {
                const index = this.#stack.findIndex(([entry]) => entry === provider)
                if (index === -1) {return}
                const [[, removed]] = this.#stack.splice(index, 1)
                removed.terminate()
                const top = this.#stack.at(-1)
                if (isDefined(top)) {
                    const [last, subscription] = top
                    subscription.own(last.catchupAndSubscribe(value => this.#value.setValue(value)))
                } else {
                    this.#value.setValue("none")
                }
            }
        }
    }

    showError(): void {this.#value.setValue("error")}

    terminate(): void {this.#stack.splice(0).forEach(([, subscription]) => subscription.terminate())}
}

export class DigitInput implements Terminable {
    readonly #display: Display
    readonly #digits: Array<int> = Arrays.create(() => 0, 3)
    readonly #value: DefaultObservableValue<int> = new DefaultObservableValue<int>(0)
    readonly #provider: DisplayValueProvider

    #subscription: Subscription = Terminable.Empty
    #inputting: boolean = false

    constructor(display: Display) {
        this.#display = display
        this.#provider = DisplayValueProvider.observe("value input", this.#value)
    }

    start(): void {
        if (this.#inputting) {return}
        this.#inputting = true
        this.#digits.fill(0)
        this.#subscription = this.#display.push(this.#provider)
    }

    stop(): void {
        if (!this.#inputting) {return}
        this.#inputting = false
        this.#subscription.terminate()
        this.#subscription = Terminable.Empty
    }

    push(digit: int): void {
        this.#digits.shift()
        this.#digits.push(digit)
        this.#value.setValue(this.#digits[0] * 100 + this.#digits[1] * 10 + this.#digits[2])
    }

    setValue(value: int): void {
        this.#digits[0] = Math.floor(value / 100) % 10
        this.#digits[1] = Math.floor(value / 10) % 10
        this.#digits[2] = value % 10
        this.#value.setValue(value)
    }

    getValue(): int {return this.#value.getValue()}

    terminate(): void {
        this.stop()
        this.#value.terminate()
    }
}
