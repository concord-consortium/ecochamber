import React from 'react';
import OrganismGroup, { Organism } from './organism-group';

class Application extends React.Component {
  constructor() {
    super()
    this.state = this.getDefaultState()
  }

  getDefaultState() {
    return {
      time: 0,
      o2: 10,
      co2: 10,
      plants: {
        organismType: Organism.PLANT, numOrganisms: 0, storedFood: 100
      },
      snails: {
        organismType: Organism.SNAIL, numOrganisms: 0, storedFood: 100
      }
    }
  }

  step(organismInfoKeys) {
    let { co2, o2 } = this.state
    let newState = {}

    organismInfoKeys.forEach(organismInfoKey => {
      let {organismType, numOrganisms, storedFood} = this.state[organismInfoKey]

      if (numOrganisms === 0) {
        return
      }

      let { photosynthesisRate, respirationRate } = Organism.properties[organismType]

      let photosynthesisConversion = numOrganisms * photosynthesisRate
      if (photosynthesisConversion > co2) {
        photosynthesisConversion = co2
      } else {
        storedFood += 3
      }
      o2 += photosynthesisConversion
      co2 -= photosynthesisConversion

      let respirationConversion = numOrganisms * respirationRate
      if (respirationConversion > o2 || storedFood <= 0) {
        respirationConversion = o2
        numOrganisms = 0
      } else {
        // Assume that organisms that can't photosynthesize are auto-fed
        if (photosynthesisRate > 0) {
          storedFood -= 2
        }
      }
      o2 -= respirationConversion
      co2 += respirationConversion

      newState[organismInfoKey] = {
        organismType, 
        numOrganisms, 
        storedFood: Math.max(Math.min(storedFood, 100), 0)
      }
    })
    
    newState.o2 = o2
    newState.co2 = co2
    this.setState(newState)
  }
 
  render() {
    const { time, o2, co2, plants, snails } = this.state
    return (
      <div>
        <button
          onClick={() => {
            this.step(["plants", "snails"])
            this.setState({time: time + 1})
          }}
        >
        Wait 1 Hour
        </button>
        <button
          onClick={() => {
            this.setState(Object.assign(plants, {numOrganisms: plants.numOrganisms + 1}))
          }}
        >
        Add plant
        </button>
        <button
          onClick={() => {
            this.setState(Object.assign(snails, {numOrganisms: snails.numOrganisms + 1}))
          }}
        >
        Add snail
        </button>
        <button
          onClick={() => {
            this.setState(this.getDefaultState())
          }}
        >
        Reset simulation
        </button>
        <br/>
        <OrganismGroup organismInfo={plants} />
        <OrganismGroup organismInfo={snails} />
        Time: {this.state.time}<br/>
        O2: {this.state.o2}<br/>
        CO2: {this.state.co2}
      </div>
    );
  }
}
export default Application;
