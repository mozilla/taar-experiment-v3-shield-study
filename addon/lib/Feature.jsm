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

const PREF_BRANCH = "extensions.taarexpv2";
const CLIENT_STATUS_PREF = PREF_BRANCH + ".client-status";

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


class Client {
  constructor(feature) {
    this.feature = feature;
    const clientStatusJson = Preferences.get(CLIENT_STATUS_PREF);
    if (clientStatusJson && clientStatusJson !== "") {
      this.status = JSON.parse(clientStatusJson);
    } else {
      this.status = {};
      this.status.discoPaneLoaded = false;
      this.status.clickedButton = false;
      this.status.sawPopup = false;
      this.status.startTime = null;
      this.status.totalWebNav = 0;
      this.status.aboutAddonsActiveTabSeconds = 0;
      this.persistStatus();
    }
    // Temporary class variables for extension tracking logic
    this.activeAddons = new Set();
    this.addonHistory = new Set();
    this.lastInstalled = null;
    this.lastDisabled = null;
  }

  getStatus() {
    return this.status;
  }

  setAndPersistStatus(key, value) {
    this.status[key] = value;
    this.persistStatus();
  }

  incrementAndPersistClientStatusAboutAddonsActiveTabSeconds() {
    this.status.aboutAddonsActiveTabSeconds++;
    this.persistStatus();
  }

  persistStatus() {
    Preferences.set(CLIENT_STATUS_PREF, JSON.stringify(this.status));
  }

  resetStatus() {
    Preferences.set(CLIENT_STATUS_PREF, "");
  }

