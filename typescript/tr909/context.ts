import { secondsToBars } from "../audio/common.js"
import { Machine } from "../audio/tr909/machine.js"
import {
    BankIndex,
    Memory,
    MemoryBank,
    Pattern,
    PatternGroup,
    PatternGroupIndex,
    PatternLocation,
    ScaleIndex,
    TrackIndex
} from "../audio/tr909/memory.js"
import { PlayMode, State } from "../audio/tr909/state.js"
import { Track } from "../audio/tr909/track.js"
import {
    ArrayUtils, Events,
    ifDefined,
    ObservableValue,
    ObservableValueImpl, Terminable,
    TerminableVoid,
    Terminator
} from "../lib/common.js"
import { AnimationFrame, HTML, SVG } from "../lib/dom.js"
import { Option, Options } from './../lib/common.js'
import { DigitInput, Display, DisplayObservableValueProvider } from "./display.js"
import {
    FunctionKeyIndex,
    FunctionKeyLabel, FunctionKeyShortcuts, Key,
    KeyGroup,
    KeyState,
    MainKeyIndex,
    MainKeyLabel, MainKeyShortcuts, ZeroBasedIndices
} from "./keys.js"
import { Knob } from "./knobs.js"
import { complete, Mode, StepsEditingMode } from "./mode.js"
import PatternPlayMode from "./modes/pattern-play.js"
import PatternWriteMode from "./modes/pattern-write.js"
import TrackPlayMode from "./modes/track-play.js"
import TrackWriteMode from "./modes/track-write.js"
import { InstrumentMode, Utils } from "./utils.js"

export class UIContext implements Terminable {
    private readonly terminator = new Terminator()

    private readonly tempoDisplayProvider: DisplayObservableValueProvider

    readonly display: Display
    readonly digitInput: DigitInput
    readonly startKey: HTMLButtonElement
    readonly mainKeys: KeyGroup<MainKeyIndex>
    readonly functionKeys: KeyGroup<FunctionKeyIndex>

    readonly mode: ObservableValue<Mode>
    readonly instrumentMode: ObservableValueImpl<InstrumentMode>
    readonly stepsEditMode: ObservableValueImpl<StepsEditingMode>
    readonly activeMainLabels: Option<MainKeyLabel<any>>[]
    readonly activeFunctionLabels: Option<FunctionKeyLabel<any>>[]
    readonly concurrentMainKeys = new Set<MainKeyIndex>()

    private isShiftKeyPressed: boolean = false
    private tempoProviderSubscription: Terminable = TerminableVoid

    constructor(readonly machine: Machine, readonly parentNode: HTMLElement) {
        this.display = new Display(HTML.query('svg[data-display=led-display]', parentNode))
        this.digitInput = this.terminator.with(new DigitInput(this.display))
        this.startKey = HTML.query('button[data-control=transport-start]', this.parentNode)
        this.mainKeys = new KeyGroup<MainKeyIndex>([...Array.from<HTMLButtonElement>(
            HTML.queryAll('[data-control=main-keys] [data-control=main-key]', parentNode)),
        HTML.query('[data-control=main-key][data-parameter=total-accent]')]
            .map((element: Element, index: number) => new Key(element as HTMLButtonElement, 'main', index)))
        this.functionKeys = new KeyGroup<FunctionKeyIndex>(HTML.queryAll('[data-button=function-key]')
            .map((element: Element, keyIndex: number) => new Key(element as HTMLButtonElement, 'function', keyIndex)))

        this.instrumentMode = new ObservableValueImpl<InstrumentMode>(InstrumentMode.Bassdrum)
        this.stepsEditMode = new ObservableValueImpl<StepsEditingMode>(StepsEditingMode.Step)
        this.activeMainLabels = ArrayUtils.fill(this.mainKeys.keys.length, () => Options.None)
        this.activeFunctionLabels = ArrayUtils.fill(this.functionKeys.keys.length, () => Options.None)

        this.tempoDisplayProvider = new DisplayObservableValueProvider(this.machine.preset.tempo)

        this.mode = new ObservableValueImpl<Mode>(new TrackPlayMode(this))

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
        return this.mode.get().name()
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

    activePatternGroup(): PatternGroup {
        return this.memoryState().activePatternGroup()
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
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.StepsEditingModes, index => this.stepsEditMode.set(index))
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
        this.mode.get().terminate()
        const state = this.machine.memory.state
        state.changeNotification.mute()
        state.trackIndex.set(trackIndex)
        state.playMode.set(PlayMode.Track)
        state.changeNotification.unmute()
        state.changeNotification.notify()
        this.mode.set(new TrackPlayMode(this))
        console.debug(`mode: ${this.modeName()}`)
    }

