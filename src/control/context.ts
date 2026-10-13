import {
    Arrays,
    DefaultObservableValue,
    int,
    isDefined,
    MutableObservableOption,
    Option,
    Optional,
    Subscription,
    Terminable,
    Terminator
} from "@opendaw/lib-std"
import {AnimationFrame, Events} from "@opendaw/lib-dom"
import {secondsToBars} from "@/audio/common"
import {Machine, MachineFormat} from "@/audio/machine"
import {BankIndex, Memory, MemoryBank, Pattern, PatternGroup, PatternGroupIndex, PatternLocation, ScaleIndex, Track, TrackIndex} from "@/audio/memory"
import {PlayMode, State} from "@/audio/state"
import {JsonBin} from "@/lib/jsonbin"
import {DigitInput, Display, DisplayValueProvider} from "./display"
import {InstrumentMode, Instruments} from "./instrument"
import {
    FunctionKeyIndex,
    FunctionKeyLabel,
    FunctionKeyShortcuts,
    Key,
    KeyGroup,
    KeyState,
    MainKeyIndex,
    MainKeyLabel,
    MainKeyShortcuts,
    StepsEditingMode,
    ZeroBasedIndices
} from "./keys"
import {complete, Mode} from "./mode"
import {PatternPlayMode} from "./modes/pattern-play"
import {PatternWriteMode} from "./modes/pattern-write"
import {TrackPlayMode} from "./modes/track-play"
import {TrackWriteMode} from "./modes/track-write"

export interface Format {
    version: number
    machine: MachineFormat
}

const shortcutOf = <T>(map: ReadonlyMap<string, T>, index: T): Optional<string> =>
    Array.from(map.entries()).find(([, value]) => value === index)?.[0]

export class UIContext implements Terminable {
    readonly #terminator: Terminator = new Terminator()
    readonly #tempoDisplayProvider: DisplayValueProvider
    readonly #activeMainLabel: Array<Option<MainKeyLabel>>
    readonly #activeFunctionLabel: Array<Option<FunctionKeyLabel>>
    readonly #concurrentMainKeys: Set<MainKeyIndex> = new Set<MainKeyIndex>()

    readonly machine: Machine
    readonly display: Display
    readonly digitInput: DigitInput
    readonly mainKeys: KeyGroup<MainKeyIndex>
    readonly functionKeys: KeyGroup<FunctionKeyIndex>
    readonly startKeyHighlighted: DefaultObservableValue<boolean>
    readonly mode: DefaultObservableValue<Mode>
    readonly instrumentMode: DefaultObservableValue<InstrumentMode>
    readonly stepsEditMode: DefaultObservableValue<StepsEditingMode>
    readonly scaleIndex: DefaultObservableValue<ScaleIndex>
    readonly blinkPhase: DefaultObservableValue<boolean>
    readonly flashPhase: DefaultObservableValue<boolean>
    readonly working: MutableObservableOption<string>

    #shiftKeyPressed: boolean = false
    #tempoProviderSubscription: Subscription = Terminable.Empty

