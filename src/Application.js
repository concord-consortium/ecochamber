import React from 'react';
import Blockly from 'node-blockly/browser';
import Experiment from './Experiment';
import ExperimentHUD from './ExperimentHUD';
import DataCollection from './DataCollection';
import { initCodap, sendItems, extendDataSet, setAppSize } from './codap-utils';
import { loadPreset } from './presets';

require('../assets/css/Application.css');

const Organism = { 
  PLANT: "PLANT",
  SNAIL: "SNAIL",
  properties: {
    "PLANT": { label: "Plants", photosynthesizes: true, respirationRate: 1 },
    "SNAIL": { label: "Snails", photosynthesizes: false, respirationRate: 2 }
  }
}

class Application extends React.Component {
  constructor() {
    super()
    let defaultState = this.getDefaultExperimentState()
    defaultState.experiment = 0
    defaultState.showBlocks = false
    defaultState.injectedBlocks = false
    defaultState.running = false
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
  }

  createDataPoint() {
    let { trackedVars, experiment, time, co2, o2, light, co2Sensor, o2Sensor,
      plantsNumber, snailsNumber } = this.state
    let dataPoint = {experiment_number: experiment}
    if (trackedVars.time) {
      dataPoint.hour = time
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
    let noise = Math.sqrt(value) * (2 * Math.random() - 1)
    return value + noise
  }

  step(organismInfos, numSteps) {
    let newState = Object.assign({}, this.state)

    for (let i = 0; i < numSteps; i++) {
      organismInfos.forEach(organismInfo => {
        let {organismType, numberKey} = organismInfo

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

  updateSensorValues() {
    this.setState({
      o2Sensor: Math.round(this.fuzzValue(this.state.o2)),
      co2Sensor: Math.round(this.fuzzValue(this.state.co2))
    })
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.state.experiment !== nextState.experiment || this.state.time !== nextState.time) {
      this.updateSensorValues()
    }
  }
 
  render() {
    const { time, o2, co2, o2Sensor, co2Sensor, plantsNumber, snailsNumber, light, showBlocks } = this.state
    return (
      <div className="ecochamber-app">
        <ExperimentHUD colInfos={[
          [
            { label: "Time", value: time},
            { label: "O2", value: o2Sensor, unit: "ppm"},
            { label: "CO2", value: co2Sensor, unit: "ppm"}
          ],
          [
            { label: "Plant population", value: plantsNumber},
            { label: "Snail population", value: snailsNumber},
            { label: "Light", value: light ? "On" : "Off"}
          ]
        ]}/>
        <div className="experiment-ui">
          <Experiment numPlants={this.state.plantsNumber} numSnails={this.state.snailsNumber} light={this.state.light}/>
          <DataCollection trackedVars={this.state.trackedVars} handleChange={this.handleChange} createDataPoint={this.createDataPoint} />
        </div>
        <button
          onClick={() => {
            this.setState({plantsNumber: this.state.plantsNumber + 1})
          }}
        >
        Add plant
        </button>
        <button
          onClick={() => {
            this.setState({snailsNumber: this.state.snailsNumber + 1})
          }}
        >
        Add snail
        </button>
        <button
          onClick={() => {
            this.wait(1)
          }}
        >
        Wait 1 minute
        </button>
        <button
          onClick={() => {
            this.wait(60)
          }}
        >
        Wait 1 hour
        </button>
        <button style={{width: 114}}
          onClick={() => {
            this.setState({light: !light})
          }}
        >
        Turn light {light ? "off" : "on"}
        </button>
        <button
          onClick={() => {
            this.reset()
          }}
        >
        Reset simulation
        </button>
        <br/>
        <br/>
        <div className="automation-env" hidden={!showBlocks}>
          <div className="blockly-controls">
            <button style={{width: 122}}
              onClick={() => {
                var _this = this
                _this.setState({running: !_this.state.running}, () => {
                  var code = Blockly.JavaScript.workspaceToCode(_this.workspace);
                  var myInterpreter = new Interpreter(code, _this.initApi.bind(_this));
                  function nextStep() {
                    if (myInterpreter.step() && _this.state.running) {
                      window.setTimeout(nextStep, 10);
                    } else {
                      _this.workspace.highlightBlock(null)
                      _this.setState({running: false})
                    }
                  }
                  nextStep();
                })
              }}
            >
            {this.state.running ? "Stop" : "Start"} program
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
        <div className="blockly-display">
          <button
            onClick={() => {
              if (showBlocks) {
                setAppSize(750, 610)
              } else {
                setAppSize(750, 800)
              }

              this.setState({showBlocks: !showBlocks})
              // Hack to only inject Blockly once container is visible
              setTimeout(() => {
                if (!this.state.injectedBlocks) {
                  this.workspace = Blockly.inject('blockly-div',
                    {toolbox: document.getElementById('toolbox')});
                  this.setState({injectedBlocks: true})
                }
              }, 100)
            }}
          >
          {showBlocks ? "Hide" : "Show"} experiment automation
          </button>
        </div>
      </div>
    );
  }
}
export default Application;
