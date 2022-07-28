import {Machine} from "../audio/tr909/machine.js"
import {BankGroupIndex, PatternGroupIndex, TrackIndex} from "../audio/tr909/memory.js"
import {Pattern} from "../audio/tr909/pattern.js"
import {Scale} from "../audio/tr909/scale.js"
import {PlayMode} from "../audio/tr909/state.js"
import {
    ArrayUtils,
    Events,
    ifDefined,
    ObservableValue,
    ObservableValueImpl,
    Terminable,
    Terminator
} from "../lib/common.js"
import {HTML} from "../lib/dom.js"
import {Display, DisplayValue} from "./display.js"
import {
    FunctionKeyboardShortcuts,
    FunctionKeyIndex,
    FunctionKeyLabel,
    Key,
    KeyGroup,
    KeyState,
    MainKeyIndex,
    PatternEditMode,
    ZeroBasedIndices
} from "./keys.js"
import {Mode} from "./modes.js"
import PatternPlayMode from "./modes/pattern-play.js"
import PatternWriteMode from "./modes/pattern-write.js"
import TrackPlayMode from "./modes/track-play.js"
import TrackWriteMode from "./modes/track-write.js"
import {InstrumentMode, Utils} from "./utils.js"

export class MachineContext implements Terminable {
    static create(machine: Machine, parentNode: ParentNode): MachineContext {
        return new MachineContext(machine, new Display(HTML.query('svg[data-display=led-display]', parentNode)), new KeyGroup<MainKeyIndex>([...Array.from<HTMLButtonElement>(
            HTML.queryAll('[data-control=main-keys] [data-control=main-key]', parentNode)),
            HTML.query('[data-control=main-key][data-parameter=total-accent]')]
            .map((element: HTMLButtonElement) => new Key(element))
        ), new KeyGroup<FunctionKeyIndex>(HTML.queryAll('[data-button=function-key]')
            .map((element: HTMLButtonElement) => new Key(element))), new Key(HTML.query('[data-button=shift-key]')))
    }

    private readonly terminator = new Terminator()

    readonly instrumentMode: ObservableValueImpl<InstrumentMode> = new ObservableValueImpl<InstrumentMode>(InstrumentMode.Bassdrum)
    readonly patternEditMode: ObservableValueImpl<PatternEditMode> = new ObservableValueImpl<PatternEditMode>(PatternEditMode.Step)
    readonly pressedMainKeys: Set<MainKeyIndex> = new Set<MainKeyIndex>()
    readonly activeLabels: FunctionKeyLabel<any>[][] = ArrayUtils.fill(this.functionKeys.keys.length, () => [])
    readonly shiftMode: ObservableValueImpl<boolean> = new ObservableValueImpl<boolean>(false)

    private mode: NonNullable<Mode> = new TrackPlayMode(this)

