import { FunctionKeyLabel } from '../../keys.js'
import { Mode } from "../../mode.js"
import { UIContext } from './../../context.js'

// TODO Implement

export class CopyPatternMode extends Mode {
    constructor(context: UIContext, private readonly back: () => void) {
        super(context)

        console.log('COPY PATTERN')

    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        console.log('release', label) // TODO does not work on SHIFT key

        if (label === FunctionKeyLabel.Shift) {
            this.back()
        }
    }

    name(): string {
        return 'Copy'
    }
}