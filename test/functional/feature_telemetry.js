/* eslint-env node, mocha */

/* Purpose:
 *
 * Tests that are SPECIFIC TO THIS ADDON's FUNCTIONALITY
 */

// for unhandled promise rejection debugging
process.on("unhandledRejection", r => console.log(r)); // eslint-disable-line no-console

const assert = require("assert");
const utils = require("./utils");

// TODO create new profile per test?
// then we can test with a clean profile every time

/* Part 2:  The Tests */

describe("basic telemetry tests", function() {
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

  beforeEach(async() => {});
  afterEach(async() => {});

  /* Expected behaviour:

  - after install
  - get one of many treatments
  - shield agrees on which treatment.

  */

  it("should send shield telemetry pings", async() => {
    assert(pings.length > 0, "at least one shield telemetry ping");
  });

  it("telemetry", function() {
    // Telemetry:  order, and summary of pings is good.
    const observed = summarizePings(pings);
    const expected = [
      [
        "shield-study-addon",
        {
          attributes: {
            aboutAddonsActiveTabSeconds: "0",
            addon_id: "null",
            clickedButton: "false",
            discoPaneLoaded: "false",
            pingType: "init",
            sawPopup: "false",
            srcURI: "null",
            startTime: "***",
          },
        },
      ],
    ];
    assert.deepEqual(expected, observed, "telemetry pings do not match");
  });
});
