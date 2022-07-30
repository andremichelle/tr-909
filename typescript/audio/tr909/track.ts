import {Observable, ObservableImpl, Observer, Serializer, Terminable} from "../../lib/common.js"
import {PatternLocation} from "./pattern.js"

export class TrackFormat {
    sequence: PatternLocation[]
}

export class Track implements Serializer<TrackFormat>, Observable<void> {
    private readonly observable: ObservableImpl<void> = new ObservableImpl<void>()
    private readonly sequence: PatternLocation[] = []

    addObserver(observer: Observer<void>, notify: boolean): Terminable {
        if (notify) observer()
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<void>): boolean {
        return this.observable.removeObserver(observer)
    }

    deserialize(format: TrackFormat): Serializer<TrackFormat> {
        this.sequence.splice(0, this.sequence.length, ...format.sequence)
        return this
    }

    serialize(): TrackFormat {
        return {sequence: this.sequence}
    }

    writeLocation(location: PatternLocation, index: number = Number.MAX_SAFE_INTEGER): void {
        if (index >= this.sequence.length) {
            this.sequence.push(location)
        } else {
            this.sequence[index] = location
        }
        this.observable.notify()
    }

    get(index: number): PatternLocation {
        console.assert(index >= 0 && index < this.sequence.length)
        return this.sequence[index]
    }

    isEmpty(): boolean {
        return this.sequence.length === 0
    }

    nonEmpty(): boolean {
        return this.sequence.length > 0
    }

    clear(): void {
        if (this.nonEmpty()) {
            this.sequence.splice(0, this.size())
            this.observable.notify()
        }
    }

    size(): number {
        return this.sequence.length
    }

    terminate(): void {
        this.observable.terminate()
    }
}