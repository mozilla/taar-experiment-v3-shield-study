/* eslint-env node */

const Helpers = require("../addon/lib/Helpers.jsm").Helpers;

{

  const fixtures = {
    previousNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com"]),
    currentNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com", "uBlock0@raymondhill.net"]),
  };

  const expected = new Set(["uBlock0@raymondhill.net"]);

  const actual = Helpers.addedItemsDifference(fixtures.previousNonSystemAddons, fixtures.currentNonSystemAddons);

  if (JSON.stringify(Array.from(expected)) !== JSON.stringify(Array.from(actual))) {
    console.log("addedItemsDifference - expected, actual", expected, actual);
    throw new Error("Test 2 - FAIL");
  }
  console.log("Test 1 - PASS");
}

{

  const fixtures = {
    previousNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com", "uBlock0@raymondhill.net"]),
    currentNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com", "uBlock0@raymondhill.net", "support@lastpass.com"]),
  };

  const expected = new Set(["support@lastpass.com"]);

  const actual = Helpers.addedItemsDifference(fixtures.previousNonSystemAddons, fixtures.currentNonSystemAddons);

  if (JSON.stringify(Array.from(expected)) !== JSON.stringify(Array.from(actual))) {
    console.log("addedItemsDifference - expected, actual", expected, actual);
    throw new Error("Test 2 - FAIL");
  }
  console.log("Test 2 - PASS");
}

{

  const fixtures = {
    previousNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com"]),
    currentNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com", "uBlock0@raymondhill.net"]),
  };

  const expected = {
    lastInstalled: "uBlock0@raymondhill.net",
  };

  const actual = Helpers.analyzeAddonChanges(fixtures.previousNonSystemAddons, fixtures.currentNonSystemAddons);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.log("addonChanges - expected, actual", expected, actual);
    throw new Error("Test 3 - FAIL");
  }
  console.log("Test 3 - PASS");
}

{

  const fixtures = {
    previousNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com", "uBlock0@raymondhill.net"]),
    currentNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com", "uBlock0@raymondhill.net", "support@lastpass.com"]),
  };

  const expected = {
    lastInstalled: "support@lastpass.com",
  };

  const actual = Helpers.analyzeAddonChanges(fixtures.previousNonSystemAddons, fixtures.currentNonSystemAddons);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.log("addonChanges - expected, actual", expected, actual);
    throw new Error("Test 4 - FAIL");
  }
  console.log("Test 4 - PASS");
}

{

  const fixtures = {
    previousNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com", "uBlock0@raymondhill.net", "support@lastpass.com"]),
    currentNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com", "support@lastpass.com"]),
  };

  const expected = {
    lastDisabledOrUninstalled: "uBlock0@raymondhill.net",
  };

  const actual = Helpers.analyzeAddonChanges(fixtures.previousNonSystemAddons, fixtures.currentNonSystemAddons);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.log("addonChanges - expected, actual", expected, actual);
    throw new Error("Test 5 - FAIL");
  }
  console.log("Test 5 - PASS");
}

{

  const fixtures = {
    previousNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com", "uBlock0@raymondhill.net", "support@lastpass.com"]),
    currentNonSystemAddons: new Set(["taarexpv2@shield-study.mozilla.com", "support@lastpass.com", "new@foo.com"]),
  };

  const expected = {
    lastInstalled: "new@foo.com",
    lastDisabledOrUninstalled: "uBlock0@raymondhill.net",
  };

  const actual = Helpers.analyzeAddonChanges(fixtures.previousNonSystemAddons, fixtures.currentNonSystemAddons);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.log("addonChanges - expected, actual", expected, actual);
    throw new Error("Test 6 - FAIL");
  }
  console.log("Test 6 - PASS");
}
