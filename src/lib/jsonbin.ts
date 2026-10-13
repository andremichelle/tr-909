import {isDefined, Option, tryCatch} from "@opendaw/lib-std"

export type JsonBinResponse<T> = {
    metadata: { createdAt: string, id: string, private: boolean }
    record: T
}

type JsonBinError = { message: string }

export namespace JsonBin {
    // public write key of the original 909.kitchen deployment (create your own at https://jsonbin.io)
    const Headers = {
        "Content-Type": "application/json",
        "X-Access-Key": "$2b$10$yI422V3aQFjbOhQszzdApOSbAww.N2EUSkpiRm7FJWSo2HmUuUXd2"
    }

    const isError = (value: unknown): value is JsonBinError =>
        isDefined(value) && typeof value === "object" && typeof (value as JsonBinError).message === "string"

    const request = async <T>(url: string, init: RequestInit): Promise<Option<JsonBinResponse<T>>> => {
        const response = await Option.async(fetch(url, {mode: "cors", cache: "no-cache", ...init}))
        if (response.isEmpty()) {return Option.None}
        const json: Option<unknown> = await Option.async(response.unwrap().json())
        if (json.isEmpty() || isError(json.unwrap())) {
            console.warn(json.unwrapOrNull())
            return Option.None
        }
        return Option.wrap(json.unwrap() as JsonBinResponse<T>)
    }

    export const save = <T>(body: T): Promise<Option<JsonBinResponse<T>>> => {
        const payload = tryCatch(() => JSON.stringify(body))
        if (payload.status === "failure") {return Promise.resolve(Option.None)}
        return request<T>("https://api.jsonbin.io/v3/b", {
            method: "POST", headers: {...Headers, "X-Bin-Name": "909.kitchen"}, body: payload.value
        })
    }

    export const load = <T>(binId: string): Promise<Option<JsonBinResponse<T>>> =>
        request<T>(`https://api.jsonbin.io/v3/b/${binId}`, {method: "GET", headers: Headers})
}