    constructor(readonly machine: Machine,
                readonly display: Display,
                readonly mainKeys: KeyGroup<MainKeyIndex>,
                readonly functionKeys: KeyGroup<FunctionKeyIndex>,
                readonly shiftKey: Key) {
        this.mainKeys.forEach((key: Key, keyIndex: MainKeyIndex) => {
            this.terminator.with(key.bind('pointerdown', (event: PointerEvent) => {
                this.pressedMainKeys.add(keyIndex)
                key.setPointerCapture(event.pointerId)
                this.mode.onMainKeyPress(keyIndex)
            }))
            this.terminator.with(key.bind('pointerup', () => {
                this.pressedMainKeys.delete(keyIndex)
                this.mode.onMainKeyRelease(keyIndex)
            }))
        })
        this.functionKeys.forEach((key: Key, keyIndex: FunctionKeyIndex) => {
            this.terminator.with(key.bind('pointerdown', (event: PointerEvent) => {
                key.setPointerCapture(event.pointerId)
                this.onFunctionKeyPress(keyIndex)
            }))
            this.terminator.with(key.bind('pointerup', () => this.onFunctionKeyRelease(keyIndex)))
        })
        this.terminator.with(this.shiftKey.bind('pointerdown', (event: PointerEvent) => {
            this.shiftKey.setPointerCapture(event.pointerId)
            this.shiftMode.set(true)
        }))
        this.terminator.with(this.shiftKey.bind('pointerup', () => this.shiftMode.set(false)))

        this.terminator.with(Events.bindEventListener(window, 'keydown', (event: KeyboardEvent) => {
            if (event.repeat) {
                return
            }
            const code = event.code
            if (code === 'ShiftLeft' || code === 'ShiftRight') {
                this.shiftKey.setPressed(true)
                this.shiftMode.set(true)
            } else {
                ifDefined(FunctionKeyboardShortcuts.get(code),
                    (keyIndex: FunctionKeyIndex) => this.onFunctionKeyPress(keyIndex))
            }
        }))
        this.terminator.with(Events.bindEventListener(window, 'keyup', (event: KeyboardEvent) => {
            const code = event.code
            if (code === 'ShiftLeft' || code === 'ShiftRight') {
                this.shiftKey.setPressed(false)
                this.shiftMode.set(false)
            } else {
                ifDefined(FunctionKeyboardShortcuts.get(code),
                    (keyIndex: FunctionKeyIndex) => this.onFunctionKeyRelease(keyIndex))
            }
        }))
        //
        // Key states for all modes...
        //
        this.terminator.with(this.machine.state.cycleGuideMode
            .addObserver(mode => this.functionKeys.byIndex(FunctionKeyIndex.CycleGuideLastMeasure)
                .setState(mode ? KeyState.On : KeyState.Off), true))

        const patternSubscription = this.terminator.with(new Terminator())
        const indicator: SVGUseElement = HTML.query('[data-control=scale] [data-control=indicator]')
        const activePatternObserver = (pattern: Pattern) => {
            patternSubscription.terminate()
            patternSubscription.with(pattern.scale.addObserver((scale: Scale) =>
                indicator.y.baseVal.value = scale === Scale.N6D16
                    ? 0 : scale === Scale.N3D8 ? 16 : scale === Scale.D32 ? 32 : 48, true))
        }
        this.terminator.with(this.machine.state.patternIndicesChangeNotification.addObserver(activePatternObserver))
        activePatternObserver(this.machine.state.activePattern())

        console.debug(`mode: ${this.modeName()}`)
    }

    modeName(): string {
        return this.mode.name()
    }

    isPlaying(): boolean {
        return this.machine.transport.isPlaying()
    }

    maySwitchToTrackPlayMode(label: FunctionKeyLabel<any>): boolean {
        return MachineContext.mayExecWithIndex(label, FunctionKeyLabel.TrackPlay, index => this.switchToTrackPlayMode(index))
    }

    maySwitchToTrackWriteMode(label: FunctionKeyLabel<any>): boolean {
        return MachineContext.mayExecWithIndex(label, FunctionKeyLabel.TrackWrite, index => this.switchToTrackWriteMode(index))
    }

    maySwitchToPatternPlayMode(label: FunctionKeyLabel<any>): boolean {
        return MachineContext.mayExecWithIndex(label, FunctionKeyLabel.PatternPlay, index => this.switchToPatternPlayMode(index))
    }

    maySwitchToPatternWriteMode(label: FunctionKeyLabel<any>): boolean {
        return MachineContext.mayExecWithIndex(label, FunctionKeyLabel.PatternWrite, index => this.switchToPatternWriteMode(index))
    }

    maySwitchTrackIndex(label: FunctionKeyLabel<any>): boolean {
        return MachineContext.mayExecWithIndex(label, FunctionKeyLabel.TrackPlay, index => this.machine.state.trackIndex.set(index))
    }

    maySwitchBankGroupIndex(label: FunctionKeyLabel<any>): boolean {
        return MachineContext.mayExecWithIndex(label, FunctionKeyLabel.BankGroup, index => this.machine.state.bankGroupIndex.set(index))
    }

    maySwitchPatternGroupIndex(label: FunctionKeyLabel<any>): boolean {
        return MachineContext.mayExecWithIndex(label, FunctionKeyLabel.PatternPlay, index => this.machine.state.patternGroupIndex.set(index))
    }

    maySwitchPatternEditMode(label: FunctionKeyLabel<any>): boolean {
        return MachineContext.mayExecWithIndex(label, FunctionKeyLabel.PatternEditMode, index => this.patternEditMode.set(index))
    }

