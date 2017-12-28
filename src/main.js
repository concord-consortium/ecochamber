import React from 'react';
import ReactDOM from 'react-dom';
import Blockly from 'node-blockly/browser';
import Application from './application';
 
document.addEventListener('DOMContentLoaded', function() {
  Blockly.Blocks['set_experiment_var'] = {
    init: function() {
      this.jsonInit({
        "message0": "%{BKY_VARIABLES_SET}",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "VAR",
            "options": [["hour", "time"]]
          },
          {
            "type": "input_value",
            "name": "VALUE"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "%{BKY_VARIABLES_HUE}",
        "tooltip": "%{BKY_VARIABLES_SET_TOOLTIP}",
      })
    }
  };

  Blockly.JavaScript['set_experiment_var'] = function(block) {
    // Variable setter.
    var argument0 = Blockly.JavaScript.valueToCode(block, 'VALUE',
        Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
    var varName = block.getFieldValue('VAR');
    return 'this.setState({' + varName + ': ' + argument0 + '});\n'
  };

  ReactDOM.render(
    React.createElement(Application),
    document.getElementById('mount')
  );
});