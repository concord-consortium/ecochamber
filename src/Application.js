import React from 'react';
import Blockly from 'node-blockly/browser';
import OrganismGroup, { Organism } from './organism-group';

class Application extends React.Component {
  constructor() {
    super()
    this.state = this.getDefaultState()
    this.workspace = Blockly.inject('blocklyDiv',
      {toolbox: document.getElementById('toolbox')});
  }

  getDefaultState() {
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
      let newState = []
      newState[varName] = varValue
      _this.setState(newState)
    }
    interpreter.setProperty(scope, 'setVar',
      interpreter.createNativeFunction(wrapper));

    // Add an API function for highlighting blocks
    var wrapper = function(id) {
      id = id ? id.toString() : '';
      return interpreter.createPrimitive(_this.workspace.highlightBlock(id));
    };
    interpreter.setProperty(scope, 'highlightBlock',
      interpreter.createNativeFunction(wrapper));
  }
 
  render() {
    const { time, o2, co2, plants, snails, light } = this.state
    return (
      <div>
        <button
          onClick={() => {
            this.step([
              {organismType: Organism.PLANT, numberKey: "plantsNumber", foodKey: "plantsStoredFood"}, 
              {organismType: Organism.SNAIL, numberKey: "snailsNumber", foodKey: "snailsStoredFood"}
            ])
            this.setState({time: time + 1})
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
            this.setState(this.getDefaultState())
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
      </div>
    );
  }
}
export default Application;
