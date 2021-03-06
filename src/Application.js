import React from 'react';
import Blockly from 'node-blockly/browser';
import Experiment from './Experiment';
import ExperimentHUD from './ExperimentHUD';
import DataCollection from './DataCollection';
import { initCodap, sendItems, extendDataSet, setAppSize } from './codap-utils';
import { loadPreset } from './presets';
import { getURLParam } from './utils';

require('../assets/css/Application.css');

const Organism = { 
  PLANT: "PLANT",
  SNAIL: "SNAIL",
  properties: {
    "PLANT": { label: "Plants", photosynthesizes: true, respirationRate: 1 },
    "SNAIL": { label: "Snails", photosynthesizes: false, respirationRate: 2 }
  }
}

const RUN_STATE = {
  STOPPED: 0,
  RUNNING: 1,
  RUSHING: 2,
  getNext: (curr) => {
    if (getURLParam("rushMode") === "false") {
      return curr === 0 ? 1 : 0
    } else {
      return curr < 2 ? curr + 1 : 0
    }
  },
  isRunning: (state) => state > 0,
  runDelay: (state) => state === 2 ? 0 : 10,
  getButtonPrefix: (state) => {
    switch (RUN_STATE.getNext(state)) {
      case 1:
        return "Run"
      case 2:
        return "Rush"
      default:
        return "Stop"
    }
  }
}

class Application extends React.Component {
  constructor() {
    super()
    let defaultState = this.getDefaultExperimentState()
    defaultState.experiment = 0
    defaultState.showBlocks = false
    defaultState.injectedBlocks = false
    defaultState.running = RUN_STATE.STOPPED
    defaultState.trackedVars = {
      time: true,
      o2: true,
      co2: true,
      plantsNumber: false,
      snailsNumber: false,
      light: false
    }
    this.state = defaultState

    this.handleChange = this.handleChange.bind(this)
    this.createDataPoint = this.createDataPoint.bind(this)
    this.wait = this.wait.bind(this)
    this.reset = this.reset.bind(this)
    this.incSnails = this.incSnails.bind(this)
    this.incPlants = this.incPlants.bind(this)
    this.toggleLight = this.toggleLight.bind(this)
    this.toggleAutomation = this.toggleAutomation.bind(this)

    initCodap()
  }

  componentDidMount() {
    this.updateSensorValues()
  }

  getDefaultExperimentState() {
    return {
      time: 0,
      o2: 200000,
      co2: 400,
      light: true,
      plantsNumber: 0,
      snailsNumber: 0,
    }
  }

  wait(numSteps) {
    let { co2, o2, time } = this.state
    this.step([
      {organismType: Organism.SNAIL, numberKey: "snailsNumber"},
      {organismType: Organism.PLANT, numberKey: "plantsNumber"}
    ], numSteps)
    this.setState({time: this.state.time + numSteps})

    if (getURLParam("showAutomation") === "false") {
      sendItems(this.createDataPoint())
    }
  }

  createDataPoint() {
    let { trackedVars, experiment, time, co2, o2, light, co2Sensor, o2Sensor,
      plantsNumber, snailsNumber } = this.state
    let dataPoint = {experiment_number: experiment}
    if (trackedVars.time) {
      dataPoint.time = time
    }
    if (trackedVars.o2) {
      dataPoint.O2 = o2Sensor
    }
    if (trackedVars.co2) {
      dataPoint.CO2 = co2Sensor
    }
    if (trackedVars.light) {
      extendDataSet("light")
      dataPoint.light = light ? 1 : 0
    }
    if (trackedVars.plantsNumber) {
      extendDataSet("num_plants")
      dataPoint.num_plants = plantsNumber 
    }
    if (trackedVars.snailsNumber) {
      extendDataSet("num_snails")
      dataPoint.num_snails = snailsNumber
    }
    return dataPoint
  }

  reset() {
    let newState = this.getDefaultExperimentState()
    newState.experiment = this.state.experiment + 1
    this.setState(newState)
  }

  // Returns the given value, plus between -sqrt(value) and sqrt(value) noise
  fuzzValue(value) {
    let noise = 0
    if (getURLParam("noise") === "true") {
      let noiseMultiplier = parseFloat(getURLParam("noiseMultiplier"))
      if (isNaN(noiseMultiplier)) {
        noiseMultiplier = 1
      }
      noise = Math.sqrt(value) * (2 * Math.random() - 1) * noiseMultiplier
    }
    return value + noise
  }

