import React from 'react';

export const Organism = { 
  PLANT: "PLANT",
  properties: {
    "PLANT": { label: "Plants", photosynthesisRate: 5, respirationRate: 1.25 }
  }
}

class OrganismGroup extends React.Component {
  render() {
    const { organismType, numOrganisms, storedFood } = this.props.organismInfo
    const { label } = Organism.properties[organismType]
    return (
      <div>
        {label} - Size: {numOrganisms}, Food Store: {storedFood}%
      </div>
    );
  }
}
export default OrganismGroup;
