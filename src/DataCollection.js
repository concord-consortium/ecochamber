import React from 'react';
import { sendItems } from './codap-utils';

require('../assets/css/DataCollection.css');

function getLabeledInput(name, label, checked, handleChange) {
  return <div className="data-box">
          <input type="checkbox" name={name} checked={checked} onChange={handleChange}/>
          <div className="collector-label">
            {label}
          </div>
         </div>

}

const DataCollection = ({trackedVars, handleChange, createDataPoint}) => {
  return (
    <div className="data-collection">
      { getLabeledInput("time", "Time", trackedVars.time, handleChange) }
      { getLabeledInput("o2", "O2", trackedVars.o2, handleChange) }
      { getLabeledInput("co2", "CO2", trackedVars.co2, handleChange) }
      { getLabeledInput("plantsNumber", "Plant population", trackedVars.plantsNumber, handleChange) }
      { getLabeledInput("snailsNumber", "Snail population", trackedVars.snailsNumber, handleChange) }
      <button className="data-button"
        onClick={() => {
          sendItems(createDataPoint())
        }}
      >
      Record Data Point
      </button>
    </div>
  )
}

export default DataCollection;