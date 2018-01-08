import React from 'react';
import Blockly from 'node-blockly/browser';
import OrganismGroup, { Organism } from './organism-group';
import Experiment from './Experiment';
import ExperimentHUD from './ExperimentHUD';
import DataCollection from './DataCollection';
import { initCodap, sendItems, extendDataSet } from './codap-utils';
import { loadPreset } from './presets';

require('../assets/css/Application.css');

class Application extends React.Component {
  constructor() {
    super()
    let defaultState = this.getDefaultExperimentState()
    defaultState.experiment = 0
    defaultState.trackedVars = {
      time: true,
      o2: true,
      co2: true,
      plantsNumber: false,
      snailsNumber: false,
      plantsStoredFood: false,
      snailsStoredFood: false,
      light: false
    }
    this.state = defaultState
    this.workspace = Blockly.inject('blocklyDiv',
      {toolbox: document.getElementById('toolbox')});

    this.handleChange = this.handleChange.bind(this)
    this.createDataPoint = this.createDataPoint.bind(this)

    initCodap()
  }

  getDefaultExperimentState() {
    return {
      time: 0,
      o2: 200000,
      co2: 400,
      light: true,
      plantsNumber: 0,
      plantsStoredFood: 100,
      snailsNumber: 0,
      snailsStoredFood: 100
    }
  }

  wait(numSteps) {
    let { co2, o2, time } = this.state
    this.step([
      {organismType: Organism.SNAIL, numberKey: "snailsNumber", foodKey: "snailsStoredFood"},
      {organismType: Organism.PLANT, numberKey: "plantsNumber", foodKey: "plantsStoredFood"}
    ], numSteps)
    this.setState({time: this.state.time + numSteps})
  }

  createDataPoint() {
    let { trackedVars, experiment, time, co2, o2, light, 
      plantsNumber, snailsNumber, plantsStoredFood, snailsStoredFood } = this.state
    let dataPoint = {experiment_number: experiment}
    if (trackedVars.time) {
      dataPoint.hour = time
    }
    if (trackedVars.o2) {
      dataPoint.O2 = Math.round(o2)
    }
    if (trackedVars.co2) {
      dataPoint.CO2 = Math.round(co2)
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
    if (trackedVars.plantsStoredFood) {
      extendDataSet("plants_stored_food")
      dataPoint.plants_stored_food = plantsStoredFood
    }
    if (trackedVars.snailsStoredFood) {
      extendDataSet("snails_stored_food")
      dataPoint.snails_stored_food = snailsStoredFood
    }
    return dataPoint
  }

  reset() {
    let newState = this.getDefaultExperimentState()
    newState.experiment = this.state.experiment + 1
    this.setState(newState, () => {
      sendItems(this.createDataPoint())
    })
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
 
  render() {
    const { time, o2, co2, plantsNumber, snailsNumber, light } = this.state
    return (
      <div>
        <ExperimentHUD colInfos={[
          [
            { label: "Hour", value: time},
            { label: "O2", value: Math.round(o2), unit: "ppm"},
            { label: "CO2", value: Math.round(co2), unit: "ppm"}
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
            this.wait(1)
          }}
        >
        Wait 1 Minute
        </button>
        <button
          onClick={() => {
            this.wait(60)
          }}
        >
        Wait 1 Hour
        </button>
        <button
          onClick={() => {
            this.setState({light: !light})
          }}
        >
        Turn light {light ? "off" : "on"}
        </button>
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
            this.reset()
          }}
        >
        Reset simulation
        </button>
        <br/>
        <br/>
        <button
          onClick={() => {
            var _this = this
            var code = Blockly.JavaScript.workspaceToCode(_this.workspace);
            var myInterpreter = new Interpreter(code, _this.initApi.bind(_this));
            function nextStep() {
              if (myInterpreter.step()) {
                window.setTimeout(nextStep, 10);
              } else {
                _this.workspace.highlightBlock(null)
              }
            }
            nextStep();
          }}
        >
        Run Blockly code
        </button>
        <button
          onClick={() => {
            loadPreset(1, this.workspace)
          }}
        >
        Preset 1
        </button>
        <button
          onClick={() => {
            loadPreset(2, this.workspace)
          }}
        >
        Preset 2
        </button>
        <button
          onClick={() => {
            loadPreset(3, this.workspace)
          }}
        >
        Preset 3
        </button>
        {/*<button
          onClick={() => {
            loadPreset(4, this.workspace)
          }}
        >
        Preset 4
        </button>*/}
        <button
          onClick={() => {
            loadPreset(5, this.workspace)
          }}
        >
        Preset 4
        </button>
        <button
          onClick={() => {
            loadPreset(6, this.workspace)
          }}
        >
        Preset 5
        </button>
        <button
          onClick={() => {
            var xml = Blockly.Xml.workspaceToDom(this.workspace)
            var xml_text = Blockly.Xml.domToText(xml)
            console.clear()
            console.log(xml_text)
          }}
        >
        Save Blockly Code
        </button>
        <button
          onClick={() => {
            var xml_text = prompt("Paste your saved program:")
            var xml = Blockly.Xml.textToDom(xml_text)
            Blockly.Xml.domToWorkspace(xml, this.workspace)
          }}
        >
        Load Blockly Code
        </button>
        <button
          onClick={() => {
            this.workspace.clear()
          }}
        >
        Clear Blockly Code
        </button>
      </div>
    );
  }
}
export default Application;
