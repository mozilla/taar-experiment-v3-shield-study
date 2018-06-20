/* eslint-env node */
/* eslint no-console:off */

/* This file is a helper script that will install the extension from the .zip
 * file and setup useful preferences for debugging. This is the same setup
 * that the automated Selenium-Webdriver/Mocha tests run, except in this case
 * we can manually interact with the browser.
 */

console.log("Starting up firefox");

const firefox = require("selenium-webdriver/firefox");
const Context = firefox.Context;

const utils = require("./test/functional/utils");

const HELP = `
env vars:

- ADDON_ZIP (optional): path to xpi / addon
  installs $ADDON_ZIP as a temporary addon.

- FIREFOX_BINARY :  nightly | beta | firefox | firefoxdeveloperedition

`;

const minimistHandler = {
  boolean: ["help"],
  alias: { h: "help", v: "version" },
  "--": true,
};

(async() => {
  const minimist = require("minimist");
  const parsedArgs = minimist(process.argv.slice(2), minimistHandler);
  if (parsedArgs.help) {
    console.log(HELP);
    process.exit();
  }

  try {
    const beginTime = Date.now();
    const driver = await utils.setupWebdriver.promiseSetupDriver(
      utils.FIREFOX_PREFERENCES,
    );
    console.log("Firefox started");

    // install the addon
    if (process.env.ADDON_ZIP) {
      await utils.setupWebdriver.installAddon(driver);
      console.log("Installed temporary add-on.");
    }

    // navigate to about:debugging
    driver.setContext(Context.CONTENT);
    driver.get("about:debugging");

    // open the browser console
    utils.ui.openBrowserConsole(driver);

    console.log(
      "The addon should now be loaded and you should be able to interact with the addon in the newly opened Firefox instance.",
    );

    // allow our shield study addon some time to start
    console.log("Waiting 60 seconds to allow for telemetry to be triggered");
    await driver.sleep(60 * 1000);

    await utils.ui.takeScreenshot(driver);
    console.log("Screenshot dumped");

    const studyPings = await utils.telemetry.getShieldPingsAfterTimestamp(
      driver,
      beginTime,
    );
    console.log("Shield study telemetry pings: ");
    console.log(utils.telemetry.pingsReport(studyPings));

    // utils.telemetry.writePingsJson(pings);
    // console.log("Shield study telemetry pings written to pings.json");
  } catch (e) {
    console.error(e);
  }
})();
