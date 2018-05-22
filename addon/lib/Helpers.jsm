/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(EXPORTED_SYMBOLS|Helpers)" }]*/

const EXPORTED_SYMBOLS = this.EXPORTED_SYMBOLS = ["Helpers"];

this.Helpers = {

  addedItemsDifference: (prev, curr) => {
    const difference = new Set(curr);
    for (const elem of prev) {
      difference.delete(elem);
    }
    return difference;
  },

  analyzeAddonChanges: (prev, curr) => {
    const addonChanges = {};
    const addedAddons = this.Helpers.addedItemsDifference(prev, curr);
    const removedAddons = this.Helpers.addedItemsDifference(curr, prev);
    if (addedAddons.size > 0) { // an add-on was installed or re-enabled
      addonChanges.lastInstalled = addedAddons.values().next().value;
    }
    if (removedAddons.size > 0) { // an add-on was disabled or uninstalled
      addonChanges.lastDisabledOrUninstalled = removedAddons.values().next().value;
    }
    return addonChanges;
  },

  bucketURI: (uri) => {
    if (uri.indexOf("about:addons") === 0) {
      uri = "about:addons";
    } else if (uri.indexOf("addons.mozilla") > 0) {
        uri = "AMO";
      } else {
        uri = "other";
      }
    return uri;
  }

};
