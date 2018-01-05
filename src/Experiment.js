import React from 'react';

require('../assets/css/Experiment.css');

function getEvenlySpacedDivs(className, containerWidth, divWidth, numDivs) {
  if (numDivs === 1) {
    return [
      <div className={className} key={className} style={{marginLeft: (containerWidth - divWidth) / 2}}/>
    ]
  }

  let divs = []
  for (let i = 0; i < numDivs; i++) {
    let spacing = (containerWidth - divWidth) / (numDivs - 1)
    divs.push(<div className={className} key={className + "-" + i} style={{marginLeft: i * spacing}}/>)
  }
  return divs
}

const Experiment = ({numPlants, numSnails}) => {
  return (
    <div className="experiment-container">
      <div className="jar">
        <div className="jar-contents">
          {getEvenlySpacedDivs("leaf", 212, 100, numPlants)}
          {getEvenlySpacedDivs("snail", 212, 77, numSnails)}
        </div>
      </div>
    </div>
  );
}

export default Experiment;