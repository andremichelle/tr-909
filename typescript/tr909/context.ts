import {secondsToBars} from "../audio/common.js"
import {Machine} from "../audio/tr909/machine.js"
import {
    BankIndex,
    Memory,
    MemoryBank,
    Pattern,
    PatternGroupIndex,
    PatternLocation,
    ScaleIndex,
    TrackIndex
} from "../audio/tr909/memory.js"
import {PlayMode, State} from "../audio/tr909/state.js"
import {Track} from "../audio/tr909/track.js"
import {
    ArrayUtils,
    Events,
    ifDefined,
    ObservableValue,
    ObservableValueImpl,
    Option,
    Options,
    Terminable,
    TerminableVoid,
    Terminator
} from "../lib/common.js"
import {HTML, SVG} from "../lib/dom.js"
import {Display, DisplayObservableValueProvider} from "./display.js"
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
import {Knob} from "./knobs.js"
import {complete, Mode} from "./mode.js"
import PatternPlayMode from "./modes/pattern-play.js"
import PatternWriteMode from "./modes/pattern-write.js"
import TrackPlayMode from "./modes/track-play.js"
import TrackWriteMode from "./modes/track-write.js"
import {InstrumentMode, Utils} from "./utils.js"

export class UIContext implements Terminable {
    private readonly terminator = new Terminator()

    private readonly tempoDisplayProvider: DisplayObservableValueProvider
    private readonly userInputDisplayProvider: DisplayObservableValueProvider

    readonly display: Display
    readonly mainKeys: KeyGroup<MainKeyIndex>
    readonly functionKeys: KeyGroup<FunctionKeyIndex>

    readonly instrumentMode: ObservableValueImpl<InstrumentMode>
    readonly patternEditMode: ObservableValueImpl<PatternEditMode>
    readonly activeLabels: FunctionKeyLabel<any>[][]
    readonly userInputDigits: Uint8Array
    readonly displayInputNumber: ObservableValue<number> = new ObservableValueImpl<number>(0)

    readonly multiTapsEmulated: Map<Key, Option<Finger>> = new Map<Key, Option<Finger>>()

    private mode: NonNullable<Mode>
    private isUserInputting: boolean = false

    private tempoDisplaySubscription: Terminable = TerminableVoid
    private userInputSubscription: Terminable = TerminableVoid

    constructor(readonly machine: Machine,
                readonly parentNode: HTMLElement) {
        this.display = new Display(HTML.query('svg[data-display=led-display]', parentNode))
        this.mainKeys = new KeyGroup<MainKeyIndex>([...Array.from<HTMLButtonElement>(
            HTML.queryAll('[data-control=main-keys] [data-control=main-key]', parentNode)),
            HTML.query('[data-control=main-key][data-parameter=total-accent]')]
            .map((element: HTMLButtonElement, index: number) => new Key(element, 'main', index)))
        this.functionKeys = new KeyGroup<FunctionKeyIndex>(HTML.queryAll('[data-button=function-key]')
            .map((element: HTMLButtonElement, keyIndex: number) => new Key(element, 'function', keyIndex)))

        this.instrumentMode = new ObservableValueImpl<InstrumentMode>(InstrumentMode.Bassdrum)
        this.patternEditMode = new ObservableValueImpl<PatternEditMode>(PatternEditMode.Step)
        this.activeLabels = ArrayUtils.fill(this.functionKeys.keys.length, () => [])
        this.userInputDigits = new Uint8Array(3)

        this.tempoDisplayProvider = new DisplayObservableValueProvider(this.machine.preset.tempo)
        this.userInputDisplayProvider = new DisplayObservableValueProvider(this.displayInputNumber)
        this.terminator.with(this.displayInputNumber.addObserver(integer => {
            this.userInputDigits[0] = (integer / 100) % 10
            this.userInputDigits[1] = (integer / 10) % 10
            this.userInputDigits[2] = integer % 10
        }, false))

        this.mode = new TrackPlayMode(this)

        this.installKeys()
        this.installKeyboard()
        this.installKnobs()
        this.installTransport()
        this.installAnimationFrame()

        //
        // Key states for all modes...
        //
        this.terminator.with(this.machine.memory.state.cycleGuideMode
            .addObserver(mode => this.functionKeys.byIndex(FunctionKeyIndex.CycleGuideLastMeasure)
                .setState(mode ? KeyState.On : KeyState.Off), true))

        const patternSubscription = this.terminator.with(new Terminator())
        const indicator: SVGUseElement = HTML.query('[data-control=scale] [data-control=indicator]')
        const activePatternObserver = (pattern: Pattern) => {
            patternSubscription.terminate()
            patternSubscription.with(pattern.scaleIndex.addObserver((scaleIndex: ScaleIndex) =>
                indicator.y.baseVal.value = scaleIndex * 16, true))
        }
        this.terminator.with(this.machine.memory.state.patternIndicesChangeNotification.addObserver(activePatternObserver))
        activePatternObserver(this.machine.memory.state.activePattern())

        console.debug(`mode: ${this.modeName()}`)
    }

