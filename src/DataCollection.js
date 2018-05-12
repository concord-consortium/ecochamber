import React from 'react';
import { sendItems } from './codap-utils';
import { getURLParam } from './utils';

require('../assets/css/DataCollection.css');

function getLabeledInput(name, label, checked, handleChange) {
  return <div className="data-box">
          <input type="checkbox" name={name} checked={checked} onChange={handleChange}/>
          <div className="collector-label">
            {label}
          </div>
         </div>

}

const DataCollection = ({trackedVars, handleChange, createDataPoint, incSnails, incPlants,
                         toggleLight, reset, wait, light, toggleAutomation, automationEnabled}) => {
  let recordButton = (
    <button className="data-button"
      onClick={() => {
        sendItems(createDataPoint())
      }}
    >
    Record data point
    </button>
  )

  let automationButton = (
    <button
      onClick={() => {
        toggleAutomation()
      }}
    >
    {(automationEnabled ? "Hide" : "Show") + " automation"}
    </button>
  )

  return (
    <div className="data-collection">
      <div className="collection-title">Step 1: Setup Experiment</div>
      <div className="experiment-buttons">
        <button
          onClick={() => {
            incPlants()
          }}
        >
        Add plant
        </button>
        <button
          onClick={() => {
            incSnails()
          }}
        >
        Add snail
        </button>
        <button style={{width: 114}}
          onClick={() => {
            toggleLight()
          }}
        >
        Turn light {light ? "off" : "on"}
        </button>
      </div>
      <div className="collection-title">Step 2: Setup Sensors</div>
      <div className="sensors">
        <div className="sensor-column">
          { getLabeledInput("o2", "O2", trackedVars.o2, handleChange) }
          { getLabeledInput("co2", "CO2", trackedVars.co2, handleChange) }
          { getLabeledInput("light", "Light", trackedVars.light, handleChange) }
        </div>
        <div className="sensor-column">
          { getLabeledInput("time", "Time", trackedVars.time, handleChange) }
          { getLabeledInput("plantsNumber", "Plant population", trackedVars.plantsNumber, handleChange) }
          { getLabeledInput("snailsNumber", "Snail population", trackedVars.snailsNumber, handleChange) }
        </div>
      </div>
      <div className="collection-title">Step 3: Run Experiment</div>
      <div className="experiment-buttons">
        <button
          onClick={() => {
            wait(5)
          }}
        >
        Wait 5 minutes
        </button>
        <button
          onClick={() => {
            wait(60)
          }}
        >
        Wait 1 hour
        </button>
        { getURLParam("showAutomation") === "false" ? null : recordButton }
      </div>
      <div className="collection-title">Step 4: Explore!</div>
      <div className="experiment-buttons">
        <button
          onClick={() => {
            reset()
          }}
        >
        Reset simulation
        </button>
      { getURLParam("showAutomation") === "false" ? null : automationButton }
      </div>
    </div>
  )
}

export default DataCollection;