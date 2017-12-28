import React from 'react';
import ReactDOM from 'react-dom';
import Blockly from 'node-blockly/browser';
import Application from './application';

import { configureBlocks } from './blocks';
 
document.addEventListener('DOMContentLoaded', function() {
  configureBlocks()

  ReactDOM.render(
    React.createElement(Application),
    document.getElementById('mount')
  );
});