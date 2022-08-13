export type JsonBinResponse<T> = {
    metadata: { 'createdAt': string, 'id': string, 'private': boolean }
    record: T
}

export class JsonBin {
    static async save<JSON>(body: JSON): Promise<JsonBinResponse<JSON>> {
        const result = await fetch('https://api.jsonbin.io/v3/b', {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: { ...JsonBin.HEADERS, "X-Bin-Name": "909.kitchen" },
            body: JSON.stringify(body)
        }).then(x => x.json())
        if ('message' in result) {
            throw new Error(result.message)
        }
        return result
    }

    static async load<JSON>(binId: string): Promise<JsonBinResponse<JSON>> {
        const result = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: JsonBin.HEADERS
        }).then(x => x.json())
        if ('message' in result) {
            throw new Error(result.message)
        }
        return result
    }

    /**
     * I know. Look's like the worst idea to include my credentials here.
     * Hope I find somebody, who can help me with security issues.
     * Create your own keys here: https://jsonbin.io
     */
    static readonly HEADERS = {
        "Content-Type": "application/json",
        "X-Master-Key": "$2b$10$MC5td1Go/TL2aKxjIpV.euq1X3opDEC37edBjazDa1ZF/t182VyGO",
        "X-Access-Key": "$2b$10$yI422V3aQFjbOhQszzdApOSbAww.N2EUSkpiRm7FJWSo2HmUuUXd2"
    }

    private constructor() { }
}