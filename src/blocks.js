import Blockly from 'node-blockly/browser';

export function configureBlocks() {
  Blockly.Blocks['get_experiment_var'] = {
    init: function() {
      this.jsonInit({
        "message0": "%1",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "VAR",
            "options": [["hour", "time"], ["plants", "plantsNumber"], ["snails", "snailsNumber"]]
          }
        ],
        "output": null,
        "colour": "%{BKY_VARIABLES_HUE}",
        "tooltip": "%{BKY_VARIABLES_GET_TOOLTIP}",
      })
    }
  };

  Blockly.JavaScript['get_experiment_var'] = function(block) {
    // Variable getter.
    var varName = block.getFieldValue('VAR');
    return ['getVar("' + varName + '")', Blockly.JavaScript.ORDER_ATOMIC];
  };


  Blockly.Blocks['set_experiment_var'] = {
    init: function() {
      this.jsonInit({
        "message0": "%{BKY_VARIABLES_SET}",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "VAR",
            "options": [["hour", "time"], ["plants", "plantsNumber"], ["snails", "snailsNumber"]]
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
    return 'setVar("' + varName + '", ' + argument0 + ');\n'
  };

  Blockly.Blocks['wait'] = {
    init: function() {
      this.jsonInit({
        "message0": "Wait 1 hr",
        "previousStatement": null,
        "nextStatement": null,
        "colour": "%{BKY_VARIABLES_HUE}",
        "tooltip": "%{BKY_VARIABLES_SET_TOOLTIP}",
      })
    }
  };

  Blockly.JavaScript['wait'] = function(block) {
    // Variable setter.
    var argument0 = Blockly.JavaScript.valueToCode(block, 'VALUE',
        Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
    var varName = block.getFieldValue('VAR');
    return 'this.setState({' + varName + ': ' + argument0 + '});\n'
  };
}