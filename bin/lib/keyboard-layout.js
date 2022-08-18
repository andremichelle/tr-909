import { elseIfUndefined } from './common.js';
import { HTML } from './dom.js';
export class KeyboardLayout {
    constructor(layout) {
        this.root = HTML.create('div', { class: 'keyboard-layout' });
        this.elements = layout.map(keys => {
            const rowElement = HTML.create('div', { class: 'key-row' });
            this.root.appendChild(rowElement);
            return keys.map(key => {
                const keyElement = HTML.create('div', {
                    class: ['key', ...[key.class || '']].filter(x => x.length > 0).join(' '),
                    style: `width: ${key.width}px;`,
                    'data-char': key.char,
                    'data-func': elseIfUndefined(key.func, '')
                });
                rowElement.appendChild(keyElement);
                return keyElement;
            });
        });
    }
}
//# sourceMappingURL=keyboard-layout.js.map