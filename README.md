Ecochamber
---
 
To start, run the following commands:

```
npm install
npm run start
```

Then visit `http://localhost:3000/`. You will need to reload the page to view changes. 

Here are URL parameters you can pass to modify the app's behavior:

* `showAutomation=false`: hides the Blockly automation area, and automatically collects data when time passes.
* `noise=true`: adds or subtracts up to `sqrt(value)` at random from all gas measurements.
* `noiseMultiplier=5`: multiplies the amount of possible sensor noise in conjuction with the `noise` parameter.
* `rushMode=false`: disables the ability for users to speed up automated experiments.

e.g. https://concord-consortium.github.io/ecochamber/?rushMode=false&noise=true

The app is served on GitHub Pages. To deploy, run:

```
npm run compile
npm run deploy
```

For local changes to be recognized, you may need to delete `bundle.js` and `styles.css` locally after compiling.