    mayToggle(label: FunctionKeyLabel<any>,
              compare: FunctionKeyLabel<any>,
              value: ObservableValue<boolean>): boolean {
        if (label === compare) {
            value.set(!value.get())
            return true
        }
        return false
    }

    switchToTrackPlayMode(trackIndex: TrackIndex): void {
        this.resetMainKeys()
        this.mode.terminate()
        const state = this.machine.state
        state.changeNotification.mute()
        state.trackIndex.set(trackIndex)
        state.playMode.set(PlayMode.Track)
        state.changeNotification.unmute()
        state.changeNotification.notify()
        this.mode = new TrackPlayMode(this)
        console.debug(`mode: ${this.modeName()}`)
    }

    switchToTrackWriteMode(trackIndex: TrackIndex) {
        this.resetMainKeys()
        this.mode.terminate()
        const state = this.machine.state
        state.changeNotification.mute()
        state.trackIndex.set(trackIndex)
        state.playMode.set(PlayMode.Pattern)
        state.changeNotification.unmute()
        state.changeNotification.notify()
        this.mode = new TrackWriteMode(this)
        console.debug(`mode: ${this.modeName()}`)
    }

    switchToPatternPlayMode(patternGroupIndex: PatternGroupIndex): void {
        this.resetMainKeys()
        this.mode.terminate()
        const state = this.machine.state
        state.changeNotification.mute()
        state.patternGroupIndex.set(patternGroupIndex)
        state.playMode.set(PlayMode.Pattern)
        state.changeNotification.unmute()
        state.changeNotification.notify()
        this.mode = new PatternPlayMode(this)
        console.debug(`mode: ${this.modeName()}`)
    }

    switchToPatternWriteMode(patternGroupIndex: PatternGroupIndex): void {
        this.resetMainKeys()
        this.mode.terminate()
        const state = this.machine.state
        state.changeNotification.mute()
        state.patternGroupIndex.set(patternGroupIndex)
        state.playMode.set(PlayMode.Pattern)
        state.changeNotification.unmute()
        state.changeNotification.notify()
        this.mode = new PatternWriteMode(this)
        console.debug(`mode: ${this.modeName()}`)
    }

    resetMainKeys(): void {
        this.mainKeys.deactivate()
    }

    updateDisplay(value?: DisplayValue): void {
        this.display.show(value === undefined ? this.mode.getDisplayValue() : value)
    }

    updatePatternLocationKeys(pattern: Pattern | number): void {
        console.debug(`activatePatternLocationKeys(arrayIndex: ${pattern})`)
        const location = this.machine.state.activeBank().toLocation(pattern)
        this.updatePatternGroupKeys(location.patternGroupIndex, false)
        this.mainKeys.deactivate()
        this.mainKeys.byIndex(location.patternIndex as number).setState(KeyState.Blink)
    }

    updateTrackKeys(trackIndex: TrackIndex, writeMode: boolean): void {
        console.debug(`activateTrackKeys(index: ${trackIndex}, writeMode: ${writeMode})`)
        this.functionKeys.activate(index => index === trackIndex
            ? writeMode ? KeyState.Blink : KeyState.On : KeyState.Off, ZeroBasedIndices.TrackKeys)
    }

    updatePatternGroupKeys(patternGroupIndex: PatternGroupIndex, writeMode: boolean): void {
        console.debug(`activatePatternGroupKeys(index: ${patternGroupIndex}, writeMode: ${writeMode})`)
        this.functionKeys.activate(index => patternGroupIndex === index
            ? writeMode ? KeyState.Blink : KeyState.On : KeyState.Off, ZeroBasedIndices.PatternGroupKeys)
    }

    updateBankGroupKeys(bankGroupIndex: BankGroupIndex): void {
        console.debug(`activateBankGroupKeys(index: ${bankGroupIndex})`)
        this.functionKeys.activate(index => bankGroupIndex === index
            ? KeyState.On : KeyState.Off, ZeroBasedIndices.BankGroupKeys)
    }

    watchPatternEditKeys(): Terminable {
        return this.patternEditMode.addObserver((patternEditMode: PatternEditMode) => {
            this.functionKeys.activate(index => index === patternEditMode
                ? KeyState.On
                : KeyState.Off, ZeroBasedIndices.PatternEditModes)
        }, true)
    }

