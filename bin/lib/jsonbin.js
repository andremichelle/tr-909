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
    constructor(headers) {
        this.headers = headers;
    }
    static load() {
        return __awaiter(this, void 0, void 0, function* () {
            const f = fetch('credentials.json');
            return new JsonBin(yield f.then(x => x.json()));
        });
    }
    saveBin(body) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield fetch('https://api.jsonbin.io/v3/b', {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: this.headers, body
            }).then(x => x.json());
        });
    }
    loadBin(binId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                headers: this.headers
            }).then(x => x.json());
        });
    }
}
//# sourceMappingURL=jsonbin.js.map