    modeName(): string {
        return this.mode.name()
    }

    isPlaying(): boolean {
        return this.machine.transport.isPlaying()
    }

    memory(): Memory {
        return this.machine.memory
    }

    memoryState(): State {
        return this.memory().state
    }

    activeBank(): MemoryBank {
        return this.memoryState().activeBank()
    }

    activeTrack(): Track {
        return this.memoryState().activeTrack()
    }

    activePattern(): Pattern {
        return this.memoryState().activePattern()
    }

    maySwitchToTrackPlayMode(label: FunctionKeyLabel<any>): boolean {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.TrackPlay, index => this.switchToTrackPlayMode(index))
    }

    maySwitchToTrackWriteMode(label: FunctionKeyLabel<any>): boolean {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.TrackWrite, index => this.switchToTrackWriteMode(index))
    }

    maySwitchToPatternPlayMode(label: FunctionKeyLabel<any>): boolean {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.PatternPlay, index => this.switchToPatternPlayMode(index))
    }

    maySwitchToPatternWriteMode(label: FunctionKeyLabel<any>): boolean {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.PatternWrite, index => this.switchToPatternWriteMode(index))
    }

    maySwitchTrackIndex(label: FunctionKeyLabel<any>): boolean {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.TrackPlay, index => this.machine.memory.state.trackIndex.set(index))
    }

    maySwitchBankGroupIndex(label: FunctionKeyLabel<any>): boolean {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.BankGroup, index => this.machine.memory.state.bankGroupIndex.set(index))
    }

    maySwitchPatternGroupIndex(label: FunctionKeyLabel<any>): boolean {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.PatternPlay, index => this.machine.memory.state.patternGroupIndex.set(index))
    }

    maySwitchPatternEditMode(label: FunctionKeyLabel<any>): boolean {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.PatternEditMode, index => this.patternEditMode.set(index))
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
        const state = this.machine.memory.state
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
        const state = this.machine.memory.state
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
        const state = this.machine.memory.state
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
        const state = this.machine.memory.state
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

    updatePatternLocationKeys(location: PatternLocation): void {
        console.debug(`updatePatternLocationKeys(location: [${location.patternGroupIndex}, ${location.patternIndex}])`)
        this.updatePatternGroupKeys(location.patternGroupIndex, false)
        this.mainKeys.deactivate()

        let patternIndex: number = location.patternIndex
        this.mainKeys.byIndex(patternIndex).setState(KeyState.Blink)

        while (this.memoryState().activeBank().patternGroups[location.patternGroupIndex].chained[patternIndex++]) {
            this.mainKeys.byIndex(patternIndex).setState(KeyState.On)
        }
    }

    updateTrackKeys(trackIndex: TrackIndex, writeMode: boolean): void {
        console.debug(`updateTrackKeys(index: ${trackIndex}, writeMode: ${writeMode})`)
        this.functionKeys.activate(index => index === trackIndex
            ? writeMode ? KeyState.Blink : KeyState.On : KeyState.Off, ZeroBasedIndices.TrackKeys)
    }

    updatePatternGroupKeys(patternGroupIndex: PatternGroupIndex, writeMode: boolean): void {
        console.debug(`updatePatternGroupKeys(index: ${patternGroupIndex}, writeMode: ${writeMode})`)
        this.functionKeys.activate(index => patternGroupIndex === index
            ? writeMode ? KeyState.Blink : KeyState.On : KeyState.Off, ZeroBasedIndices.PatternGroupKeys)
    }

    updateBankGroupKeys(bankGroupIndex: BankIndex): void {
        console.debug(`updateBankGroupKeys(index: ${bankGroupIndex})`)
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
        this.updatePatternLocationKeys(this.activePattern().location)
        return this.memoryState().patternIndicesChangeNotification
            .addObserver(pattern => this.updatePatternLocationKeys(pattern.location))
    }

    watchPatternStepsKeys(): Terminable {
        const terminator = new Terminator()
        const state = this.machine.memory.state
        const updateKeys = () => {
            const pattern: Pattern = this.activePattern()
            const mapping = Utils.createStepToStateMapping(this.instrumentMode.get())
            this.mainKeys.forEach((key: Key, keyIndex: MainKeyIndex) =>
                key.setState(keyIndex === MainKeyIndex.CartridgeEnterTotalAccent ? KeyState.Off : mapping(pattern, keyIndex)))
        }
        let patternSubscription = state.activePattern().addObserver(() => updateKeys(), true)
        terminator.with({
            terminate: () => {
                patternSubscription.terminate()
                patternSubscription = TerminableVoid
            }
        })
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
        if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent || this.isShiftKeyPressed()) return
        const instrument = Utils.keyIndexToPlayInstrument(keyIndex, this.getConcurrentMainKeys())
        const channelIndex = instrument.channelIndex
        const step = instrument.step
        this.machine.play(channelIndex, step)
    }

    isShiftKeyPressed(): boolean {
        return this.multiTapsEmulated.has(this.functionKeys.byIndex(FunctionKeyIndex.Shift))
    }

    getConcurrentMainKeys(): Set<MainKeyIndex> {
        return new Set<MainKeyIndex>([...this.multiTapsEmulated.keys()].filter(key => key.isMainKey()).map(key => key.keyIndex))
    }

    startUserNumberInput() {
        if (!this.isUserInputting) {
            console.debug('startUserNumberInput')
            this.isUserInputting = true
            this.userInputDigits.fill(0)
            this.userInputSubscription = this.display.pushProvider(this.userInputDisplayProvider)
        }
    }

    stopUserNumberInput(): void {
        if (this.isUserInputting) {
            console.debug('stopUserNumberInput')
            this.isUserInputting = false
            this.userInputSubscription.terminate()
            this.userInputSubscription = TerminableVoid
        }
    }

    terminate(): void {
        this.terminator.terminate()
    }

    private static mayExecOnIndexedChoice<T>(label: FunctionKeyLabel<any>,
                                             choices: ReadonlyArray<FunctionKeyLabel<T>>,
                                             exec: (value: T) => void): boolean {
        const index = choices.indexOf(label)
        if (index === -1) return false
        exec(choices[index].value)
        return true
    }

    private installKeys(): void {
        this.functionKeys.forEach((key: Key, keyIndex: FunctionKeyIndex) => {
            this.terminator.with(key.bind('pointerdown', (event: PointerEvent) => {
                key.setPointerCapture(event.pointerId)
                if (event.shiftKey && !this.multiTapsEmulated.has(key)) {
                    const complete = keyIndex !== FunctionKeyIndex.Shift && this.onFunctionKeyPress(keyIndex)
                    console.debug(`onFunctionKeyPress(${keyIndex} => complete: ${complete}) [emulated]`)
                    if (!complete) {
                        this.multiTapsEmulated.set(key, Options.valueOf(new Finger(this.parentNode).align(key)))
                    }
                } else {
                    const complete = this.onFunctionKeyPress(keyIndex)
                    console.debug(`onFunctionKeyPress(${keyIndex} => complete: ${complete})`)
                }
            }))
            this.terminator.with(key.bind('pointerup', () => {
                if (!this.multiTapsEmulated.has(key)) {
                    this.onFunctionKeyRelease(keyIndex)
                }
            }))
        })
        this.mainKeys.forEach((key: Key, keyIndex: MainKeyIndex) => {
            this.terminator.with(key.bind('pointerdown', (event: PointerEvent) => {
                key.setPointerCapture(event.pointerId)
                key.setPressed(true)
                if (this.isShiftKeyPressed() && !this.isPlaying()) {
                    if (keyIndex <= MainKeyIndex.Step10) {
                        this.startUserNumberInput()
                        this.userInputDigits[0] = this.userInputDigits[1]
                        this.userInputDigits[1] = this.userInputDigits[2]
                        this.userInputDigits[2] = (keyIndex + 1) % 10
                        this.displayInputNumber.set(
                            this.userInputDigits[0] * 100 +
                            this.userInputDigits[1] * 10 +
                            this.userInputDigits[2])
                    } else if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent) {
                        const number = this.displayInputNumber.get()
                        console.debug(`setMainKeyValue(${number})`)
                        this.mode.setMainKeyValue(number)
                        this.stopUserNumberInput()
                    }
                } else {
                    if (event.shiftKey && !this.multiTapsEmulated.has(key) && keyIndex !== MainKeyIndex.CartridgeEnterTotalAccent) {
                        const consumed = this.mode.onMainKeyPress(keyIndex)
                        console.debug(`onMainKeyPress(${keyIndex} => consumed: ${consumed}) [emulated]`)
                        if (!consumed) {
                            this.multiTapsEmulated.set(key, Options.valueOf(new Finger(this.parentNode).align(key)))
                        }
                    } else {
                        const consumed = this.mode.onMainKeyPress(keyIndex)
                        console.debug(`onMainKeyPress(${keyIndex} => consumed: ${consumed})`)
                    }
                }
            }))
            this.terminator.with(key.bind('pointerup', () => {
                if (!this.multiTapsEmulated.has(key)) {
                    key.setPressed(false)
                }
            }))
        })
    }

    private onFunctionKeyPress(keyIndex: FunctionKeyIndex): complete {
        this.functionKeys.byIndex(keyIndex).setPressed(true)
        if (this.isShiftKeyPressed()) {
            this.activeLabels[keyIndex].push(FunctionKeyLabel.ShiftKeys[keyIndex])
            return this.mode.onFunctionKeyPress(FunctionKeyLabel.ShiftKeys[keyIndex])
        } else {
            const label = FunctionKeyLabel.NormalKeys[keyIndex]
            this.activeLabels[keyIndex].push(label)
            if (label === FunctionKeyLabel.Tempo) {
                this.tempoDisplaySubscription = this.display.pushProvider(this.tempoDisplayProvider)
                return true
            }
            return this.mode.onFunctionKeyPress(label)
        }
    }

    private onFunctionKeyRelease(keyIndex: FunctionKeyIndex): void {
        console.debug(`onFunctionKeyRelease(${FunctionKeyIndex[keyIndex]})`)
        this.functionKeys.byIndex(keyIndex).setPressed(false)
        const labels = this.activeLabels[keyIndex]
        labels.splice(0, labels.length).forEach((label: FunctionKeyLabel<any>) => {
            if (label === FunctionKeyLabel.Tempo) {
                this.tempoDisplaySubscription.terminate()
                this.tempoDisplaySubscription = TerminableVoid
            } else {
                this.mode.onFunctionKeyRelease(label)
            }
        })
    }

    private installKeyboard() {
        this.terminator.with(Events.bindEventListener(window, 'keydown', (event: KeyboardEvent) => {
            if (event.repeat) {
                return
            }
            ifDefined(FunctionKeyboardShortcuts.get(event.code),
                (keyIndex: FunctionKeyIndex) => this.onFunctionKeyPress(keyIndex))
        }))
        this.terminator.with(Events.bindEventListener(window, 'keyup', (event: KeyboardEvent) => {
            if (!event.shiftKey && this.multiTapsEmulated.size > 0) {
                this.stopUserNumberInput()
                this.multiTapsEmulated.forEach((finger: Option<Finger>, key: Key) => {
                    finger.ifPresent(finger => finger.terminate())
                    if (key.type === 'main') {
                        this.mainKeys.byIndex(key.keyIndex).setPressed(false)
                    } else if (key.type === 'function') {
                        this.onFunctionKeyRelease(key.keyIndex)
                    }
                })
                this.multiTapsEmulated.clear()
            } else {
                ifDefined(FunctionKeyboardShortcuts.get(event.code),
                    (keyIndex: FunctionKeyIndex) => this.onFunctionKeyRelease(keyIndex))
            }
        }))
    }

    private installKnobs(): void {
        const terminator = this.terminator
        const parentNode = this.parentNode
        const preset = this.machine.preset
        terminator.with(new Knob(HTML.query('[data-parameter=tempo]', parentNode), preset.tempo))
        terminator.with(new Knob(HTML.query('[data-parameter=volume]', parentNode), preset.volume))
        terminator.with(new Knob(HTML.query('[data-instrument=global] [data-parameter=accent]', parentNode), preset.accent))
        const bassdrumGroup = HTML.query('[data-instrument=bassdrum]', parentNode)
        terminator.with(new Knob(HTML.query('[data-parameter=tune]', bassdrumGroup), preset.bassdrum.tune))
        terminator.with(new Knob(HTML.query('[data-parameter=level]', bassdrumGroup), preset.bassdrum.level))
        terminator.with(new Knob(HTML.query('[data-parameter=attack]', bassdrumGroup), preset.bassdrum.attack))
        terminator.with(new Knob(HTML.query('[data-parameter=decay]', bassdrumGroup), preset.bassdrum.decay))
        const snaredrumGroup = HTML.query('[data-instrument=snaredrum]', parentNode)
        terminator.with(new Knob(HTML.query('[data-parameter=tune]', snaredrumGroup), preset.snaredrum.tune))
        terminator.with(new Knob(HTML.query('[data-parameter=level]', snaredrumGroup), preset.snaredrum.level))
        terminator.with(new Knob(HTML.query('[data-parameter=tone]', snaredrumGroup), preset.snaredrum.tone))
        terminator.with(new Knob(HTML.query('[data-parameter=snappy]', snaredrumGroup), preset.snaredrum.snappy))
        const tomLowGroup = HTML.query('[data-instrument=low-tom]', parentNode)
        terminator.with(new Knob(HTML.query('[data-parameter=tune]', tomLowGroup), preset.tomLow.tune))
        terminator.with(new Knob(HTML.query('[data-parameter=level]', tomLowGroup), preset.tomLow.level))
        terminator.with(new Knob(HTML.query('[data-parameter=decay]', tomLowGroup), preset.tomLow.decay))
        const tomMidGroup = HTML.query('[data-instrument=mid-tom]', parentNode)
        terminator.with(new Knob(HTML.query('[data-parameter=tune]', tomMidGroup), preset.tomMid.tune))
        terminator.with(new Knob(HTML.query('[data-parameter=level]', tomMidGroup), preset.tomMid.level))
        terminator.with(new Knob(HTML.query('[data-parameter=decay]', tomMidGroup), preset.tomMid.decay))
        const tomHiGroup = HTML.query('[data-instrument=hi-tom]', parentNode)
        terminator.with(new Knob(HTML.query('[data-parameter=tune]', tomHiGroup), preset.tomHi.tune))
        terminator.with(new Knob(HTML.query('[data-parameter=level]', tomHiGroup), preset.tomHi.level))
        terminator.with(new Knob(HTML.query('[data-parameter=decay]', tomHiGroup), preset.tomHi.decay))
        const rimClapGroup = HTML.query('[data-instrument=rim-clap]', parentNode)
        terminator.with(new Knob(HTML.query('[data-parameter=rim-level]', rimClapGroup), preset.rim.level))
        terminator.with(new Knob(HTML.query('[data-parameter=clap-level]', rimClapGroup), preset.clap.level))
        const hihatGroup = HTML.query('[data-instrument=hihat]', parentNode)
        terminator.with(new Knob(HTML.query('[data-parameter=level]', hihatGroup), preset.hihatLevel))
        terminator.with(new Knob(HTML.query('[data-parameter=cl-decay]', hihatGroup), preset.closedHihat.decay))
        terminator.with(new Knob(HTML.query('[data-parameter=op-decay]', hihatGroup), preset.openedHihat.decay))
        const cymbalParent = HTML.query('[data-instrument=cymbal]', parentNode)
        terminator.with(new Knob(HTML.query('[data-parameter=crash-level]', cymbalParent), preset.crash.level))
        terminator.with(new Knob(HTML.query('[data-parameter=ride-level]', cymbalParent), preset.ride.level))
        terminator.with(new Knob(HTML.query('[data-parameter=crash-tune]', cymbalParent), preset.crash.tune))
        terminator.with(new Knob(HTML.query('[data-parameter=ride-tune]', cymbalParent), preset.ride.tune))
    }

    private installTransport() {
        // Use Events and terminate
        const transport = this.machine.transport
        HTML.query('button[data-control=transport-start]', this.parentNode)
            .addEventListener('pointerdown', () => {
                if (!transport.isPlaying()) {
                    transport.moveTo(0.0)
                    transport.play()
                }
            })
        HTML.query('button[data-control=transport-stop-continue]', this.parentNode)
            .addEventListener('pointerdown', () => transport.togglePlayback())
        window.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Space' && !event.repeat) {
                transport.togglePlayback()
            }
        })
    }

    private installAnimationFrame(): void {
        let running = true
        let blink = true
        let frame: number = 0 | 0
        let position: number = 0.0
        let lastTime: number = Date.now()
        const next = () => {
            const now = Date.now()
            const elapsedTime = (now - lastTime) / 1000.0
            position += secondsToBars(elapsedTime, this.machine.preset.tempo.get()) * 8.0
            lastTime = now
            if (position >= 1.0) {
                HTML.queryAll('.blink-enabled', this.parentNode).forEach(element => element.classList.toggle('enabled', blink))
                blink = !blink
                position -= 1.0
            }
            const flash: boolean = frame % 4 < 2
            HTML.queryAll('.flash-enabled', this.parentNode).forEach(element => element.classList.toggle('enabled', flash))
            frame++
            this.multiTapsEmulated.forEach((finger: Option<Finger>, key: Key) => finger
                .ifPresent(finger => finger.align(key)))
            if (running) {
                requestAnimationFrame(next)
            }
        }
        requestAnimationFrame(next)
        this.terminator.with({terminate: () => running = false})
    }
}

class Finger implements Terminable {
    private readonly svg = SVG.createUse('#finger', 64, 64, {class: 'tap-finger'})

    constructor(private readonly parentNode: HTMLElement) {
        this.parentNode.appendChild(this.svg)
    }

    align(key: Key): this {
        const keyRect = key.touchPoint()
        const parentRect = this.parentNode.getBoundingClientRect()
        const scale = parseFloat(this.parentNode.style.getPropertyValue("--scale"))
        this.svg.style.left = `${(keyRect.x - parentRect.left) / scale}px`
        this.svg.style.top = `${(keyRect.y - parentRect.top) / scale}px`
        return this
    }

    terminate(): void {
        this.svg.remove()
    }
}