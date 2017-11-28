/* eslint-env node, mocha */

/* Purpose:
 *
 * Tests that are SPECIFIC TO THIS ADDON's FUNCTIONALITY
 */

// for unhandled promise rejection debugging
process.on("unhandledRejection", r => console.log(r)); // eslint-disable-line no-console

const assert = require("assert");
const utils = require("./utils");
// const clipboardy = require("clipboardy");
// const webdriver = require("selenium-webdriver");
// const firefox = require("selenium-webdriver/firefox");

/*
const By = webdriver.By;
const Context = firefox.Context;
const until = webdriver.until;
const MAX_TIMES_TO_SHOW = 5; // this must match MAX_TIMES_TO_SHOW in bootstrap.js
const MOZILLA_ORG = "http://mozilla.org";
*/

// TODO create new profile per test?
// then we can test with a clean profile every time

/* Part 1:  Utilities */

async function getShieldPingsAfterTimestamp(driver, ts) {
  return utils.getTelemetryPings(driver, { type: ["shield-study", "shield-study-addon"], timestamp: ts });
}

function summarizePings(pings) {
  return pings.map(p => {

    // prevent irrelevant comparisons of dynamic variables
    if (p.payload.data.attributes && p.payload.data.attributes.startTime) {
      p.payload.data.attributes.startTime = "***";
    }

    return [p.payload.type, p.payload.data];

  });
}

/*
async function postTestReset(driver) {
  // wait for the animation to end before running subsequent tests
  await utils.waitForAnimationEnd(driver);
  // close the popup
  await utils.closePanel(driver);
  // reset the counter pref to 0 so that the treatment is always shown
  // reset the addedBool pref
  await driver.executeAsyncScript((...args) => {
    const callback = args[args.length - 1];
    Components.utils.import("resource://gre/modules/Preferences.jsm");
    const COUNTER_PREF = "extensions.sharebuttonstudy.counter";
    const ADDED_BOOL_PREF = "extensions.sharebuttonstudy.addedBool";
    if (Preferences.has(COUNTER_PREF)) {
      Preferences.set(COUNTER_PREF, 0);
    }
    if (Preferences.has(ADDED_BOOL_PREF)) {
      Preferences.set(ADDED_BOOL_PREF, false);
    }
    callback();
  });
}
*/


/* Part 2:  The Tests */

describe("basic functional tests", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(15000);

  let driver;
  let pings;

  // runs ONCE
  before(async() => {
    const beginTime = Date.now();
    driver = await utils.promiseSetupDriver();
    // await setTreatment(driver, "doorHangerAddToToolbar");

    // install the addon
    await utils.installAddon(driver);
    // add the share-button to the toolbar
    // await utils.addShareButton(driver);
    // allow our shield study addon some time to send initial pings
    await driver.sleep(1000);
    // collect sent pings
    pings = await getShieldPingsAfterTimestamp(driver, beginTime);
    // console.log(pingsReport(pings).report);

  });

  after(async() => {
    driver.quit();
  });

  /*
  async function getNotification(driver) {
    return utils.getChromeElementBy.tagName(driver, "notification");
  }

  async function getFirstButton(driver) {
    return utils.getChromeElementBy.className(driver, "notification-button");
    // console.log(await nb.getLocation(), await nb.getAttribute("label"));
    // return nb;
  }
  */

  beforeEach(async() => {
  });
  afterEach(async() => {
  });
  // afterEach(async() => postTestReset(driver));

  /* Expected behaviour:

  - after install
  - get one of many treatments
  - shield agrees on which treatment.

  */

  it("should send shield telemetry pings", async() => {
    assert(pings.length > 0, "at least one shield telemetry ping");
  });

  it("at least one shield-study telemetry ping with study_state=installed", async() => {
    const foundPings = utils.searchTelemetry([
      ping => ping.type === "shield-study" && ping.payload.data.study_state === "installed",
    ], pings);
    assert(foundPings.length > 0, "at least one shield-study telemetry ping with study_state=installed");
  });

  it("at least one shield-study telemetry ping with study_state=enter", async() => {
    const foundPings = utils.searchTelemetry([
      ping => ping.type === "shield-study" && ping.payload.data.study_state === "enter",
    ], pings);
    assert(foundPings.length > 0, "at least one shield-study telemetry ping with study_state=enter");
  });

  it("telemetry: has entered, installed, etc", function() {
    // Telemetry:  order, and summary of pings is good.
    const observed = summarizePings(pings);
    const expected = [
      [
        "shield-study",
        {
          "study_state": "installed",
        },
      ],
      [
        "shield-study",
        {
          "study_state": "enter",
        },
      ],
      [
        "shield-study-addon",
        {
          "attributes": {
            "addon_id": "null",
            "clickedButton": "null",
            "pingType": "init",
            "sawPopup": "undefined",
            "srcURI": "null",
            "startTime": "***",
          },
        },
      ],
    ];
    assert.deepEqual(expected, observed, "telemetry pings do not match");
  });

});
