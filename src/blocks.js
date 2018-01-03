import Blockly from 'node-blockly/browser';

export function configureBlocks() {
  Blockly.JavaScript.STATEMENT_PREFIX = "highlightBlock(%1);\n"
  Blockly.JavaScript.addReservedWords('highlightBlock')

  // Number variable getter
  Blockly.Blocks['get_experiment_num'] = {
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
        "output": "Number",
        "colour": "%{BKY_MATH_HUE}",
        "tooltip": "%{BKY_VARIABLES_GET_TOOLTIP}",
      })
    }
  };

  Blockly.JavaScript['get_experiment_num'] = function(block) {
    var varName = block.getFieldValue('VAR');
    return ['getVar("' + varName + '")', Blockly.JavaScript.ORDER_ATOMIC];
  };

  // Boolean variable getter
  Blockly.Blocks['get_experiment_bool'] = {
    init: function() {
      this.jsonInit({
        "message0": "%1 is %2?",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "VAL",
            "options": [["light", "light"]]
          },
          {
            "type": "input_value",
            "name": "BOOL",
            "check": "Boolean"
          }
        ],
        "output": "Boolean",
        "colour": "%{BKY_LOGIC_HUE}",
        "tooltip": "%{BKY_VARIABLES_GET_TOOLTIP}",
      })
    }
  };

  Blockly.JavaScript['get_experiment_bool'] = function(block) {
    var varName = block.getFieldValue('VAL')
    var targetVal = Blockly.JavaScript.valueToCode(block, 'BOOL',
        Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
    return ['getVar("' + varName + '") === ' + targetVal, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // Logic boolean (with student-readable labels)
  Blockly.Blocks['on_off_bool'] = {
    init: function() {
      this.jsonInit({
        "message0": "%1",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "BOOL",
            "options": [
              ["on", "TRUE"],
              ["off", "FALSE"]
            ]
          }
        ],
        "output": "Boolean",
        "colour": "%{BKY_LOGIC_HUE}",
        "tooltip": "%{BKY_VARIABLES_GET_TOOLTIP}",
      })
    }
  };

  Blockly.JavaScript['on_off_bool'] = function(block) {
    var code = (block.getFieldValue('BOOL') == 'TRUE') ? 'true' : 'false'
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // Number variable setter
  Blockly.Blocks['set_experiment_num'] = {
    init: function() {
      this.jsonInit({
        "message0": "%{BKY_VARIABLES_SET}",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "VAR",
            "options": [["plants", "plantsNumber"], ["snails", "snailsNumber"]]
          },
          {
            "type": "input_value",
            "name": "VALUE",
            "check": "Number"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "%{BKY_VARIABLES_HUE}",
        "tooltip": "%{BKY_VARIABLES_SET_TOOLTIP}",
      })
    }
  };

  Blockly.JavaScript['set_experiment_num'] = function(block) {
    var argument0 = Blockly.JavaScript.valueToCode(block, 'VALUE',
        Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
    var varName = block.getFieldValue('VAR');
    return 'setVar("' + varName + '", ' + argument0 + ');\n'
  };

  // Boolean variable setter
  Blockly.Blocks['set_experiment_bool'] = {
    init: function() {
      this.jsonInit({
        "message0": "%{BKY_VARIABLES_SET}",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "VAR",
            "options": [["light", "light"]]
          },
          {
            "type": "input_value",
            "name": "VALUE",
            "check": "Boolean"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "%{BKY_VARIABLES_HUE}",
        "tooltip": "%{BKY_VARIABLES_SET_TOOLTIP}",
      })
    }
  };

  Blockly.JavaScript['set_experiment_bool'] = function(block) {
    var argument0 = Blockly.JavaScript.valueToCode(block, 'VALUE',
        Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
    var varName = block.getFieldValue('VAR');
    return 'setVar("' + varName + '", ' + argument0 + ');\n'
  };

  // Wait block
  Blockly.Blocks['wait'] = {
    init: function() {
      this.jsonInit({
        "message0": "Wait 1 hr",
        "previousStatement": null,
        "nextStatement": null,
        "colour": "%{BKY_VARIABLES_HUE}",
      })
    }
  };

  Blockly.JavaScript['wait'] = function(block) {
    return 'wait();\n'
  };

  // Reset block
  Blockly.Blocks['reset'] = {
    init: function() {
      this.jsonInit({
        "message0": "Reset simulation",
        "previousStatement": null,
        "nextStatement": null,
        "colour": "%{BKY_VARIABLES_HUE}",
      })
    }
  };

  Blockly.JavaScript['reset'] = function(block) {
    return 'reset();\n'
  };
}