  step(organismInfos, numSteps) {
    let newState = Object.assign({}, this.state)

    for (let i = 0; i < numSteps; i++) {
      organismInfos.forEach(organismInfo => {
        let {organismType, numberKey} = organismInfo

        if (getURLParam("orgDeath") !== "false") {
          let numDead = 0
          // This gives organisms a 0% chance of death at atmospheric oxygen (20%),
          // and a .1% chance of death every minute at deadly levels (6%)
          let percentO2 = newState.o2 / 10000
          let deathChance = (-.7 * percentO2 + 14)/10000
          for (let j = 0; j < newState[numberKey]; j++) {
            if (Math.random() < deathChance) {
              numDead++
            }
          }
          newState[numberKey] -= numDead
        }

        if (newState[numberKey] === 0) {
          return
        }

        let { respirationRate, photosynthesizes } = Organism.properties[organismType]

        let respirationConversion = newState[numberKey] * respirationRate
        if (respirationConversion > newState.o2) {
          respirationConversion = newState.o2
          newState[numberKey] = 0
        }
        newState.o2 -= respirationConversion
        newState.co2 += respirationConversion

        if (photosynthesizes) {
          let photosynthesisRate = Math.max(Math.min((.02 * newState.co2) - 1, 7), 1)
          let photosynthesisConversion = newState[numberKey] * photosynthesisRate
          if (!newState.light) {
            photosynthesisConversion = 0
          } else if (photosynthesisConversion > newState.co2) {
            photosynthesisConversion = newState.co2
          }
          newState.o2 += photosynthesisConversion
          newState.co2 -= photosynthesisConversion
        }
      })
    }
    
    this.setState(newState)
  }

  initApi(interpreter, scope) {
    var _this = this

    // Add an API function for the alert() block.
    var wrapper = function(text) {
      text = text != null ? text.toString() : '';
      return interpreter.createPrimitive(alert(text));
    };
    interpreter.setProperty(scope, 'alert',
      interpreter.createNativeFunction(wrapper));

    // Add an API function for the prompt() block.
    wrapper = function(text) {
      text = text != null ? text.toString() : '';
      return interpreter.createPrimitive(prompt(text));
    };
    interpreter.setProperty(scope, 'prompt',
      interpreter.createNativeFunction(wrapper));

    // Add an API function for the getExpVar() block.
    wrapper = function(varName) {
      return _this.state[varName]
    }
    interpreter.setProperty(scope, 'getVar',
      interpreter.createNativeFunction(wrapper));

    // Add an API function for the setExpVar() block.
    wrapper = function(varName, varValue) {
      let newState = {}
      newState[varName] = varValue
      _this.setState(newState)
    }
    interpreter.setProperty(scope, 'setVar',
      interpreter.createNativeFunction(wrapper));

    // Add an API function for the incExpVar() block.
    wrapper = function(varName) {
      let newState = {}
      newState[varName] = _this.state[varName] + 1
      _this.setState(newState)
    }
    interpreter.setProperty(scope, 'incVar',
      interpreter.createNativeFunction(wrapper));

    // Add an API function for the recordData() block.
    wrapper = function(numSteps) {
      sendItems(_this.createDataPoint())
    }
    interpreter.setProperty(scope, 'recordData',
      interpreter.createNativeFunction(wrapper));

    // Add an API function for the wait() block.
    wrapper = function(numSteps) {
      _this.wait(numSteps)
    }
    interpreter.setProperty(scope, 'wait',
      interpreter.createNativeFunction(wrapper));

    // Add an API function for the reset() block.
    wrapper = function() {
      _this.reset()
    }
    interpreter.setProperty(scope, 'reset',
      interpreter.createNativeFunction(wrapper));

    // Add an API function for highlighting blocks
    wrapper = function(id) {
      id = id ? id.toString() : '';
      return interpreter.createPrimitive(_this.workspace.highlightBlock(id));
    };
    interpreter.setProperty(scope, 'highlightBlock',
      interpreter.createNativeFunction(wrapper));
  }

  handleChange(event) {
    let trackedVars = Object.assign({}, this.state.trackedVars)
    trackedVars[event.target.name] = event.target.checked
    this.setState({trackedVars})
  }

  incPlants() {
    this.setState({plantsNumber: this.state.plantsNumber + 1})
  }