    constructor(machine: Machine) {
        this.machine = machine
        this.display = this.#terminator.own(new Display())
        this.digitInput = this.#terminator.own(new DigitInput(this.display))
        this.mainKeys = new KeyGroup<MainKeyIndex>(Arrays.create(index =>
            new Key("main", index, shortcutOf(MainKeyShortcuts, index)), MainKeyIndex.CartridgeEnterTotalAccent + 1))
        this.functionKeys = new KeyGroup<FunctionKeyIndex>(Arrays.create(index =>
            new Key("function", index, shortcutOf(FunctionKeyShortcuts, index)), FunctionKeyIndex.Shift + 1))
        this.startKeyHighlighted = new DefaultObservableValue<boolean>(false)
        this.instrumentMode = new DefaultObservableValue<InstrumentMode>(InstrumentMode.Bassdrum)
        this.stepsEditMode = new DefaultObservableValue<StepsEditingMode>(StepsEditingMode.Step)
        this.scaleIndex = new DefaultObservableValue<ScaleIndex>(3)
        this.blinkPhase = new DefaultObservableValue<boolean>(false)
        this.flashPhase = new DefaultObservableValue<boolean>(false)
        this.working = new MutableObservableOption<string>()
        this.#activeMainLabel = Arrays.create(() => Option.None, this.mainKeys.keys.length)
        this.#activeFunctionLabel = Arrays.create(() => Option.None, this.functionKeys.keys.length)
        this.#tempoDisplayProvider = DisplayValueProvider.observe("tempo", machine.preset.tempo)
        this.mode = new DefaultObservableValue<Mode>(new TrackPlayMode(this))
        this.#installPhases()
        const state = machine.memory.state
        this.#terminator.own(state.cycleGuideMode.catchupAndSubscribe(owner => this.functionKeys
            .byIndex(FunctionKeyIndex.CycleGuideLastMeasure).setState(owner.getValue() ? KeyState.On : KeyState.Off)))
        const patternSubscription = this.#terminator.own(new Terminator())
        const watchScale = (pattern: Pattern) => {
            patternSubscription.terminate()
            patternSubscription.own(pattern.scaleIndex.catchupAndSubscribe(owner => this.scaleIndex.setValue(owner.getValue())))
        }
        this.#terminator.own(state.patternIndicesChangeNotification.subscribe(watchScale))
        watchScale(state.activePattern())
    }

    bindKeyboard(target: Window): Subscription {
        return Terminable.many(
            Events.subscribe(target, "keydown", (event: KeyboardEvent) => {
                if (event.repeat) {return}
                if (event.code === "Space") {
                    this.machine.transport.togglePlayback()
                    return
                }
                const mainKeyIndex = MainKeyShortcuts.get(event.code)
                if (isDefined(mainKeyIndex)) {this.pressMainKey(mainKeyIndex)}
                const functionKeyIndex = FunctionKeyShortcuts.get(event.code)
                if (isDefined(functionKeyIndex)) {this.pressFunctionKey(functionKeyIndex)}
            }),
            Events.subscribe(target, "keyup", (event: KeyboardEvent) => {
                const mainKeyIndex = MainKeyShortcuts.get(event.code)
                if (isDefined(mainKeyIndex)) {this.releaseMainKey(mainKeyIndex)}
                const functionKeyIndex = FunctionKeyShortcuts.get(event.code)
                if (isDefined(functionKeyIndex)) {this.releaseFunctionKey(functionKeyIndex)}
            })
        )
    }

    pressStart(): void {
        const transport = this.machine.transport
        if (!transport.isPlaying()) {
            transport.moveTo(0.0)
            transport.play()
        }
    }

    pressStopContinue(): void {this.machine.transport.togglePlayback()}

    pressMainKey(keyIndex: MainKeyIndex): complete {
        if (this.#activeMainLabel[keyIndex].nonEmpty()) {return true}
        const label = this.#shiftKeyPressed ? MainKeyLabel.ShiftKeys[keyIndex] : MainKeyLabel.NormalKeys[keyIndex]
        this.mainKeys.byIndex(keyIndex).setPressed(true)
        this.#activeMainLabel[keyIndex] = Option.wrap(label)
        this.#concurrentMainKeys.add(label.keyIndex)
        return this.#processMainKeyPress(label)
    }

    releaseMainKey(keyIndex: MainKeyIndex): void {
        if (this.#activeMainLabel[keyIndex].isEmpty()) {return}
        this.mainKeys.byIndex(keyIndex).setPressed(false)
        this.#activeMainLabel[keyIndex] = Option.None
        this.#concurrentMainKeys.delete(keyIndex)
    }

    pressFunctionKey(keyIndex: FunctionKeyIndex): complete {
        if (this.#activeFunctionLabel[keyIndex].nonEmpty()) {return true}
        const label = this.#shiftKeyPressed ? FunctionKeyLabel.ShiftKeys[keyIndex] : FunctionKeyLabel.NormalKeys[keyIndex]
        this.functionKeys.byIndex(keyIndex).setPressed(true)
        this.#activeFunctionLabel[keyIndex] = Option.wrap(label)
        if (label === FunctionKeyLabel.Shift) {
            this.#shiftKeyPressed = true
        } else if (label === FunctionKeyLabel.Tempo) {
            this.#tempoProviderSubscription = this.display.push(this.#tempoDisplayProvider)
        }
        return this.mode.getValue().onFunctionKeyPress(label)
    }

    releaseFunctionKey(keyIndex: FunctionKeyIndex): void {
        const option = this.#activeFunctionLabel[keyIndex]
        if (option.isEmpty()) {return}
        const label = option.unwrap()
        this.functionKeys.byIndex(keyIndex).setPressed(false)
        if (label === FunctionKeyLabel.Shift) {
            this.#shiftKeyPressed = false
            this.digitInput.stop()
        } else if (label === FunctionKeyLabel.Tempo) {
            this.#tempoProviderSubscription.terminate()
            this.#tempoProviderSubscription = Terminable.Empty
        }
        this.mode.getValue().onFunctionKeyRelease(label)
        this.#activeFunctionLabel[keyIndex] = Option.None
    }

    async save(): Promise<void> {
        if (!this.machine.hasAnyData()) {
            setTimeout(() => alert("Nothing to save!"), 250)
            return
        }
        this.working.wrap("saving")
        const result = await JsonBin.save<Format>({version: 0.1, machine: this.machine.serialize()})
        result.match({
            some: response => history.pushState(null, "", `#${response.metadata.id}`),
            none: () => {setTimeout(() => alert("Could not save."), 250)}
        })
        this.working.clear()
    }

    async load(binId: string): Promise<void> {
        this.working.wrap("loading")
        const result = await JsonBin.load<Format>(binId)
        result.match({
            some: response => this.deserialize(response.record),
            none: () => {setTimeout(() => alert(`Could not load '${binId}'.`), 250)}
        })
        this.working.clear()
    }

    deserialize(format: Format): void {
        if (format.version !== 0.1) {
            console.warn(`Unexpected version (${format.version})`)
            return
        }
        this.machine.deserialize(format.machine)
    }

    modeName(): string {return this.mode.getValue().name()}
    isPlaying(): boolean {return this.machine.transport.isPlaying()}
    memory(): Memory {return this.machine.memory}
    memoryState(): State {return this.machine.memory.state}
    activeBank(): MemoryBank {return this.memoryState().activeBank()}
    activeTrack(): Track {return this.memoryState().activeTrack()}
    activePattern(): Pattern {return this.memoryState().activePattern()}
    activePatternGroup(): PatternGroup {return this.memoryState().activePatternGroup()}
    concurrentMainKeys(): Set<MainKeyIndex> {return this.#concurrentMainKeys}

    isFunctionKeyPressed(label: FunctionKeyLabel): boolean {
        return this.#activeFunctionLabel[label.keyIndex].nonEmpty()
            && FunctionKeyLabel.ShiftKeys.includes(label) === this.#shiftKeyPressed
    }

    maySwitchToTrackPlayMode(label: FunctionKeyLabel): boolean {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.TrackPlay, index => this.switchToTrackPlayMode(index))
    }

    maySwitchToTrackWriteMode(label: FunctionKeyLabel): boolean {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.TrackWrite, index => this.switchToTrackWriteMode(index))
    }

    maySwitchToPatternPlayMode(label: FunctionKeyLabel): boolean {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.PatternPlay, index => this.switchToPatternPlayMode(index))
    }

    maySwitchToPatternWriteMode(label: FunctionKeyLabel): boolean {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.PatternWrite, index => this.switchToPatternWriteMode(index))
    }

    maySwitchTrackIndex(label: FunctionKeyLabel): boolean {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.TrackPlay, index => this.memoryState().trackIndex.setValue(index))
    }

    maySwitchBankGroupIndex(label: FunctionKeyLabel): boolean {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.BankGroup, index => this.memoryState().bankGroupIndex.setValue(index))
    }

    maySwitchPatternGroupIndex(label: FunctionKeyLabel): boolean {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.PatternPlay, index => this.memoryState().patternGroupIndex.setValue(index))
    }

    maySwitchPatternEditMode(label: FunctionKeyLabel): boolean {
        return UIContext.mayExecOnIndexedChoice(label, FunctionKeyLabel.StepsEditingModes, index => this.stepsEditMode.setValue(index))
    }

    mayToggle(label: FunctionKeyLabel, compare: FunctionKeyLabel, value: DefaultObservableValue<boolean>): boolean {
        if (label !== compare) {return false}
        value.setValue(!value.getValue())
        return true
    }

    switchToTrackPlayMode(trackIndex: TrackIndex): void {
        this.#switchMode(state => {
            state.trackIndex.setValue(trackIndex)
            state.playMode.setValue(PlayMode.Track)
        }, () => new TrackPlayMode(this))
    }

    switchToTrackWriteMode(trackIndex: TrackIndex): void {
        this.#switchMode(state => {
            state.trackIndex.setValue(trackIndex)
            state.playMode.setValue(PlayMode.Pattern)
        }, () => new TrackWriteMode(this))
    }

    switchToPatternPlayMode(patternGroupIndex: PatternGroupIndex): void {
        this.#switchMode(state => {
            state.patternGroupIndex.setValue(patternGroupIndex)
            state.playMode.setValue(PlayMode.Pattern)
        }, () => new PatternPlayMode(this))
    }

    switchToPatternWriteMode(patternGroupIndex: PatternGroupIndex): void {
        this.#switchMode(state => {
            state.patternGroupIndex.setValue(patternGroupIndex)
            state.playMode.setValue(PlayMode.Pattern)
        }, () => new PatternWriteMode(this))
    }

    resetMainKeys(): void {this.mainKeys.deactivate()}

    resetHighlights(): void {
        this.mainKeys.forEach(key => key.setHighlighted(false))
        this.functionKeys.forEach(key => key.setHighlighted(false))
        this.startKeyHighlighted.setValue(false)
    }

    updatePatternLocationKeys(location: PatternLocation, writeMode: boolean = false): void {
        this.updatePatternGroupKeys(location.patternGroupIndex, writeMode)
        this.mainKeys.deactivate()
        const group = this.activeBank().patternGroups[location.patternGroupIndex]
        const chained = group.getChained()
        let index: int = group.firstOfChained(location.patternIndex).location.patternIndex
        do {
            this.mainKeys.byIndex(index).setState(KeyState.On)
        } while (chained[index++])
        this.mainKeys.byIndex(location.patternIndex as int).setState(KeyState.Blink)
    }

    updateTrackKeys(trackIndex: TrackIndex, writeMode: boolean): void {
        this.functionKeys.activate(index => index === trackIndex
            ? writeMode ? KeyState.Blink : KeyState.On : KeyState.Off, ZeroBasedIndices.TrackKeys)
    }

    updatePatternGroupKeys(patternGroupIndex: PatternGroupIndex, writeMode: boolean): void {
        this.functionKeys.activate(index => patternGroupIndex === index
            ? writeMode ? KeyState.Blink : KeyState.On : KeyState.Off, ZeroBasedIndices.PatternGroupKeys)
    }

    updateBankGroupKeys(bankGroupIndex: BankIndex): void {
        this.functionKeys.activate(index => bankGroupIndex === index ? KeyState.On : KeyState.Off, ZeroBasedIndices.BankGroupKeys)
    }

    watchPatternEditKeys(): Subscription {
        return this.stepsEditMode.catchupAndSubscribe(owner => this.functionKeys.activate(index =>
            index === owner.getValue() ? KeyState.On : KeyState.Off, ZeroBasedIndices.PatternEditModes))
    }

    clearPatternEditKeys(): void {this.functionKeys.deactivate(ZeroBasedIndices.PatternEditModes)}

    watchPatternLocationKeys(): Subscription {
        this.updatePatternLocationKeys(this.activePattern().location)
        return this.memoryState().patternIndicesChangeNotification
            .subscribe(pattern => this.updatePatternLocationKeys(pattern.location))
    }

    watchPatternStepsKeys(): Subscription {
        const terminator = new Terminator()
        const patternSubscription = terminator.own(new Terminator())
        const updateKeys = () => {
            const pattern = this.activePattern()
            const mapping = Instruments.stepToKeyState(this.instrumentMode.getValue())
            this.mainKeys.forEach((key, keyIndex) =>
                key.setState(keyIndex === MainKeyIndex.CartridgeEnterTotalAccent ? KeyState.Off : mapping(pattern, keyIndex)))
        }
        const watch = (pattern: Pattern) => {
            patternSubscription.terminate()
            patternSubscription.own(pattern.catchupAndSubscribe(updateKeys))
        }
        watch(this.activePattern())
        terminator.own(this.memoryState().patternIndicesChangeNotification.subscribe(watch))
        return terminator
    }

    startStepRunningAnimation(): Subscription {
        let running: Option<Key> = Option.None
        return Terminable.many(
            this.machine.processorStepIndex.subscribe(owner => {
                running.ifSome(key => key.setRunning(false))
                const key = this.mainKeys.byIndex(owner.getValue())
                key.setRunning(true)
                running = Option.wrap(key)
            }),
            Terminable.create(() => {
                running.ifSome(key => key.setRunning(false))
                running = Option.None
            })
        )
    }

    playInstrument(keyIndex: MainKeyIndex): void {
        if (keyIndex === MainKeyIndex.CartridgeEnterTotalAccent || this.#shiftKeyPressed) {return}
        const {channelIndex, step} = Instruments.playInstrument(keyIndex, this.#concurrentMainKeys)
        this.machine.play(channelIndex, step)
    }

    terminate(): void {
        this.mode.getValue().terminate()
        this.#terminator.terminate()
    }

    static mayExecOnIndexedChoice<T>(label: FunctionKeyLabel, choices: ReadonlyArray<FunctionKeyLabel<T>>,
                                     exec: (value: T) => void): boolean {
        const index = choices.indexOf(label as FunctionKeyLabel<T>)
        if (index === -1) {return false}
        exec(choices[index].value)
        return true
    }

    #switchMode(update: (state: State) => void, factory: () => Mode): void {
        this.resetMainKeys()
        this.mode.getValue().terminate()
        const state = this.memoryState()
        state.batch(() => update(state))
        this.mode.setValue(factory())
        console.debug(`mode: ${this.modeName()}`)
    }

    #processMainKeyPress(label: MainKeyLabel): complete {
        if (label === MainKeyLabel.Save) {
            this.save().then()
            return true
        } else if (label === MainKeyLabel.Load) {
            setTimeout(() => {
                const binId = prompt("Enter a bin-id", "62fdc84ee13e6063dc808df8")
                if (isDefined(binId)) {this.load(binId).then()}
            }, 100)
            return true
        }
        const mode = this.mode.getValue()
        if (!this.isPlaying() && mode.allowMainKeyValueInput()) {
            if (label.isDigit()) {
                this.digitInput.start()
                this.digitInput.push(label.toDigit())
                return true
            } else if (label.isEnter()) {
                mode.setMainKeyValue(this.digitInput.getValue())
                this.digitInput.stop()
                return true
            }
        }
        return mode.onMainKeyPress(label)
    }

    #installPhases(): void {
        let frame: int = 0
        let position: number = 0.0
        let lastTime: number = performance.now()
        this.#terminator.own(AnimationFrame.add(() => {
            const now = performance.now()
            position += secondsToBars((now - lastTime) / 1000.0, this.machine.preset.tempo.getValue()) * 8.0
            lastTime = now
            if (position >= 1.0) {
                this.blinkPhase.setValue(!this.blinkPhase.getValue())
                position -= Math.floor(position)
            }
            this.flashPhase.setValue(frame++ % 4 < 2)
        }))
    }
}
