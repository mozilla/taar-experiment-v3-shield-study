/* eslint-env node */
/* eslint no-console:off */

const Helpers = require("../addon/lib/Helpers.jsm").Helpers;

console.log("Helpers.addedItemsDifference:");

{

  const fixtures = {
    previousNonSystemAddons: new Set(["taarexpv2@shield.mozilla.org"]),
    currentNonSystemAddons: new Set(["taarexpv2@shield.mozilla.org", "uBlock0@raymondhill.net"]),
  };

  const expected = new Set(["uBlock0@raymondhill.net"]);

  const actual = Helpers.addedItemsDifference(fixtures.previousNonSystemAddons, fixtures.currentNonSystemAddons);

  if (JSON.stringify(Array.from(expected)) !== JSON.stringify(Array.from(actual))) {
    console.log("expected, actual", expected, actual);
    throw new Error("Test 2 - FAIL");
  }
  console.log("Test 1 - PASS");
}

{

  const fixtures = {
    previousNonSystemAddons: new Set(["taarexpv2@shield.mozilla.org", "uBlock0@raymondhill.net"]),
    currentNonSystemAddons: new Set(["taarexpv2@shield.mozilla.org", "uBlock0@raymondhill.net", "support@lastpass.com"]),
  };

  const expected = new Set(["support@lastpass.com"]);

  const actual = Helpers.addedItemsDifference(fixtures.previousNonSystemAddons, fixtures.currentNonSystemAddons);

  if (JSON.stringify(Array.from(expected)) !== JSON.stringify(Array.from(actual))) {
    console.log("expected, actual", expected, actual);
    throw new Error("Test 2 - FAIL");
  }
  console.log("Test 2 - PASS");
}

console.log("Helpers.analyzeAddonChanges:");

{

  const fixtures = {
    previousNonSystemAddons: new Set(["taarexpv2@shield.mozilla.org"]),
    currentNonSystemAddons: new Set(["taarexpv2@shield.mozilla.org", "uBlock0@raymondhill.net"]),
  };

  const expected = {
    lastInstalled: "uBlock0@raymondhill.net",
  };

  const actual = Helpers.analyzeAddonChanges(fixtures.previousNonSystemAddons, fixtures.currentNonSystemAddons);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.log("expected, actual", expected, actual);
    throw new Error("Test 1 - FAIL");
  }
  console.log("Test 1 - PASS");
}

{

  const fixtures = {
    previousNonSystemAddons: new Set(["taarexpv2@shield.mozilla.org", "uBlock0@raymondhill.net"]),
    currentNonSystemAddons: new Set(["taarexpv2@shield.mozilla.org", "uBlock0@raymondhill.net", "support@lastpass.com"]),
  };

  const expected = {
    lastInstalled: "support@lastpass.com",
  };

  const actual = Helpers.analyzeAddonChanges(fixtures.previousNonSystemAddons, fixtures.currentNonSystemAddons);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.log("expected, actual", expected, actual);
    throw new Error("Test 2 - FAIL");
  }
  console.log("Test 2 - PASS");
}

{

  const fixtures = {
    previousNonSystemAddons: new Set(["taarexpv2@shield.mozilla.org", "uBlock0@raymondhill.net", "support@lastpass.com"]),
    currentNonSystemAddons: new Set(["taarexpv2@shield.mozilla.org", "support@lastpass.com"]),
  };

  const expected = {
    lastDisabledOrUninstalled: "uBlock0@raymondhill.net",
  };

  const actual = Helpers.analyzeAddonChanges(fixtures.previousNonSystemAddons, fixtures.currentNonSystemAddons);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.log("expected, actual", expected, actual);
    throw new Error("Test 3 - FAIL");
  }
  console.log("Test 3 - PASS");
}

{

  const fixtures = {
    previousNonSystemAddons: new Set(["taarexpv2@shield.mozilla.org", "uBlock0@raymondhill.net", "support@lastpass.com"]),
    currentNonSystemAddons: new Set(["taarexpv2@shield.mozilla.org", "support@lastpass.com", "new@foo.com"]),
  };

  const expected = {
    lastInstalled: "new@foo.com",
    lastDisabledOrUninstalled: "uBlock0@raymondhill.net",
  };

  const actual = Helpers.analyzeAddonChanges(fixtures.previousNonSystemAddons, fixtures.currentNonSystemAddons);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.log("expected, actual", expected, actual);
    throw new Error("Test 4 - FAIL");
  }
  console.log("Test 4 - PASS");
}

console.log("Helpers.bucketURI:");

{

  const fixture = "about:addons";

  const expected = "about:addons";

  const actual = Helpers.bucketURI(fixture);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.log("expected, actual", expected, actual);
    throw new Error("Test 1 - FAIL");
  }
  console.log("Test 1 - PASS");
}

{

  const fixture = "https://addons.mozilla.org/en-US/firefox/addon/clippings/?src=collection";

  const expected = "AMO";

  const actual = Helpers.bucketURI(fixture);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.log("expected, actual", expected, actual);
    throw new Error("Test 2 - FAIL");
  }
  console.log("Test 2 - PASS");
}

{

  const fixture = "https://bugzilla.mozilla.org/show_bug.cgi?id=1450951";

  const expected = "other";

  const actual = Helpers.bucketURI(fixture);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.log("expected, actual", expected, actual);
    throw new Error("Test 3 - FAIL");
  }
  console.log("Test 3 - PASS");
}

{

  const fixture = "foobar";

  const expected = "other";

  const actual = Helpers.bucketURI(fixture);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.log("expected, actual", expected, actual);
    throw new Error("Test 4 - FAIL");
  }
  console.log("Test 4 - PASS");
}

{

  const fixture = "https://example.com/false-positive-amo/addons.mozilla.org/";

  const expected = "AMO";

  const actual = Helpers.bucketURI(fixture);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.log("expected, actual", expected, actual);
    throw new Error("Test 5 - FAIL");
  }
  console.log("Test 5 - PASS");
}

{

  const fixture = "about:addons#foo";

  const expected = "about:addons";

  const actual = Helpers.bucketURI(fixture);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.log("expected, actual", expected, actual);
    throw new Error("Test 6 - FAIL");
  }
  console.log("Test 6 - PASS");
}
