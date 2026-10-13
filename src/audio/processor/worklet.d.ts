declare class AudioWorkletProcessor {
    readonly port: MessagePort
    constructor(options?: AudioWorkletNodeOptions)
}

declare const sampleRate: number

declare function registerProcessor(name: string, processorCtor: new (options: AudioWorkletNodeOptions) => AudioWorkletProcessor): void
