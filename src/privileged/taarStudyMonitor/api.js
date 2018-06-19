"use strict";

/* global ExtensionAPI */

const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { XPCOMUtils } = ChromeUtils.import(
  "resource://gre/modules/XPCOMUtils.jsm",
);
/*
const { ExtensionCommon } = ChromeUtils.import(
  "resource://gre/modules/ExtensionCommon.jsm",
);
const { ExtensionUtils } = ChromeUtils.import(
  "resource://gre/modules/ExtensionUtils.jsm",
);
*/

// eslint-disable-next-line no-undef
// const { EventManager } = ExtensionCommon;
// eslint-disable-next-line no-undef
// const { EventEmitter } = ExtensionUtils;

const { Preferences } = ChromeUtils.import(
  "resource://gre/modules/Preferences.jsm",
);
const { ClientID } = ChromeUtils.import("resource://gre/modules/ClientID.jsm");
const { TelemetryEnvironment } = ChromeUtils.import(
  "resource://gre/modules/TelemetryEnvironment.jsm",
);
const { PrivateBrowsingUtils } = ChromeUtils.import(
  "resource://gre/modules/PrivateBrowsingUtils.jsm",
);

const EXPORTED_SYMBOLS = ["Feature"];

const PREF_BRANCH = "extensions.taarexpv3";
const SHIELD_STUDY_ADDON_ID = "taarexpv3@shield.mozilla.org";
const CLIENT_STATUS_PREF = PREF_BRANCH + ".client-status";

// eslint-disable-next-line no-undef
XPCOMUtils.defineLazyModuleGetter(
  this,
  "BrowserWindowTracker",
  "resource:///modules/BrowserWindowTracker.jsm",
);

/** Return most recent NON-PRIVATE browser window, so that we can
 * manipulate chrome elements on it.
 */
/*
function getMostRecentBrowserWindow() {
  return BrowserWindowTracker.getTopWindow({
    private: false,
    allowPopups: false,
  });
}
*/

// unit-tested study helpers
const BASE = `taarexpv3`;
const { Helpers } = ChromeUtils.import(`chrome://${BASE}/content/helpers.js`);

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

  static analyzeAddonChangesBetweenEnvironments(
    oldEnvironment,
    currentEnvironment,
  ) {
    const prev = Client.activeNonSystemAddonIdsInEnvironment(oldEnvironment);
    const curr = Client.activeNonSystemAddonIdsInEnvironment(
      currentEnvironment,
    );
    return Helpers.analyzeAddonChanges(prev, curr);
  }

  static activeNonSystemAddonIdsInEnvironment(environment) {
    const activeAddons = environment.addons.activeAddons;
    const result = new Set();
    for (const addonId in activeAddons) {
      // Do not count this extension
      if (addonId === SHIELD_STUDY_ADDON_ID) {
        continue;
      }
      const data = activeAddons[addonId];
      if (!data.isSystem && !data.foreignInstall) {
        result.add(addonId);
      }
    }
    return result;
  }

  monitorAddonChanges() {
    // Prevent a dangling change listener (left after add-on uninstallation) to do anything
    if (!TelemetryEnvironment) {
      this.feature.log.debug(
        "monitorAddonChanges disabled since TelemetryEnvironment is not available - a dangling change listener to do unclean add-on uninstallation?",
      );
      return;
    }

    TelemetryEnvironment.registerChangeListener(
      "addonListener",
      (change, oldEnvironment) =>
        Client.addonChangeListener(change, oldEnvironment, this, this.feature),
    );
  }

  static addonChangeListener(change, oldEnvironment, client, feature) {
    // Prevent a dangling change listener (left after add-on uninstallation) to do anything
    if (!TelemetryEnvironment) {
      feature.log.debug(
        "addonChangeListener disabled since TelemetryEnvironment is not available - a dangling change listener to do unclean add-on uninstallation?",
      );
      return null;
    }

    if (change === "addons-changed") {
      const addonChanges = Client.analyzeAddonChangesBetweenEnvironments(
        oldEnvironment,
        TelemetryEnvironment.currentEnvironment,
      );
      const uri = Helpers.bucketURI(
        Services.wm.getMostRecentWindow("navigator:browser").gBrowser.currentURI
          .asciiSpec,
      );
      if (addonChanges.lastInstalled) {
        // feature.log.debug("Just installed", client.lastInstalled, "from", uri);

        // send telemetry
        const dataOut = {
          addon_id: String(addonChanges.lastInstalled),
          srcURI: String(uri),
          pingType: "install",
        };
        feature.notifyViaTelemetry(dataOut);
      } else if (addonChanges.lastDisabledOrUninstalled) {
        // feature.log.debug("Just disabled", client.lastDisabledOrUninstalled, "from", uri);

        // send telemetry
        const dataOut = {
          addon_id: String(addonChanges.lastDisabledOrUninstalled),
          srcURI: String(uri),
          pingType: "uninstall",
        };
        feature.notifyViaTelemetry(dataOut);
      }
    }

    // eslint
    return null;
  }
}

