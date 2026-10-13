import {Notifier, Observable, Observer, Subscription, Terminable} from "@opendaw/lib-std"

export type TransportMessage =
    | { type: "transport-play" }
    | { type: "transport-pause" }
    | { type: "transport-move", position: number }

export class Transport implements Observable<TransportMessage>, Terminable {
    readonly #notifier: Notifier<TransportMessage> = new Notifier<TransportMessage>()

    #moving: boolean = false

    subscribe(observer: Observer<TransportMessage>): Subscription {return this.#notifier.subscribe(observer)}

    play(): void {
        if (this.#moving) {return}
        this.#moving = true
        this.#notifier.notify({type: "transport-play"})
    }

    pause(): void {
        if (!this.#moving) {return}
        this.#moving = false
        this.#notifier.notify({type: "transport-pause"})
    }

    togglePlayback(): void {
        if (this.#moving) {this.pause()} else {this.play()}
    }

    stop(): void {
        this.pause()
        this.moveTo(0.0)
    }

    moveTo(position: number): void {this.#notifier.notify({type: "transport-move", position})}

    isPlaying(): boolean {return this.#moving}

    terminate(): void {this.#notifier.terminate()}
}
