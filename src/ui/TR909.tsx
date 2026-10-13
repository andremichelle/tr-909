import css from "./TR909.sass?inline"
import {Exec, Lifecycle, ObservableValue} from "@opendaw/lib-std"
import {Events, Html} from "@opendaw/lib-dom"
import {createElement} from "@opendaw/lib-jsx"
import {UIContext} from "@/control/context"
import {FunctionKeyIndex, MainKeyIndex} from "@/control/keys"
import {ActionGroup} from "./ActionGroup"
import {FunctionKey} from "./FunctionKey"
import {HardButton} from "./HardButton"
import {Instruments} from "./Instruments"
import {FunctionKeyLabels, TriggerKeyLabels} from "./KeyLabels"
import {Knob} from "./Knob"
import {Labeled} from "./Labeled"
import {LedDisplay} from "./LedDisplay"
import {MainKey, MainKeys} from "./MainKeys"
import {PatternFunctions} from "./PatternFunctions"
import {Scales} from "./Scales"

const className = Html.adoptStyleSheet(css, "TR909")

const at = (x: number, y: number): Partial<CSSStyleDeclaration> => ({transform: `translate(${x}px, ${y}px)`})

type Construct = {
    lifecycle: Lifecycle
    ui: UIContext
    tutorialAdvanceVisible: ObservableValue<boolean>
    onTutorialAdvance: Exec
}

export const TR909 = ({lifecycle, ui, tutorialAdvanceVisible, onTutorialAdvance}: Construct) => {
    const preset = ui.machine.preset
    const key = (index: FunctionKeyIndex) => <FunctionKey lifecycle={lifecycle} ui={ui} index={index}/>
    const tutorialAdvance: HTMLDivElement = (
        <div className="tutorial-advance">
            <svg viewBox="0 0 512 512">
                <path
                    d="M256 0C114.615 0 0 114.615 0 256s114.615 256 256 256 256-114.616 256-256S397.385 0 256 0zm90.899 280.959-85.594 85.594c-13.783 13.784-36.132 13.784-49.917 0-13.784-13.784-13.784-36.133 0-49.917L272.023 256l-60.635-60.635c-13.784-13.784-13.784-36.133 0-49.917s36.134-13.784 49.917 0l85.594 85.594c13.784 13.783 13.784 36.133 0 49.917z"/>
            </svg>
            <p>Click here to continue...</p>
        </div>
    )
    const element: HTMLDivElement = (
        <div className={className}>
            {tutorialAdvance}
            <div className="logo roland"/>
            <div className="logo tr-909"/>
            <div className="logo rhythm-composer"/>
            <Instruments lifecycle={lifecycle} preset={preset} style={at(90, 244)}/>
            <ActionGroup columns={4} style={at(496, 406)}>
                <h1 style={{gridColumn: "1 / 5"}}>TRACK PLAY</h1>
                {key(FunctionKeyIndex.Track1)}
                {key(FunctionKeyIndex.Track2)}
                {key(FunctionKeyIndex.Track3)}
                {key(FunctionKeyIndex.Track4)}
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <h2 style={{gridColumn: "1 / 5"}}>TRACK WRITE</h2>
            </ActionGroup>
            <ActionGroup columns={4} style={at(630, 406)}>
                <h1 style={{gridColumn: "1 / 4"}}>PATTERN PLAY</h1>
                <div/>
                {key(FunctionKeyIndex.PatternGroup1)}
                {key(FunctionKeyIndex.PatternGroup2)}
                {key(FunctionKeyIndex.PatternGroup3)}
                {key(FunctionKeyIndex.EmptyExtInst)}
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span/>
                <h2 style={{gridColumn: "1 / 4"}}>PATTERN WRITE</h2>
                <h2>EXT INST</h2>
            </ActionGroup>
            <ActionGroup columns={6} style={at(768, 406)}>
                <h1>TEMPO</h1>
                <h1>BACK</h1>
                <h1>FWD</h1>
                <h1>AVAILABLE MEAS</h1>
                <h1>CYCLE /GUIDE</h1>
                <h1>TAPE SYNC</h1>
                {key(FunctionKeyIndex.TempoStep)}
                {key(FunctionKeyIndex.BackTap)}
                {key(FunctionKeyIndex.ForwardBankI)}
                {key(FunctionKeyIndex.AvailableMeasuresBankII)}
                {key(FunctionKeyIndex.CycleGuideLastMeasure)}
                {key(FunctionKeyIndex.TapeSyncTempoMode)}
                <span>STEP</span>
                <span>TAP</span>
                <span>I</span>
                <span>II</span>
                <span/>
                <span/>
                <h2 style={{gridColumn: "1 / 3"}}>PATTERN WRITE MODE</h2>
                <h2 style={{gridColumn: "3 / 5"}}>BANK</h2>
                <h2>LAST MEAS</h2>
                <h2>TEMP MODE</h2>
            </ActionGroup>
            <PatternFunctions lifecycle={lifecycle} ui={ui} style={at(90, 498)}/>
            <Scales lifecycle={lifecycle} scaleIndex={ui.scaleIndex} style={at(198, 498)}/>
            <MainKeys lifecycle={lifecycle} ui={ui} style={at(212, 582)}/>
            <FunctionKeyLabels style={at(206, 638)}/>
            <TriggerKeyLabels style={at(206, 656)}/>
            <hr className="bottom-right" style={at(1120, 498)}/>
            <hr className="main-border" style={{...at(230, 564), width: "354px"}}/>
            <hr className="main-border" style={{...at(688, 564), width: "408px"}}/>
            <Knob lifecycle={lifecycle} parameter={preset.tempo} label="TEMPO" big units={["SLOW", "FAST"]}
                  style={at(390, 400)}/>
            <Knob lifecycle={lifecycle} parameter={preset.volume} label="VOLUME" big units={["MIN", "MAX"]}
                  style={at(1038, 400)}/>
            <Labeled label="MEAS/TEMPO" style={at(268, 423)}>
                <LedDisplay lifecycle={lifecycle} value={ui.display.value}/>
            </Labeled>
            <Labeled label="START" style={at(128, 423)}>
                <HardButton lifecycle={lifecycle} kind="trigger" bright highlighted={ui.startKeyHighlighted}
                            onPress={() => ui.pressStart()}/>
            </Labeled>
            <Labeled label="STOP/CONT" style={at(192, 423)}>
                <HardButton lifecycle={lifecycle} kind="trigger" bright onPress={() => ui.pressStopContinue()}/>
            </Labeled>
            <Labeled label={"CARTRIDGE\n/ENTER"} below="TOTAL ACCENT" style={at(962, 423)}>
                <MainKey lifecycle={lifecycle} ui={ui} index={MainKeyIndex.CartridgeEnterTotalAccent}/>
            </Labeled>
            <footer/>
        </div>
    )
    lifecycle.ownAll(
        ui.blinkPhase.catchupAndSubscribe(owner => element.classList.toggle("blink-phase", owner.getValue())),
        ui.flashPhase.catchupAndSubscribe(owner => element.classList.toggle("flash-phase", owner.getValue())),
        tutorialAdvanceVisible.catchupAndSubscribe(owner => tutorialAdvance.classList.toggle("hidden", !owner.getValue())),
        Events.subscribe(tutorialAdvance, "pointerdown", () => onTutorialAdvance())
    )
    return element
}