class Feature {
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

    clientIdPromise.then(clientId => {
      let aboutAddonsDomain =
        "https://discovery.addons.mozilla.org/%LOCALE%/firefox/discovery/pane/%VERSION%/%OS%/%COMPATIBILITY_MODE%";
      aboutAddonsDomain += "?study=taarexpv3";
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
    const client = this.client;

    client.monitorAddonChanges();
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
    stringStringMap.aboutAddonsActiveTabSeconds = String(
      client.status.aboutAddonsActiveTabSeconds,
    );
    if (typeof stringStringMap.addon_id === "undefined") {
      stringStringMap.addon_id = "null";
    }
    if (typeof stringStringMap.srcURI === "undefined") {
      stringStringMap.srcURI = "null";
    }
    // send telemetry
    this.telemetry(stringStringMap);
  }

  aPrivateBrowserWindowIsOpen() {
    if (PrivateBrowsingUtils.permanentPrivateBrowsing) {
      return true;
    }
    const windowList = Services.wm.getEnumerator("navigator:browser");
    while (windowList.hasMoreElements()) {
      const nextWin = windowList.getNext();
      if (PrivateBrowsingUtils.isWindowPrivate(nextWin)) {
        return true;
      }
    }
    return false;
  }

  telemetry(stringStringMap) {
    if (this.aPrivateBrowserWindowIsOpen()) {
      // drop the ping - do not send any telemetry
      return;
    }
    this.studyUtils.telemetry(stringStringMap);
  }

  /* called at end of study */
  cleanup() {
    // send final telemetry
    const dataOut = {
      pingType: "shutdown",
    };
    this.notifyViaTelemetry(dataOut);
    // remove artifacts of this study
    const defaultBranch = Services.prefs.getDefaultBranch(null);
    defaultBranch.deleteBranch(PREF_BRANCH);
  }
}

// webpack:`libraryTarget: 'this'`
this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;
this.Feature = Feature;

/*
class IntroductionNotificationBarEventEmitter extends EventEmitter {
  emitShow(variationName) {
    const self = this;
    const recentWindow = getMostRecentBrowserWindow();
    const doc = recentWindow.document;
    const notificationBox = doc.querySelector(
      "#high-priority-global-notificationbox",
    );

    if (!notificationBox) return;

    // api: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/Method/appendNotification
    const notice = notificationBox.appendNotification(
      "Welcome to the new feature! Look for changes!",
      "feature orienation",
      null, // icon
      notificationBox.PRIORITY_INFO_HIGH, // priority
      // buttons
      [
        {
          label: "Thanks!",
          isDefault: true,
          callback: function acceptButton() {
            // eslint-disable-next-line no-console
            console.log("clicked THANKS!");
            self.emit("introduction-accept");
          },
        },
        {
          label: "I do not want this.",
          callback: function leaveStudyButton() {
            // eslint-disable-next-line no-console
            console.log("clicked NO!");
            self.emit("introduction-leave-study");
          },
        },
      ],
      // callback for nb events
      null,
    );

    // used by testing to confirm the bar is set with the correct config
    notice.setAttribute("variation-name", variationName);

    self.emit("introduction-shown");
  }
}
*/

this.taarStudyMonitor = class extends ExtensionAPI {
  getAPI(context) {
    return {
      taarStudyMonitor: {
        onFirstRun: async function onFirstRun() {
          console.log("called onFirstRun ");
          return undefined;
        },

        setAndPersistStatus: async function setAndPersistStatus() {
          console.log("called setAndPersistStatus ");
          return undefined;
        },

        getStatus: async function getStatus() {
          console.log("called getStatus ");
          return undefined;
        },

        incrementAndPersistClientStatusAboutAddonsActiveTabSeconds: async function incrementAndPersistClientStatusAboutAddonsActiveTabSeconds() {
          console.log(
            "called incrementAndPersistClientStatusAboutAddonsActiveTabSeconds ",
          );
          return undefined;
        },

        reset: async function reset() {
          console.log("called reset ");
          return undefined;
        },
      },
    };
  }
};
