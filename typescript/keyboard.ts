import { HTML } from './lib/dom.js'
import { KeyboardLayout } from './lib/keyboard-layout.js'

const body = HTML.query('body')
const root = new KeyboardLayout(KeyboardLayout.QWERTY).root
body.appendChild(root)
const resize = () => {
    const w = 534
    const h = 192
    const r = 0.2
    const p = Math.min(body.clientWidth * r, body.clientHeight * r)
    const scale = Math.min((body.clientWidth - p) / w, (body.clientHeight - p) / h)
    root.style.setProperty('--scale', `${scale}`)
}
window.addEventListener('resize', () => resize())
resize()