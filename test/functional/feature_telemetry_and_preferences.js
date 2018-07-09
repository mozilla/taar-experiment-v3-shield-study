/* eslint-env node, mocha */

// for unhandled promise rejection debugging
process.on("unhandledRejection", r => console.error(r)); // eslint-disable-line no-console

const assert = require("assert");
const utils = require("./utils");

describe("feature telemetry and preferences", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(15000);

  let driver;
  let beginTime;
  // let addonId;
  const originalPreferences = {};

  // runs ONCE
  before(async() => {
    beginTime = Date.now();

    // driver = await utils.setupWebdriver.promiseSetupDriver(utils.FIREFOX_PREFERENCES);
    // Due to https://github.com/mozilla/shield-studies-addon-utils/issues/232, we can only expect
    // cleanup to run upon expiration of the add-on, and not when the user uninstalls/disables the add-on
    // Thus, we set a preference that simulates that the study will expire after a few seconds
    const msInOneDay = 60 * 60 * 24 * 1000;
    const expiresInDays = 7 * 7; // Needs to be the same as in src/studySetup.js
    const firstRunTimestamp = beginTime - msInOneDay * expiresInDays + 5000;
    const addonWidgetId = await utils.ui.addonWidgetId();
    const customPreferences = Object.assign({}, utils.FIREFOX_PREFERENCES);
    customPreferences[
      `extensions.${addonWidgetId}.test.firstRunTimestamp`
    ] = String(firstRunTimestamp);

    driver = await utils.setupWebdriver.promiseSetupDriver(customPreferences);

    // check initial preferences before study add-on installation
    originalPreferences[
      "extensions.taarexpv3_shield_mozilla_org.client-status"
    ] = await utils.preferences.get(
      driver,
      "extensions.taarexpv3_shield_mozilla_org.client-status",
    );
    originalPreferences[
      "extensions.taarexpv3_shield_mozilla_org.test.variationName"
    ] = await utils.preferences.get(
      driver,
      "extensions.taarexpv3_shield_mozilla_org.test.variationName",
    );
    originalPreferences[
      "extensions.webservice.discoverURL"
    ] = await utils.preferences.get(
      driver,
      "extensions.webservice.discoverURL",
    );
    originalPreferences[
      "browser.pageActions.persistedActions"
    ] = await utils.preferences.get(
      driver,
      "browser.pageActions.persistedActions",
    );
    // console.log("originalPreferences", originalPreferences);

    /* addonId = */ await utils.setupWebdriver.installAddon(driver);
  });

  after(async() => {
    driver.quit();
  });

  beforeEach(async() => {});
  afterEach(async() => {});

  describe("study start", function() {
    const currentPreferences = {};
    before(async() => {
      // allow our shield study add-on some time to get started
      await driver.sleep(2000);

      // check preferences after study add-on installation
      currentPreferences[
        "extensions.taarexpv3_shield_mozilla_org.client-status"
      ] = await utils.preferences.get(
        driver,
        "extensions.taarexpv3_shield_mozilla_org.client-status",
      );
      currentPreferences[
        "extensions.taarexpv3_shield_mozilla_org.test.variationName"
      ] = await utils.preferences.get(
        driver,
        "extensions.taarexpv3_shield_mozilla_org.test.variationName",
      );
      currentPreferences[
        "extensions.webservice.discoverURL"
      ] = await utils.preferences.get(
        driver,
        "extensions.webservice.discoverURL",
      );
      currentPreferences[
        "browser.pageActions.persistedActions"
      ] = await utils.preferences.get(
        driver,
        "browser.pageActions.persistedActions",
      );
      // console.log("currentPreferences after installation", currentPreferences);
    });

    describe("should have started properly", function() {
      let studyPings;

      before(async() => {
        // collect sent pings
        studyPings = await utils.telemetry.getShieldPingsAfterTimestamp(
          driver,
          beginTime,
        );
        // for debugging tests
        // console.log("Pings report: ", utils.telemetry.pingsReport(studyPings));
      });

      it("should have sent at least one shield telemetry ping", async() => {
        assert(studyPings.length > 0, "at least one shield telemetry ping");
      });

      it("should have sent the expected telemetry", function() {
        // Telemetry:  order, and summary of pings is good.
        const filteredPings = studyPings.filter(
          ping => ping.type === "shield-study-addon",
        );

        const maskedPings = filteredPings.map(p => {
          // prevent irrelevant comparisons of dynamic variables
          if (
            p.payload.data.attributes &&
            p.payload.data.attributes.startTime
          ) {
            p.payload.data.attributes.startTime = "***";
          }
          return p;
        });

        const observed = utils.telemetry.summarizePings(maskedPings);
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

      it("should have modified the expected preferences", async() => {
        assert(
          currentPreferences[
            "extensions.taarexpv3_shield_mozilla_org.client-status"
          ].indexOf('{"discoPaneLoaded":false') > -1,
        );
        assert.strictEqual(
          currentPreferences[
            "extensions.taarexpv3_shield_mozilla_org.test.variationName"
          ],
          originalPreferences[
            "extensions.taarexpv3_shield_mozilla_org.test.variationName"
          ],
        );
        assert(
          currentPreferences["extensions.webservice.discoverURL"].indexOf(
            "https://discovery.addons.mozilla.org/%LOCALE%/firefox/discovery/pane/%VERSION%/%OS%/%COMPATIBILITY_MODE%?study=taarexpv3&branch=intervention-a&clientId=",
          ) > -1,
        );
        assert(
          currentPreferences["browser.pageActions.persistedActions"].indexOf(
            "taarexpv3_shield_mozilla_org",
          ) > -1,
        );
      });
    });
  });

  describe("study end", function() {
    const finalPreferences = {};

    before(async() => {
      beginTime = Date.now();

      // uninstalling the add-on = opting out of the study = ending the study
      // await utils.setupWebdriver.uninstallAddon(driver, addonId);

      // allow our shield study add-on time to expire + some time to clean up after itself
      await driver.sleep(7000);

      // check preferences after study add-on installation
      finalPreferences[
        "extensions.taarexpv3_shield_mozilla_org.client-status"
      ] = await utils.preferences.get(
        driver,
        "extensions.taarexpv3_shield_mozilla_org.client-status",
      );
      finalPreferences[
        "extensions.taarexpv3_shield_mozilla_org.test.variationName"
      ] = await utils.preferences.get(
        driver,
        "extensions.taarexpv3_shield_mozilla_org.test.variationName",
      );
      finalPreferences[
        "extensions.webservice.discoverURL"
      ] = await utils.preferences.get(
        driver,
        "extensions.webservice.discoverURL",
      );
      finalPreferences[
        "browser.pageActions.persistedActions"
      ] = await utils.preferences.get(
        driver,
        "browser.pageActions.persistedActions",
      );
      // console.log("finalPreferences", finalPreferences);
    });

    describe("should have ended properly", function() {
      let studyPings;

      before(async() => {
        // collect sent pings
        studyPings = await utils.telemetry.getShieldPingsAfterTimestamp(
          driver,
          beginTime,
        );
        // for debugging tests
        // console.log("Pings report: ", utils.telemetry.pingsReport(studyPings));
      });

      it("should have sent final telemetry on study end", function() {
        // Telemetry:  order, and summary of pings is good.
        const filteredPings = studyPings.filter(
          ping => ping.type === "shield-study-addon",
        );

        const maskedPings = filteredPings.map(p => {
          // prevent irrelevant comparisons of dynamic variables
          if (
            p.payload.data.attributes &&
            p.payload.data.attributes.startTime
          ) {
            p.payload.data.attributes.startTime = "***";
          }
          return p;
        });

        const observed = utils.telemetry.summarizePings(maskedPings);
        const expected = [
          [
            "shield-study-addon",
            {
              attributes: {
                aboutAddonsActiveTabSeconds: "0",
                addon_id: "null",
                clickedButton: "false",
                discoPaneLoaded: "false",
                pingType: "shutdown",
                sawPopup: "false",
                srcURI: "null",
                startTime: "***",
              },
            },
          ],
        ];
        assert.deepStrictEqual(expected, observed, "telemetry pings match");
      });

      it("should have restored the original preferences after the study has ended", async() => {
        assert.strictEqual(
          finalPreferences[
            "extensions.taarexpv3_shield_mozilla_org.client-status"
          ],
          originalPreferences[
            "extensions.taarexpv3_shield_mozilla_org.client-status"
          ],
        );
        assert.strictEqual(
          finalPreferences[
            "extensions.taarexpv3_shield_mozilla_org.test.variationName"
          ],
          null,
        );
        assert.strictEqual(
          finalPreferences["extensions.webservice.discoverURL"],
          originalPreferences["extensions.webservice.discoverURL"],
        );
        assert(
          finalPreferences["browser.pageActions.persistedActions"].indexOf(
            "taarexpv3_shield_mozilla_org",
          ) === -1,
        );
      });
    });
  });
});
