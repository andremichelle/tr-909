import { elseIfUndefined } from '../lib/common.js'
import { HTML } from '../lib/dom.js'

export interface Key {
    width: number
    char: string
    func?: string
    class?: string
}

export class KeyboardLayout {
    static QWERTY = [
        [
            { width: 32, char: '~' }, { width: 32, char: '1', func: 'Step 1', class: 'group-main' },
            { width: 32, char: '2', func: 'Step 2', class: 'group-main' },
            { width: 32, char: '3', func: 'Step 3', class: 'group-main' }, { width: 32, char: '4', func: 'Step 4', class: 'group-main' },
            { width: 32, char: '5', func: 'Step 5', class: 'group-main' }, { width: 32, char: '6', func: 'Step 6', class: 'group-main' },
            { width: 32, char: '7', func: 'Step 7', class: 'group-main' }, { width: 32, char: '8', func: 'Step 7', class: 'group-main' },
            { width: 32, char: '9', func: 'Step 9', class: 'group-main' }, { width: 32, char: '0', func: 'Step 10', class: 'group-main' },
            { width: 32, char: '-', func: 'Step 11', class: 'group-main' }, { width: 32, char: '=', func: 'Step 12', class: 'group-main' },
            { width: 50, char: 'delete', class: 'align-bottom align-right' }
        ],
        [
            { width: 50, char: '' }, { width: 32, char: 'Q', func: 'Track 1', class: 'group-track' },
            { width: 32, char: 'W', func: 'Track 2', class: 'group-track' },
            { width: 32, char: 'E', func: 'Track 3', class: 'group-track' },
            { width: 32, char: 'R', func: 'Track 4', class: 'group-track' },
            { width: 32, char: 'T', func: 'Pattern 1', class: 'group-pattern' }, { width: 32, char: 'Y', func: 'Pattern 2', class: 'group-pattern' },
            { width: 32, char: 'U', func: 'Pattern 3', class: 'group-pattern' }, { width: 32, char: 'I', func: 'Ext\nInst', class: 'group-pattern' },
            { width: 32, char: 'O' }, { width: 32, char: 'P', func: 'Step 13', class: 'group-main' }, { width: 32, char: '[', func: 'Step 14', class: 'group-main' },
            { width: 32, char: ']', func: 'Step 15', class: 'group-main' }, { width: 32, char: '\\', func: 'Step 16', class: 'group-main' }
        ],
        [
            { width: 59, char: '' },
            { width: 32, char: 'A', func: 'Last Step', class: 'group-func' },
            { width: 32, char: 'S', func: 'Scale', class: 'group-func' },
            { width: 32, char: 'D', func: 'Shuffle\n/Flam', class: 'group-func' },
            { width: 32, char: 'F', func: 'Clear', class: 'group-func' },
            { width: 32, char: 'G', func: 'Instrument\nSelect', class: 'group-func' },
            { width: 32, char: 'H', func: 'Tempo\nStep', class: 'group-other' },
            { width: 32, char: 'J', func: 'Back\nTap', class: 'group-other' },
            { width: 32, char: 'K', func: 'Fwd\nBank 1', class: 'group-other' },
            { width: 32, char: 'L', func: 'Available\nBank 2', class: 'group-other' },
            { width: 32, char: ';', func: 'Cycle\nGuide', class: 'group-other' },
            { width: 32, char: '\'', func: 'Tape\nSync', class: 'group-other' },
            { width: 59, char: 'return', class: 'align-bottom align-right group-meta', func: 'Enter' }
        ],
        [
            { width: 77, char: 'shift', class: 'align-bottom group-meta', func: 'Shift' },
            { width: 32, char: 'Z' }, { width: 32, char: 'X' }, { width: 32, char: 'C' },
            { width: 32, char: 'V' }, { width: 32, char: 'B' }, { width: 32, char: 'N' },
            { width: 32, char: 'M' }, { width: 32, char: ',' }, { width: 32, char: '.' },
            { width: 32, char: '/' }, { width: 77, char: 'shift', class: 'align-bottom align-right group-meta', func: 'Shift' }
        ],
        [
            { width: 32, char: '' }, { width: 32, char: '' },
            { width: 32, char: '' }, { width: 41, char: '' },
            { width: 176, char: '', func: 'Stop/Cont', class: 'group-meta' },
            { width: 41, char: '' }, { width: 32, char: '' },
            { width: 32, char: '' }, { width: 32, char: '' },
            { width: 32, char: '' }
        ]
    ]

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
