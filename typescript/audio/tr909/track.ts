import {Observable, ObservableImpl, Observer, Serializer, Terminable} from "../../lib/common.js"

export class TrackFormat {
    sequence: number[]
}

export class Track implements Serializer<TrackFormat>, Observable<void> {
    static readonly MAX_MEASURES = 896

    private readonly observable: ObservableImpl<void> = new ObservableImpl<void>()
    private readonly sequence: number[] = []

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
        return {
            sequence: this.sequence
        }
    }

    insert(...indices: number[]): void {
        if (indices.length > 0) {
            // TODO Respect MAX_MEASURES!
            indices.forEach(index => this.sequence.push(index))
            this.observable.notify()
        }
    }

    get(index: number): number {
        console.assert(index >= 0 && index < this.sequence.length)
        return this.sequence[index]
    }

    remaining(): number {
        return Track.MAX_MEASURES - this.size()
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