    switchToTrackWriteMode(trackIndex: TrackIndex) {
        this.resetMainKeys()
        this.mode.get().terminate()
        const state = this.machine.memory.state
        state.changeNotification.mute()
        state.trackIndex.set(trackIndex)
        state.playMode.set(PlayMode.Pattern)
        state.changeNotification.unmute()
        state.changeNotification.notify()
        this.mode.set(new TrackWriteMode(this))
        console.debug(`mode: ${this.modeName()}`)
    }

    switchToPatternPlayMode(patternGroupIndex: PatternGroupIndex): void {
        this.resetMainKeys()
        this.mode.get().terminate()
        const state = this.machine.memory.state
        state.changeNotification.mute()
        state.patternGroupIndex.set(patternGroupIndex)
        state.playMode.set(PlayMode.Pattern)
        state.changeNotification.unmute()
        state.changeNotification.notify()
        this.mode.set(new PatternPlayMode(this))
        console.debug(`mode: ${this.modeName()}`)
    }

    switchToPatternWriteMode(patternGroupIndex: PatternGroupIndex): void {
        this.resetMainKeys()
        this.mode.get().terminate()
        const state = this.machine.memory.state
        state.changeNotification.mute()
        state.patternGroupIndex.set(patternGroupIndex)
        state.playMode.set(PlayMode.Pattern)
        state.changeNotification.unmute()
        state.changeNotification.notify()
        this.mode.set(new PatternWriteMode(this))
        console.debug(`mode: ${this.modeName()}`)
    }

    resetMainKeys(): void {
        this.mainKeys.deactivate()
    }

