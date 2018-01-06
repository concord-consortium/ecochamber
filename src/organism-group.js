import React from 'react';

export const Organism = { 
  PLANT: "PLANT",
  SNAIL: "SNAIL",
  properties: {
    "PLANT": { label: "Plants", photosynthesizes: true, respirationRate: 1 },
    "SNAIL": { label: "Snails", photosynthesizes: false, respirationRate: 2 }
  }
}

class OrganismGroup extends React.Component {
  render() {
    const { organismType, numOrganisms, storedFood } = this.props
    const { label } = Organism.properties[organismType]
    return (
      <div>
        {label} - Size: {numOrganisms}, Food Store: {storedFood}%
      </div>
    );
  }
}
export default OrganismGroup;
