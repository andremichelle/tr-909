var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class JsonBin {
    constructor() { }
    static save(body) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield fetch('https://api.jsonbin.io/v3/b', {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: Object.assign(Object.assign({}, JsonBin.HEADERS), { "X-Bin-Name": "909.kitchen" }),
                body: JSON.stringify(body)
            }).then(x => x.json());
            if ('message' in result) {
                throw new Error(result.message);
            }
            return result;
        });
    }
    static load(binId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                headers: JsonBin.HEADERS
            }).then(x => x.json());
            if ('message' in result) {
                throw new Error(result.message);
            }
            return result;
        });
    }
}
JsonBin.HEADERS = {
    "Content-Type": "application/json",
    "X-Master-Key": "$2b$10$MC5td1Go/TL2aKxjIpV.euq1X3opDEC37edBjazDa1ZF/t182VyGO",
    "X-Access-Key": "$2b$10$yI422V3aQFjbOhQszzdApOSbAww.N2EUSkpiRm7FJWSo2HmUuUXd2"
};
//# sourceMappingURL=jsonbin.js.map