    updatePatternLocationKeys(location: PatternLocation, writeMode: boolean = false): void {
        console.debug(`updatePatternLocationKeys(location: [${location.patternGroupIndex}, ${location.patternIndex}])`)
        this.updatePatternGroupKeys(location.patternGroupIndex, writeMode)
        this.mainKeys.deactivate()
        const patternIndex: number = this.activeBank()
            .patternGroups[location.patternGroupIndex]
            .firstOfChained(location.patternIndex).location.patternIndex
        const chained = this.memoryState().activeBank().patternGroups[location.patternGroupIndex].getChained()
        let index: MainKeyIndex = patternIndex
        do {
            this.mainKeys.byIndex(index).setState(KeyState.On)
        } while (chained[index++])

        this.mainKeys.byIndex(location.patternIndex as number).setState(KeyState.Blink)
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
        return this.stepsEditMode.addObserver((patternEditMode: StepsEditingMode) => {
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
        let flashing: Key | null = null
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
        if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent || this.isShiftKeyPressed) return
        const instrument = Utils.keyIndexToPlayInstrument(keyIndex, this.getConcurrentMainKeys())
        const channelIndex = instrument.channelIndex
        const step = instrument.step
        this.machine.play(channelIndex, step)
    }

    getConcurrentMainKeys(): Set<MainKeyIndex> {
        return this.concurrentMainKeys
    }

    terminate(): void {
        this.terminator.terminate()
    }

    static mayExecOnIndexedChoice<T>(label: FunctionKeyLabel<any>,
        choices: ReadonlyArray<FunctionKeyLabel<T>>,
        exec: (value: T) => void): boolean {
        const index = choices.indexOf(label)
        if (index === -1) return false
        exec(choices[index].value)
        return true
    }

    private installKeys(): void {
        this.functionKeys.forEach((key: Key, keyIndex: FunctionKeyIndex) => {
            this.terminator.with(Events.bind(key.element, 'pointerdown', (event: PointerEvent) => {
                key.setPointerCapture(event.pointerId)
                const complete = this.onFunctionKeyPress(keyIndex)
            }))
            this.terminator.with(Events.bind(key.element, 'pointerup', () => {
                this.onFunctionKeyRelease(keyIndex)
            }))
        })
        this.mainKeys.forEach((key: Key, keyIndex: MainKeyIndex) => {
            this.terminator.with(Events.bind(key.element, 'pointerdown', (event: PointerEvent) => {
                key.setPointerCapture(event.pointerId)
                const complete = this.onMainKeyPress(keyIndex)
            }))
            this.terminator.with(Events.bind(key.element, 'pointerup', () => {
                key.setPressed(false)
                this.onMainKeyRelease(keyIndex)
            }))
        })
    }

    private onFunctionKeyPress(keyIndex: FunctionKeyIndex): complete {
        if (this.activeFunctionLabels[keyIndex].nonEmpty()) return true
        const label = this.isShiftKeyPressed
            ? FunctionKeyLabel.ShiftKeys[keyIndex]
            : FunctionKeyLabel.NormalKeys[keyIndex]
        this.functionKeys.byIndex(keyIndex).setPressed(true)
        this.activeFunctionLabels[keyIndex] = Options.valueOf(label)
        return this.processFunctionKeyPress(label)
    }

    private processFunctionKeyPress(label: FunctionKeyLabel<any>): complete {
        if (label === FunctionKeyLabel.Shift) {
            this.isShiftKeyPressed = true
            return true
        } else if (label === FunctionKeyLabel.Tempo) {
            this.tempoProviderSubscription = this.display.pushProvider(this.tempoDisplayProvider)
            return true
        } else {
            return this.mode.get().onFunctionKeyPress(label)
        }
    }

    private onFunctionKeyRelease(keyIndex: FunctionKeyIndex): void {
        const label = this.activeFunctionLabels[keyIndex]
        if (label.isEmpty()) return
        this.functionKeys.byIndex(keyIndex).setPressed(false)
        this.processFunctionKeyRelease(this.activeFunctionLabels[keyIndex].get())
        this.activeFunctionLabels[keyIndex] = Options.None
    }

    private processFunctionKeyRelease(label: FunctionKeyLabel<any>): void {
        if (label === FunctionKeyLabel.Tempo) {
            this.tempoProviderSubscription.terminate()
            this.tempoProviderSubscription = TerminableVoid
        } else {
            if (label === FunctionKeyLabel.Shift) {
                this.isShiftKeyPressed = false
                this.digitInput.stop()
            }
            this.mode.get().onFunctionKeyRelease(label)
        }
    }

    private onMainKeyPress(keyIndex: MainKeyIndex): complete {
        if (this.activeMainLabels[keyIndex].nonEmpty()) return true
        const label = this.isShiftKeyPressed
            ? MainKeyLabel.ShiftKeys[keyIndex]
            : MainKeyLabel.NormalKeys[keyIndex]
        this.mainKeys.byIndex(keyIndex).setPressed(true)
        this.activeMainLabels[keyIndex] = Options.valueOf(label)
        this.concurrentMainKeys.add(label.keyIndex)
        return this.processMainKeyPress(label)
    }

    private processMainKeyPress(label: MainKeyLabel<any>): complete {
        if (!this.isPlaying() && this.mode.get().allowMainKeyValueInput()) {
            if (label.isDigit()) {
                this.digitInput.start()
                this.digitInput.push(label.toDigit())
                return true
            } else if (label.isEnter()) {
                const number = this.digitInput.getValue()
                console.debug(`setMainKeyValue(${number})`)
                this.mode.get().setMainKeyValue(number)
                this.digitInput.stop()
                return true
            }
        }
        return this.mode.get().onMainKeyPress(label)
    }

    private onMainKeyRelease(keyIndex: MainKeyIndex): void {
        if (this.activeMainLabels[keyIndex].isEmpty()) return
        this.mainKeys.byIndex(keyIndex).setPressed(false)
        this.activeMainLabels[keyIndex] = Options.None
        this.concurrentMainKeys.delete(keyIndex)
    }

    private installKeyboard() {
        this.terminator.with(Events.bind(window, 'keydown', (event: Event) => {
            if (!(event instanceof KeyboardEvent) || event.repeat) {
                return
            }
            const code = event.code
            ifDefined(MainKeyShortcuts.get(code),
                (keyIndex: MainKeyIndex) => this.onMainKeyPress(keyIndex))
            ifDefined(FunctionKeyShortcuts.get(event.code),
                (keyIndex: FunctionKeyIndex) => this.onFunctionKeyPress(keyIndex))
        }))
        this.terminator.with(Events.bind(window, 'keyup', (event: Event) => {
            if (!(event instanceof KeyboardEvent)) {
                return
            }
            const code = event.code
            ifDefined(MainKeyShortcuts.get(code),
                (keyIndex: MainKeyIndex) => this.onMainKeyRelease(keyIndex))
            ifDefined(FunctionKeyShortcuts.get(event.code),
                (keyIndex: FunctionKeyIndex) => this.onFunctionKeyRelease(keyIndex))
        }))
        Array.from(MainKeyShortcuts.entries()).forEach(shortcut => {
            const key = this.mainKeys.byIndex(shortcut[1])
            key.element.setAttribute('data-tooltip', shortcut[0])
        })
        Array.from(FunctionKeyShortcuts.entries()).forEach(shortcut => {
            const key = this.functionKeys.byIndex(shortcut[1])
            key.element.setAttribute('data-tooltip', shortcut[0])
        })
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
        this.startKey.addEventListener('pointerdown', () => {
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
        let blink = true
        let frame: number = 0 | 0
        let position: number = 0.0
        let lastTime: number = Date.now()
        this.terminator.with(AnimationFrame.add(() => {
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
        }))
    }
}

class Finger implements Terminable {
    private readonly svg = SVG.createUse('#finger', 64, 64, { class: 'tap-finger' })

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