export type JsonBinResponse<T> = {
    metadata: { 'createdAt': string, 'id': string, 'private': boolean }
    record: T
} | { message: string }

export class JsonBin {
    static async load(): Promise<JsonBin> {
        return Promise.resolve(new JsonBin({}))
        // return new JsonBin(await fetch('credentials.json').then(x => x.json()).catch(e => { }))
    }

    constructor(private readonly headers: {}) {
    }

    async saveBin<T>(body: string): Promise<JsonBinResponse<T>> {
        return await fetch('https://api.jsonbin.io/v3/b', {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: this.headers, body
        }).then(x => x.json())
    }

    async loadBin<T>(binId: string): Promise<JsonBinResponse<T>> {
        return await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: this.headers
        }).then(x => x.json())
    }
}
