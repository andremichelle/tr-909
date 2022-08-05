import { FunctionKeyLabel } from '../../keys.js'
import { Mode } from "../../mode.js"
import { UIContext } from './../../context.js'

// TODO Implement

export class CopyPatternMode extends Mode {
    constructor(context: UIContext, private readonly back: () => void) {
        super(context)
    }

    onFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.Shift) {
            this.back()
        }
    }

    name(): string {
        return 'Copy'
    }
}