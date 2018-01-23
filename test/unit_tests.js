/* eslint-env node */

const Helpers = require("../addon/lib/Helpers.jsm").Helpers;

{

  const fixtures = {
    previousNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com"]),
    currentNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com", "uBlock0@raymondhill.net"]),
    studyInitNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com"]),
  };

  const expected = {
    lastInstalled: "uBlock0@raymondhill.net",
  };

  const actual = Helpers.analyzeAddonChanges(fixtures.previousNonSystemAddons, fixtures.currentNonSystemAddons, fixtures.studyInitNonSystemAddons);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.log("addonChanges", expected, actual);
    throw new Error("Test failed");
  }
}

{

  const fixtures = {
    previousNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com", "uBlock0@raymondhill.net"]),
    currentNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com", "uBlock0@raymondhill.net", "support@lastpass.com"]),
    studyInitNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com"]),
  };

  const expected = {
    lastInstalled: "support@lastpass.com",
  };

  const actual = Helpers.analyzeAddonChanges(fixtures.previousNonSystemAddons, fixtures.currentNonSystemAddons, fixtures.studyInitNonSystemAddons);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.log("addonChanges", expected, actual);
    throw new Error("Test failed");
  }

}
