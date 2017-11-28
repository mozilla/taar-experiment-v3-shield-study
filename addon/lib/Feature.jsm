"use strict";


/**  Example Feature module for a Shield Study.
 *
 *  UI:
 *  - during INSTALL only, show a notification bar with 2 buttons:
 *    - "Thanks".  Accepts the study (optional)
 *    - "I don't want this".  Uninstalls the study.
 *
 *  Firefox code:
 *  - Implements the 'introduction' to the 'button choice' study, via notification bar.
 *
 *  Demonstrates `studyUtils` API:
 *
 *  - `telemetry` to instrument "shown", "accept", and "leave-study" events.
 *  - `endStudy` to send a custom study ending.
 *
 **/

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(EXPORTED_SYMBOLS|Feature)" }]*/

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Console.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Preferences.jsm");
Cu.import("resource://gre/modules/ClientID.jsm");
Cu.import("resource://gre/modules/TelemetryEnvironment.jsm");
Cu.import("resource://gre/modules/TelemetryController.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");

const EXPORTED_SYMBOLS = ["Feature"];

XPCOMUtils.defineLazyModuleGetter(this, "RecentWindow",
  "resource:///modules/RecentWindow.jsm");

/** Return most recent NON-PRIVATE browser window, so that we can
 * manipulate chrome elements on it.
 */

/*
function getMostRecentBrowserWindow() {
  return RecentWindow.getMostRecentBrowserWindow({
    private: false,
    allowPopups: false,
  });
}
*/


class clientStatus {
  constructor() {
    this.clickedButton = null;
    this.sawPop = false;
    this.activeAddons = new Set();
    this.addonHistory = new Set();
    this.lastInstalled = null;
    this.lastDisabled = null;
    this.startTime = null;
  }

  updateAddons() {
    const prev = this.activeAddons;
    const curr = getNonSystemAddons();

    console.log({ "prev": prev, "curr": curr });

    const currDiff = curr.difference(prev);
    if (currDiff.size > 0) { // an add-on was installed or re-enabled
      const newInstalls = curr.difference(this.addonHistory);
      if (newInstalls.size > 0) { // new install, not a re-enable
        this.lastInstalled = newInstalls.values().next().value;
      }
    } else { // an add-on was disabled or uninstalled
      this.lastDisabled = prev.difference(curr).values().next().value;
    }
    this.activeAddons = curr;
  }
}

function getNonSystemAddons() {
  const activeAddons = TelemetryEnvironment.currentEnvironment.addons.activeAddons;
  const result = new Set();
  for (const addon in activeAddons) {
    const data = activeAddons[addon];
    if (!data.isSystem && !data.foreignInstall) {
      result.add(addon);
    }
  }
  return (result);
}

function bucketURI(uri) {
  if (uri !== "about:addons") {
    if (uri.indexOf("addons.mozilla.org") > 0) {
      uri = "AMO";
    } else {
      uri = "other";
    }
  }
  return uri;
}

function addonChangeListener(change, client, studyUtils) {
  if (change === "addons-changed") {
    console.log("\n\n SOMETHING CHANGED WITH ADDONS... \n\n\n -----------------");
    client.updateAddons();
    const uri = bucketURI(Services.wm.getMostRecentWindow("navigator:browser").gBrowser.currentURI.asciiSpec);

    if (client.lastInstalled) {
      // send telemetry
      const dataOut = {
        "clickedButton": String(client.clickedButton),
        "sawPopup": String(client.sawPopup),
        "startTime": String(client.startTime),
        "addon_id": String(client.lastInstalled),
        "srcURI": String(uri),
        "pingType": "install",
      };
      console.log("Just installed", client.lastInstalled, "from", uri);
      console.log(dataOut);
      studyUtils.telemetry(dataOut);

      client.lastInstalled = null;
    } else if (client.lastDisabled) {
      console.log("Just disabled", client.lastDisabled, "from", uri);

      // send telemetry
      const dataOut = {
        "clickedButton": String(client.clickedButton),
        "sawPopup": String(client.sawPopup),
        "startTime": String(client.startTime),
        "addon_id": String(client.lastDisabled),
        "srcURI": String(uri),
        "pingType": "uninstall",
      };
      studyUtils.telemetry(dataOut);
      console.log(dataOut);

      client.lastDisabled = null;

    }


  }
}