  updateAddons() {
    const prev = this.activeAddons;
    const curr = this.getNonSystemAddons();

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

  getNonSystemAddons() {

    // Prevent a dangling change listener (left after add-on uninstallation) to do anything
    if (!TelemetryEnvironment) {
      this.feature.log.debug("getNonSystemAddons disabled since TelemetryEnvironment is not available - a dangling change listener to do unclean add-on uninstallation?");
      return null;
    }

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

  static bucketURI(uri) {
    if (uri !== "about:addons") {
      if (uri.indexOf("addons.mozilla.org") > 0) {
        uri = "AMO";
      } else {
        uri = "other";
      }
    }
    return uri;
  }

  monitorAddonChanges() {

    // Prevent a dangling change listener (left after add-on uninstallation) to do anything
    if (!TelemetryEnvironment) {
      this.feature.log.debug("monitorAddonChanges disabled since TelemetryEnvironment is not available - a dangling change listener to do unclean add-on uninstallation?");
      return;
    }

    this.activeAddons = this.getNonSystemAddons();
    this.addonHistory = this.getNonSystemAddons();

    TelemetryEnvironment.registerChangeListener("addonListener", (change) => Client.addonChangeListener(change, this, this.feature));

  }

  static addonChangeListener(change, client, feature) {
    if (change === "addons-changed") {
      client.updateAddons();
      const uri = Client.bucketURI(Services.wm.getMostRecentWindow("navigator:browser").gBrowser.currentURI.asciiSpec);

      if (client.lastInstalled) {
        feature.log.debug("Just installed", client.lastInstalled, "from", uri);

        // send telemetry
        const dataOut = {
          "addon_id": String(client.lastInstalled),
          "srcURI": String(uri),
          "pingType": "install",
        };
        feature.notifyViaTelemetry(dataOut);

        client.lastInstalled = null;
      } else if (client.lastDisabled) {
        feature.log.debug("Just disabled", client.lastDisabled, "from", uri);

        // send telemetry
        const dataOut = {
          "addon_id": String(client.lastDisabled),
          "srcURI": String(uri),
          "pingType": "uninstall",
        };
        feature.notifyViaTelemetry(dataOut);

        client.lastDisabled = null;

      }

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
    throw new PageActionElementNotFoundError([window.document, pageAction, window.document.querySelectorAll(".urlbar-page-action")]);
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

    this.variation = variation;
    this.studyUtils = studyUtils;
    this.client = new Client(this);
    this.log = log;

    // reset client status during INSTALL and UPGRADE = a new study period begins
    if (reasonName === "ADDON_INSTALL" || reasonName === "ADDON_UPGRADE") {
      this.client.resetStatus();
    }

    // log what the study variation and other info is.
    this.log.debug(`info ${JSON.stringify(studyUtils.info())}`);

    const clientIdPromise = ClientID.getClientID();

    clientIdPromise.then((clientId) => {

      let aboutAddonsDomain = "https://discovery.addons.mozilla.org/%LOCALE%/firefox/discovery/pane/%VERSION%/%OS%/%COMPATIBILITY_MODE%";
      aboutAddonsDomain += "?study=taarexpv2";
      aboutAddonsDomain += "&branch=" + variation.name;

      // do not supply client id for the control branch
      if (variation.name !== "control") {
        aboutAddonsDomain += "&clientId=" + clientId;
      }

      log.debug(`Study-specific add-ons domain: ${aboutAddonsDomain}`);

      Preferences.set("extensions.webservice.discoverURL", aboutAddonsDomain);

    });

  }

  afterWebExtensionStartup(browser) {

    // to track temporary changing of preference necessary to have about:addons lead to discovery pane directly
    let currentExtensionsUiLastCategoryPreferenceValue = false;

    const client = this.client;
    const self = this;

    client.monitorAddonChanges();

    browser.runtime.onMessage.addListener((msg, sender, sendReply) => {
      self.log.debug("Feature.jsm message handler - msg, sender, sendReply", msg, sender, sendReply);

      // event-based message handlers
      if (msg.init) {
        self.log.debug("init received");
        client.setAndPersistStatus("startTime", String(Date.now()));
        // send telemetry
        const dataOut = {
          "pingType": "init",
        };
        self.notifyViaTelemetry(dataOut);
        sendReply(dataOut);
        return;
      } else if (msg["disco-pane-loaded"]) {
        client.setAndPersistStatus("discoPaneLoaded", true);
        // send telemetry
        const dataOut = {
          "pingType": "disco-pane-loaded",
        };
        self.notifyViaTelemetry(dataOut);
        sendReply({ response: "Disco pane loaded" });
        // restore preference if we changed it temporarily
        if (typeof currentExtensionsUiLastCategoryPreferenceValue !== "undefined" && currentExtensionsUiLastCategoryPreferenceValue !== false) {
          Preferences.set("extensions.ui.lastCategory", currentExtensionsUiLastCategoryPreferenceValue);
        }
        return;
      } else if (msg["trigger-popup"]) {
        if (client.getStatus().discoPaneLoaded === true) {
          self.log.debug("Not triggering popup since disco pane has already been loaded");
          return;
        }
        client.setAndPersistStatus("sawPopup", true);
        const pageAction = getPageAction();
        pageAction.click();
        // send telemetry
        const dataOut = {
          "pingType": "trigger-popup",
        };
        self.notifyViaTelemetry(dataOut);
        sendReply({ response: "Triggered pop-up" });
        return;
      } else if (msg["clicked-disco-button"]) {
        // set pref to force discovery page temporarily so that navigation to about:addons leads directly to the discovery pane
        currentExtensionsUiLastCategoryPreferenceValue = Preferences.get("extensions.ui.lastCategory");
        Preferences.set("extensions.ui.lastCategory", "addons://discover/");
        // navigate to about:addons
        const window = Services.wm.getMostRecentWindow("navigator:browser");
        window.gBrowser.selectedTab = window.gBrowser.addTab("about:addons", { relatedToCurrent: true });
        client.setAndPersistStatus("clickedButton", true);
        closePageAction();
        // send telemetry
        const dataOut = {
          "pingType": "button-click",
        };
        self.notifyViaTelemetry(dataOut);
        sendReply({ response: "Clicked discovery pane button" });
        return;
      } else if (msg["clicked-close-button"]) {
        client.setAndPersistStatus("clickedButton", false);
        closePageAction();
        sendReply({ response: "Closed pop-up" });
        return;
      }

      // getter and setter for client status
      if (msg.getClientStatus) {
        self.log.debug(client.status);
        sendReply(client.getStatus());
      } else if (msg.setAndPersistClientStatus) {
        client.setAndPersistStatus(msg.key, msg.value);
        self.log.debug(client.status);
        sendReply(client.getStatus());
      } else if (msg.incrementAndPersistClientStatusAboutAddonsActiveTabSeconds) {
        client.incrementAndPersistClientStatusAboutAddonsActiveTabSeconds();
        self.log.debug(client.status);
        sendReply(client.getStatus());
      }

    });

  }

  /**
   * Wrapper that ensures that telemetry gets sent in the expected format for the study
   * @param stringStringMap
   */
  notifyViaTelemetry(stringStringMap) {
    const client = this.client;
    stringStringMap.discoPaneLoaded = String(client.status.discoPaneLoaded);
    stringStringMap.clickedButton = String(client.status.clickedButton);
    stringStringMap.sawPopup = String(client.status.sawPopup);
    stringStringMap.startTime = String(client.status.startTime);
    stringStringMap.discoPaneLoaded = String(client.status.discoPaneLoaded);
    stringStringMap.aboutAddonsActiveTabSeconds = String(client.status.aboutAddonsActiveTabSeconds);
    if (typeof stringStringMap.addon_id === "undefined") {
      stringStringMap.addon_id = "null";
    }
    if (typeof stringStringMap.srcURI === "undefined") {
      stringStringMap.srcURI = "null";
    }
    // send telemetry
    this.telemetry(stringStringMap);
  }

  /* good practice to have the literal 'sending' be wrapped up */
  telemetry(stringStringMap) {
    this.studyUtils.telemetry(stringStringMap);
  }

  /* called at end of study */
  shutdown() {
    // send final telemetry
    const dataOut = {
      "pingType": "shutdown",
    };
    this.notifyViaTelemetry(dataOut);
    // remove artifacts of this study
    var defaultBranch = Services.prefs.getDefaultBranch(null);
    defaultBranch.deleteBranch(PREF_BRANCH);
  }
}


// webpack:`libraryTarget: 'this'`
this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;
this.Feature = Feature;