  incSnails() {
    this.setState({snailsNumber: this.state.snailsNumber + 1})
  }

  toggleLight() {
    this.setState({light: !this.state.light})
  }

  toggleAutomation() {
    if (this.state.showBlocks) {
      setAppSize(750, 550)
      this.setState({showBlocks: false})
    } else {
      setAppSize(750, 800)
      this.setState({showBlocks: true})
      // Hack to only inject Blockly once container is visible
      setTimeout(() => {
        if (!this.state.injectedBlocks) {
          this.workspace = Blockly.inject('blockly-div',
            {toolbox: document.getElementById('toolbox')});
          this.setState({injectedBlocks: true})
        }
      }, 100)
    }
  }

  updateSensorValues() {
    this.setState({
      o2Sensor: Math.round(this.fuzzValue(this.state.o2)),
      co2Sensor: Math.round(this.fuzzValue(this.state.co2))
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.experiment !== prevState.experiment || this.state.time !== prevState.time) {
      this.updateSensorValues()
    }
  }
 
  render() {
    const { time, o2, co2, o2Sensor, co2Sensor, plantsNumber, snailsNumber, light, showBlocks, running } = this.state
    return (
      <div className="ecochamber-app">
        <div className="experiment-ui">
          <canvas className="experiment-canvas"/>
          <Experiment numPlants={this.state.plantsNumber} numSnails={this.state.snailsNumber} light={this.state.light}/>
          <DataCollection trackedVars={this.state.trackedVars} handleChange={this.handleChange} createDataPoint={this.createDataPoint} light={this.state.light}
                          incSnails={this.incSnails} incPlants={this.incPlants} toggleLight={this.toggleLight} wait={this.wait} reset={this.reset}
                          toggleAutomation={this.toggleAutomation} automationEnabled={this.state.showBlocks}
                          o2={o2Sensor} co2={co2Sensor} time={time} plants={plantsNumber} snails={snailsNumber}/>
        </div>
        <br/>
        <br/>
        <div className="automation-env" hidden={!showBlocks}>
          <div className="blockly-controls">
            <button style={{width: 123}}
              onClick={() => {
                var _this = this
                _this.setState({running: RUN_STATE.getNext(_this.state.running)}, () => {
                  var code = Blockly.JavaScript.workspaceToCode(_this.workspace);
                  var myInterpreter = new Interpreter(code, _this.initApi.bind(_this));
                  if (_this.state.running === RUN_STATE.RUNNING) {
                    function nextStep() {
                      if (myInterpreter.step() && RUN_STATE.isRunning(_this.state.running)) {
                        window.setTimeout(nextStep, RUN_STATE.runDelay(_this.state.running));
                      } else {
                        _this.workspace.highlightBlock(null)
                        _this.setState({running: RUN_STATE.STOPPED})
                      }
                    }
                    nextStep();
                  }
                })
              }}
            >
            {RUN_STATE.getButtonPrefix(running)} program
            </button>
            <button
              onClick={() => {
                var xml = Blockly.Xml.workspaceToDom(this.workspace)
                var xml_text = Blockly.Xml.domToText(xml)
                console.clear()
                console.log(xml_text)
              }}
            >
            Save program
            </button>
            <button
              onClick={() => {
                var xml_text = prompt("Paste your saved program:")
                var xml = Blockly.Xml.textToDom(xml_text)
                Blockly.Xml.domToWorkspace(xml, this.workspace)
              }}
            >
            Load program
            </button>
            <button
              onClick={() => {
                this.workspace.clear()
              }}
            >
            Clear program
            </button>
          </div>
          <div className="blockly-presets">
            <button
              onClick={() => {
                loadPreset(1, this.workspace)
              }}
            >
            Example 1
            </button>
            <button
              onClick={() => {
                loadPreset(2, this.workspace)
              }}
            >
            Example 2
            </button>
            <button
              onClick={() => {
                loadPreset(3, this.workspace)
              }}
            >
            Example 3
            </button>
            <button
              onClick={() => {
                loadPreset(4, this.workspace)
              }}
            >
            Example 4
            </button>
            <button
              onClick={() => {
                loadPreset(5, this.workspace)
              }}
            >
            Example 5
            </button>
          </div>
          <div id="blockly-div" style={{width: 725, height: 600}}></div>
        </div>
      </div>
    );
  }
}
export default Application;
