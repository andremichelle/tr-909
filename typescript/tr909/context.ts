import {Machine} from "../audio/tr909/machine.js"
import {BankGroupIndex, PatternGroupIndex, TrackIndex} from "../audio/tr909/memory.js"
import {Pattern} from "../audio/tr909/pattern.js"
import {PlayMode} from "../audio/tr909/state.js"
import {Events, ObservableValue, ObservableValueImpl, Terminable, Terminator} from "../lib/common.js"
import {HTML} from "../lib/dom.js"
import {Digits} from "./digits.js"
import {
    BankGroupKeyIndices,
    FunctionKeyIndex,
    Key,
    KeyGroup,
    KeyState,
    MainKeyIndex,
    PatternEditModeIndices,
    PatternGroupKeyIndices,
    TrackKeyIndices
} from "./keys.js"
import {Mode} from "./modes.js"
import PatternPlayMode from "./modes/pattern-play.js"
import PatternWriteMode from "./modes/pattern-write.js"
import TrackPlayMode from "./modes/track-play.js"
import TrackWriteMode from "./modes/track-write.js"
import {InstrumentMode, Utils} from "./utils.js"

// root
// > Track-Play
// > Track-Write
// > Pattern-Play
// > Pattern-Write
//   > Clear + PatternKey (not playing)
//   > Step Edit
//     > Select instrument
//     > Last Step
//     > Clear
//   > Tap Edit
//     > Clear
//     > Guide


export enum PatternEditMode {
    Step, Tap
}

export class MachineContext implements Terminable {
    static create(machine: Machine, parentNode: ParentNode): MachineContext {
        return new MachineContext(machine,
            new KeyGroup<MainKeyIndex>([...Array.from<HTMLButtonElement>(
                HTML.queryAll('[data-control=main-keys] [data-control=main-key]', parentNode)),
                HTML.query('[data-control=main-key][data-parameter=total-accent]')]
                .map((element: HTMLButtonElement) => new Key(element))
            ),
            new KeyGroup<FunctionKeyIndex>(HTML.queryAll('[data-button=function-key]')
                .map((element: HTMLButtonElement) => new Key(element))),
            new Key(HTML.query('[data-button=shift-key]')),
            new Digits(HTML.query('svg[data-display=led-display]', parentNode)))
    }

    private readonly terminator = new Terminator()

    readonly instrumentMode: ObservableValueImpl<InstrumentMode> = new ObservableValueImpl<InstrumentMode>(InstrumentMode.Bassdrum)
    readonly patternEditMode: ObservableValueImpl<PatternEditMode> = new ObservableValueImpl<PatternEditMode>(PatternEditMode.Step)
    readonly pressedMainKeys: Set<MainKeyIndex> = new Set<MainKeyIndex>()
    readonly shiftMode: ObservableValueImpl<boolean> = new ObservableValueImpl<boolean>(false)

    private mode: NonNullable<Mode> = new TrackPlayMode(this)

