/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(EXPORTED_SYMBOLS|Helpers)" }]*/

const EXPORTED_SYMBOLS = this.EXPORTED_SYMBOLS = ["Helpers"];

this.Helpers = {

  setDifference: (setA, setB) => {
    const difference = new Set(setA);
    for (const elem of setB) {
      difference.delete(elem);
    }
    return difference;
  },

  /*
  setUnion: (setA, setB) => {
    const union = new Set(setA);
    for (const elem of setB) {
      union.add(elem);
    }
    return union;
  },
  */

  analyzeAddonChanges: (prev, curr, addonHistory) => {
    const addonChanges = {};
    const currDiff = this.Helpers.setDifference(curr, prev);
    if (currDiff.size > 0) { // an add-on was installed or re-enabled
      const newInstalls = this.Helpers.setDifference(curr, addonHistory);
      if (newInstalls.size > 0) { // new install, not a re-enable
        addonChanges.lastInstalled = newInstalls.values().next().value;
      }
    } else { // an add-on was disabled or uninstalled
      addonChanges.lastDisabled = this.Helpers.setDifference(prev, curr).values().next().value;
    }
    return addonChanges;
  },

};