function getPageAction() {

  const window = Services.wm.getMostRecentWindow("navigator:browser");
  // Id reference style as was working in taar v1
  let pageAction = window.document.getElementById("taarexpv2_shield-study_mozilla_com-page-action");
  // Firefox 57+
  if (!pageAction) {
    pageAction = window.document.getElementById("pageAction-urlbar-taarexpv2_shield-study_mozilla_com");
  }
  if (!pageAction) {
    throw new PageActionElementNotFoundError([window.document, pageAction, window.document.querySelectorAll('.urlbar-page-action')]);
  }
  return pageAction;

}

class PageActionElementNotFoundError extends Error {
  constructor(debugInfo) {
    const message = `"Error: TAAR V2 study add-on page action element not found. Debug content: window.document, pageAction, all urlbar page action classed elements: ${debugInfo.toString()}`;
    super(message);
    this.message = message;
    this.name = "PageActionElementNotFoundError";
  }
}

function closePageAction() {
  try {
    const pageAction = getPageAction();
    pageAction.remove();
  } catch (e) {
    if (e.name === "PageActionElementNotFoundError") {
      // All good, no element found
    }
  }
}

Set.prototype.difference = function(setB) {
  const difference = new Set(this);
  for (const elem of setB) {
    difference.delete(elem);
  }
  return difference;
};

Set.prototype.union = function(setB) {
  const union = new Set(this);
  for (const elem of setB) {
    union.add(elem);
  }
  return union;
};

class Feature {
  /** A Demonstration feature.
   *
   *  - variation: study info about particular client study variation
   *  - studyUtils:  the configured studyUtils singleton.
   *  - reasonName: string of bootstrap.js startup/shutdown reason
   *
   */
  constructor({ variation, studyUtils, reasonName, log }) {
    // unused.  Some other UI might use the specific variation info for things.
    this.variation = variation;
    this.studyUtils = studyUtils;
    this.client = new clientStatus();
    this.log = log;

    // only during INSTALL
    if (reasonName === "ADDON_INSTALL") {
      // this.introductionNotificationBar();
    }

    // log what the study variation and other info is.
    this.log.debug(`info ${JSON.stringify(studyUtils.info())}`);

    const clientId = ClientID.getClientID();

    // default
    let aboutAddonsDomain = "https://discovery.addons.mozilla.org/%LOCALE%/firefox/discovery/pane/%VERSION%/%OS%/%COMPATIBILITY_MODE%";
    if (variation.name === "taar-disco-popup" || variation.name === "taar-disco") {
      aboutAddonsDomain += "?clientId=" + clientId;
      Preferences.set("extensions.webservice.discoverURL", aboutAddonsDomain);
    }

  }

  afterWebExtensionStartup(browser) {

    const client = this.client;
    const self = this;

    client.activeAddons = getNonSystemAddons();
    client.addonHistory = getNonSystemAddons();
    TelemetryEnvironment.registerChangeListener("addonListener", function(x) {
      addonChangeListener(x, client, self.studyUtils);
      self.log.debug(client);
    });

    browser.runtime.onMessage.addListener((msg, sender, sendReply) => {
      this.log.debug("msg, sender, sendReply", msg, sender, sendReply);
      // message handers //////////////////////////////////////////
      if (msg.init) {
        this.log.debug("init received");
        client.startTime = Date.now();
        const dataOut = {
          "clickedButton": String(client.clickedButton),
          "sawPopup": String(client.sawPopup),
          "startTime": String(client.startTime),
          "addon_id": String(client.lastInstalled),
          "srcURI": "null",
          "pingType": "init",
        };
        this.telemetry(dataOut);
        this.log.debug(dataOut);
        sendReply(dataOut);
      } else if (msg["trigger-popup"]) {
        const pageAction = getPageAction();
        pageAction.click();
        sendReply(null);


      } else if (msg["clicked-disco-button"]) {
        const window = Services.wm.getMostRecentWindow("navigator:browser");
        window.gBrowser.selectedTab = window.gBrowser.addTab("about:addons", { relatedToCurrent: true });
        client.clickedButton = true;
        closePageAction();
        sendReply(null);
      } else if (msg["clicked-close-button"]) {
        client.clickedButton = false;
        closePageAction();
        sendReply(null);
      }
    });

  }

  /* good practice to have the literal 'sending' be wrapped up */
  telemetry(stringStringMap) {
    this.studyUtils.telemetry(stringStringMap);
  }

  /* no-op shutdown */
  shutdown() {
  }
}


// webpack:`libraryTarget: 'this'`
this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;
this.Feature = Feature;
