import React from 'react';

require('../assets/css/ExperimentHUD.css');

const ValueDisplay = ({name, value}) => {
  return (
    <tr className="value-display">
      <td className="statistic">{name}:</td>
      <td className="value">{value}</td>
    </tr>
  );
}

const ExperimentColumn = ({stats}) => {
  let displays = []
  stats.forEach(stat => {
    let { label, value, unit } = stat
    if (!isNaN(value)) {
      value = value.toLocaleString()
    }
    displays.push(<ValueDisplay key={label} name={label} value={value + (unit ? " " + unit : "")} />)
  })
  return (
    <div className="experiment-column">
      <table className="experiment-values">
        <tbody>
          {displays}
        </tbody>
      </table>
    </div>
  )
}

const ExperimentHUD = ({colInfos}) => {
  let cols = []
  colInfos.forEach((colInfo, index) => {
    cols.push(<ExperimentColumn key={index} stats={colInfo.stats}/>)
  })
  return (
    <div className="experiment-hud">
      {cols}
    </div>
  )
}

export default ExperimentHUD;