    constructor(readonly machine: Machine,
                readonly mainKeys: KeyGroup<MainKeyIndex>,
                readonly functionKeys: KeyGroup<FunctionKeyIndex>,
                readonly shiftKey: Key,
                readonly digits: Digits) {
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
                if (this.mode.onFunctionKeyPress(keyIndex, this.shiftMode.get())) {
                    return
                }
                if (keyIndex === FunctionKeyIndex.TempoStep) {
                    this.digits.show(this.machine.preset.tempo.get())
                    return true
                }
            }))
            this.terminator.with(key.bind('pointerup', () => {
                if (keyIndex === FunctionKeyIndex.TempoStep) {
                    const displayValue: number | "none" = this.mode.getDisplayValue()
                    if (displayValue === 'none') {
                        this.digits.clear()
                    } else {
                        this.digits.show(displayValue)
                    }
                    return true
                }
                this.mode.onFunctionKeyRelease(keyIndex)
            }))
        })
        this.terminator.with(this.shiftKey.bind('pointerdown', (event: PointerEvent) => {
            this.shiftKey.setPointerCapture(event.pointerId)
            this.shiftMode.set(true)
        }))
        this.terminator.with(this.shiftKey.bind('pointerup', () => this.shiftMode.set(false)))
        this.terminator.with(Events.bindEventListener(window, 'keydown', (event: KeyboardEvent) => {
            const code = event.code
            if (code === 'ShiftLeft' || code === 'ShiftRight') {
                this.shiftMode.set(true)
            }
        }))
        this.terminator.with(Events.bindEventListener(window, 'keyup', (event: KeyboardEvent) => {
            const code = event.code
            if (code === 'ShiftLeft' || code === 'ShiftRight') {
                this.shiftMode.set(false)
            }
        }))
        this.terminator.with(this.shiftMode
            .addObserver(enabled => this.shiftKey
                .setState(enabled ? KeyState.On : KeyState.Off)))
        this.terminator.with(this.machine.state.cycleGuideMode
            .addObserver(mode => this.functionKeys.byIndex(FunctionKeyIndex.CycleGuideLastMeasure)
                .setState(mode ? KeyState.On : KeyState.Off), true))

        console.log(`mode: ${this.modeName()}`)
    }

    modeName(): string {
        return this.mode.name()
    }

    isPlaying(): boolean {
        return this.machine.transport.isPlaying()
    }

    maySwitchToTrackPlayMode(keyIndex: FunctionKeyIndex): boolean {
        return Utils.maySwitchToMode(keyIndex, TrackKeyIndices, index => this.switchToTrackPlayMode(index))
    }

    maySwitchToTrackWriteMode(keyIndex: FunctionKeyIndex): boolean {
        return Utils.maySwitchToMode(keyIndex, TrackKeyIndices, index => this.switchToTrackWriteMode(index))
    }

    maySwitchToPatternPlayMode(keyIndex: FunctionKeyIndex): boolean {
        return Utils.maySwitchToMode(keyIndex, PatternGroupKeyIndices, index => this.switchToPatternPlayMode(index))
    }

    maySwitchToPatternWriteMode(keyIndex: FunctionKeyIndex): boolean {
        return Utils.maySwitchToMode(keyIndex, PatternGroupKeyIndices, index => this.switchToPatternWriteMode(index))
    }

    maySwitchIndex<T extends number>(keyIndex: FunctionKeyIndex, indices: FunctionKeyIndex[], value: ObservableValue<T>): boolean {
        const index: number = indices.indexOf(keyIndex)
        if (index === -1) {
            return false
        }
        value.set(index as T)
        return true
    }

    mayToggle(keyIndex: FunctionKeyIndex, index: FunctionKeyIndex, value: ObservableValue<boolean>): boolean {
        if (keyIndex === index) {
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
        console.log(`mode: ${this.modeName()}`)
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
        console.log(`mode: ${this.modeName()}`)
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
        console.log(`mode: ${this.modeName()}`)
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
        console.log(`mode: ${this.modeName()}`)
    }

    resetMainKeys(): void {
        this.mainKeys.deactivate()
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
            ? writeMode ? KeyState.Blink : KeyState.On : KeyState.Off, TrackKeyIndices)
    }

    updatePatternGroupKeys(patternGroupIndex: PatternGroupIndex, writeMode: boolean): void {
        console.debug(`activatePatternGroupKeys(index: ${patternGroupIndex}, writeMode: ${writeMode})`)
        this.functionKeys.activate(index => patternGroupIndex === index
            ? writeMode ? KeyState.Blink : KeyState.On : KeyState.Off, PatternGroupKeyIndices)
    }

    updateBankGroupKeys(bankGroupIndex: BankGroupIndex): void {
        console.debug(`activateBankGroupKeys(index: ${bankGroupIndex})`)
        this.functionKeys.activate(index => bankGroupIndex === index
            ? KeyState.On : KeyState.Off, BankGroupKeyIndices)
    }

    updatePatternEditKeys(): void {
        const editMode = this.patternEditMode.get()
        this.functionKeys.activate(index => index === editMode
            ? KeyState.On
            : KeyState.Off, PatternEditModeIndices)
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
}