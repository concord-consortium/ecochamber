import React from 'react';
import Blockly from 'node-blockly/browser';
import OrganismGroup, { Organism } from './organism-group';
import { initCodap, sendItems, extendDataSet } from './codap-utils';
import { loadPreset } from './presets';

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

    initCodap()
  }

  getDefaultExperimentState() {
    return {
      time: 0,
      o2: 30,
      co2: 30,
      light: true,
      plantsNumber: 0,
      plantsStoredFood: 100,
      snailsNumber: 0,
      snailsStoredFood: 100
    }
  }

  wait() {
    let { co2, o2, time } = this.state
    this.step([
      {organismType: Organism.PLANT, numberKey: "plantsNumber", foodKey: "plantsStoredFood"}, 
      {organismType: Organism.SNAIL, numberKey: "snailsNumber", foodKey: "snailsStoredFood"}
    ])
    this.setState({time: this.state.time + 1})
    sendItems(this.createDataPoint());
  }

  createDataPoint() {
    let { trackedVars, experiment, time, co2, o2, light, 
      plantsNumber, snailsNumber, plantsStoredFood, snailsStoredFood } = this.state
    let dataPoint = {experiment_number: experiment}
    if (trackedVars.time) {
      dataPoint.hour = time
    }
    if (trackedVars.o2) {
      dataPoint.O2 = o2
    }
    if (trackedVars.co2) {
      dataPoint.CO2 = co2
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
    this.setState(this.getDefaultExperimentState())
    this.setState({experiment: this.state.experiment + 1})
  }

  step(organismInfos) {
    let { co2, o2, light } = this.state

    organismInfos.forEach(organismInfo => {
      let {organismType, numberKey, foodKey} = organismInfo
      let numOrganisms = this.state[numberKey]
      let storedFood = this.state[foodKey]

      if (numOrganisms === 0) {
        return
      }

      let { photosynthesisRate, respirationRate } = Organism.properties[organismType]

      let photosynthesisConversion = numOrganisms * photosynthesisRate
      if (!light) {
        photosynthesisConversion = 0
      } else if (photosynthesisConversion > co2) {
        photosynthesisConversion = co2
      } else if (photosynthesisConversion > 0) {
        storedFood += 6
      }
      o2 += photosynthesisConversion
      co2 -= photosynthesisConversion

      let respirationConversion = numOrganisms * respirationRate
      if (respirationConversion > o2 || storedFood <= 0) {
        respirationConversion = 0
        numOrganisms = 0
        storedFood = 100
      } else {
        // Assume that organisms that can't photosynthesize are auto-fed
        if (photosynthesisRate > 0) {
          storedFood -= 2
        }
      }
      o2 -= respirationConversion
      co2 += respirationConversion

      let newState = {}
      newState[foodKey] = Math.max(storedFood, 0)
      newState[numberKey] = numOrganisms
      this.setState(newState)
    })
    
    this.setState({
      o2,
      co2
    })
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

    // Add an API function for the wait() block.
    wrapper = function() {
      _this.wait()
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
    const { time, o2, co2, plants, snails, light } = this.state
    return (
      <div>
        <button
          onClick={() => {
            this.wait()
          }}
        >
        Wait 1 Hour
        </button>
        <button
          onClick={() => {
            this.setState({light: !light})
          }}
        >
        Toggle light
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
        <OrganismGroup organismType={Organism.PLANT} numOrganisms={this.state.plantsNumber} storedFood={this.state.plantsStoredFood} />
        <OrganismGroup organismType={Organism.SNAIL} numOrganisms={this.state.snailsNumber} storedFood={this.state.snailsStoredFood} />
        Hour: {this.state.time}<br/>
        O2: {this.state.o2} mL<br/>
        CO2: {this.state.co2} mL<br/>
        Light: {light ? "On" : "Off"}
        <br/>
        <input type="checkbox" name="time" checked={this.state.trackedVars.time} onChange={this.handleChange}/>Track Time
        <input type="checkbox" name="o2" checked={this.state.trackedVars.o2} onChange={this.handleChange}/>Track O2
        <input type="checkbox" name="co2" checked={this.state.trackedVars.co2} onChange={this.handleChange}/>Track CO2
        <input type="checkbox" name="light" checked={this.state.trackedVars.light} onChange={this.handleChange}/>Track Light
        <input type="checkbox" name="plantsNumber" checked={this.state.trackedVars.plantsNumber} onChange={this.handleChange}/>Track Plant Population
        <input type="checkbox" name="snailsNumber" checked={this.state.trackedVars.snailsNumber} onChange={this.handleChange}/>Track Snail Population
        <input type="checkbox" name="plantsStoredFood" checked={this.state.trackedVars.plantsStoredFood} onChange={this.handleChange}/>Track Stored Plant Food
        <input type="checkbox" name="snailsStoredFood" checked={this.state.trackedVars.snailsStoredFood} onChange={this.handleChange}/>Track Stored Snail Food
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
            console.log(xml_text)
            alert(xml_text)
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