    clearPatternEditKeys(): void {
        this.functionKeys.deactivate(ZeroBasedIndices.PatternEditModes)
    }

    watchPatternLocationKeys(): Terminable {
        this.updatePatternLocationKeys(this.machine.state.activePattern())
        return this.machine.state.patternIndicesChangeNotification
            .addObserver(pattern => this.updatePatternLocationKeys(pattern))
    }

    watchPatternStepsKeys(): Terminable {
        const terminator = new Terminator()
        const state = this.machine.state
        const updateKeys = () => {
            const pattern: Pattern = this.machine.state.activePattern()
            const mapping = Utils.createStepToStateMapping(this.instrumentMode.get())
            this.mainKeys.forEach((key: Key, keyIndex: MainKeyIndex) =>
                key.setState(keyIndex === MainKeyIndex.TotalAccent ? KeyState.Off : mapping(pattern, keyIndex)))
        }
        let patternSubscription = state.activePattern().addObserver(() => updateKeys(), true)
        terminator.with({terminate: () => patternSubscription.terminate()})
        terminator.with(state.patternIndicesChangeNotification.addObserver((pattern: Pattern) => {
            patternSubscription.terminate()
            patternSubscription = pattern.addObserver(() => updateKeys(), true)
        }))
        return terminator
    }

    startStepRunningAnimation(): Terminable {
        const terminator = new Terminator()
        let flashing: Key = null
        terminator.with({
            terminate: () => {
                if (flashing !== null) {
                    flashing.applyState()
                    flashing = null
                }
            }
        })
        terminator.with(this.machine.processorStepIndex.addObserver(stepIndex => {
            if (flashing !== null) {
                flashing.applyState()
            }
            flashing = this.mainKeys.byIndex(stepIndex)
            flashing.flash()
        }))
        return terminator
    }

    playInstrument(keyIndex: MainKeyIndex): void {
        if (keyIndex === MainKeyIndex.TotalAccent) return
        const instrument = Utils.keyIndexToPlayInstrument(keyIndex, this.pressedMainKeys)
        const channelIndex = instrument.channelIndex
        const step = instrument.step
        this.machine.play(channelIndex, step)
    }

    terminate(): void {
        this.terminator.terminate()
    }

    private onFunctionKeyPress(keyIndex: FunctionKeyIndex): void {
        console.debug(`onFunctionKeyPress(${FunctionKeyIndex[keyIndex]})`)
        this.functionKeys.byIndex(keyIndex).setPressed(true)
        if (this.shiftMode.get()) {
            this.activeLabels[keyIndex].push(FunctionKeyLabel.ShiftKeys[keyIndex])
            if (this.mode.onFunctionKeyPress(FunctionKeyLabel.ShiftKeys[keyIndex])) {
                return
            }
        } else {
            const label = FunctionKeyLabel.NormalKeys[keyIndex]
            this.activeLabels[keyIndex].push(label)
            if (label === FunctionKeyLabel.Tempo) {
                this.display.show(this.machine.preset.tempo.get())
                return
            }
            if (this.mode.onFunctionKeyPress(label)) {
                return
            }
        }
    }

    private onFunctionKeyRelease(keyIndex: FunctionKeyIndex): void {
        console.debug(`onFunctionKeyRelease(${FunctionKeyIndex[keyIndex]})`)
        this.functionKeys.byIndex(keyIndex).setPressed(false)
        const labels = this.activeLabels[keyIndex]
        labels.splice(0, labels.length).forEach((label: FunctionKeyLabel<any>) => {
            if (label === FunctionKeyLabel.Tempo) {
                this.updateDisplay(this.mode.getDisplayValue())
            }
            this.mode.onFunctionKeyRelease(label)
        })
    }

    private static mayExecWithIndex<T>(label: FunctionKeyLabel<any>,
                                       choices: ReadonlyArray<FunctionKeyLabel<T>>,
                                       exec: (value: T) => void): boolean {
        const index = choices.indexOf(label)
        if (index === -1) return false
        exec(choices[index].value)
        return true
    }
}