import React from 'react';
import ReactDOM from 'react-dom';
import Application from './application';
 
document.addEventListener('DOMContentLoaded', function() {
  ReactDOM.render(
    React.createElement(Application),
    document.getElementById('mount')
  );
});
