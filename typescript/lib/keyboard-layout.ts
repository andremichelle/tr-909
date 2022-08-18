import { elseIfUndefined } from './common.js'
import { HTML } from './dom.js'

export interface Key {
    width: number
    char: string
    func?: string
    class?: string
}

export class KeyboardLayout {
    readonly root: HTMLElement = HTML.create('div', { class: 'keyboard-layout' })
    readonly elements: HTMLDivElement[][]

    constructor(layout: Key[][]) {
        this.elements = layout.map(keys => {
            const rowElement = HTML.create('div', { class: 'key-row' })
            this.root.appendChild(rowElement)
            return keys.map(key => {
                const keyElement = HTML.create('div', {
                    class: ['key', ...[key.class || '']].filter(x => x.length > 0).join(' '),
                    style: `width: ${key.width}px;`,
                    'data-char': key.char,
                    'data-func': elseIfUndefined(key.func, '')
                })
                rowElement.appendChild(keyElement)
                return keyElement
            })
        })
    }
}