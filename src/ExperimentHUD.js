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
    displays.push(<ValueDisplay key={label} name={label} value={value + (unit ? " " + unit : "")} />)
  })
  return (
    <table className="experiment-values">
      <tbody>
        {displays}
      </tbody>
    </table>
  )
}

const ExperimentHUD = ({colInfos}) => {
  let cols = []
  colInfos.forEach((colInfo, index) => {
    cols.push(<ExperimentColumn key={index} stats={colInfo}/>)
  })
  return (
    <div className="experiment-hud">
      {cols}
    </div>
  )
}

export default ExperimentHUD;