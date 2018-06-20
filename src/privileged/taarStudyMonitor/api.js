"use strict";

/* global ExtensionAPI, Services */

ChromeUtils.import("resource://gre/modules/Services.jsm");

const { ExtensionCommon } = ChromeUtils.import(
  "resource://gre/modules/ExtensionCommon.jsm",
);
const { ExtensionUtils } = ChromeUtils.import(
  "resource://gre/modules/ExtensionUtils.jsm",
);
const { EventManager } = ExtensionCommon;
const { EventEmitter } = ExtensionUtils;

const { Preferences } = ChromeUtils.import(
  "resource://gre/modules/Preferences.jsm",
);

const { ClientID } = ChromeUtils.import("resource://gre/modules/ClientID.jsm");
const { TelemetryEnvironment } = ChromeUtils.import(
  "resource://gre/modules/TelemetryEnvironment.jsm",
);

const PREF_BRANCH = "extensions.taarexpv3";
const SHIELD_STUDY_ADDON_ID = "taarexpv3@shield.mozilla.org";
const CLIENT_STATUS_PREF = PREF_BRANCH + ".client-status";

/**
 * Creates a logger for debugging.
 *
 * The pref to control this is "shieldStudy.logLevel"
 *
 * @param {string} logPrefix - the name of the Console instance
 * @param {string} maxLogLevel - level to use by default
 * @returns {Object} - the Console instance, see gre/modules/Console.jsm
 */
function createShieldStudyLogger(logPrefix, maxLogLevel = "Warn") {
  const prefName = "shieldStudy.logLevel";
  const ConsoleAPI = ChromeUtils.import(
    "resource://gre/modules/Console.jsm",
    {},
  ).ConsoleAPI;
  return new ConsoleAPI({
    maxLogLevel,
    maxLogLevelPref: prefName,
    prefix: logPrefix,
  });
}

const logger = createShieldStudyLogger(PREF_BRANCH + ".taarStudyMonitor");

class Client {
  constructor(apiEventEmitter, Helpers) {
    this.apiEventEmitter = apiEventEmitter;
    this.Helpers = Helpers;
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
    logger.debug("persistStatus", JSON.stringify(this.status));
    Preferences.set(CLIENT_STATUS_PREF, JSON.stringify(this.status));
  }

  resetStatus() {
    Preferences.set(CLIENT_STATUS_PREF, "");
  }

  static analyzeAddonChangesBetweenEnvironments(
    oldEnvironment,
    currentEnvironment,
    Helpers,
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
    TelemetryEnvironment.registerChangeListener(
      "addonListener",
      (change, oldEnvironment) =>
        Client.addonChangeListener(change, oldEnvironment, this),
    );
  }

  static addonChangeListener(change, oldEnvironment, client) {
    if (change === "addons-changed") {
      const addonChanges = Client.analyzeAddonChangesBetweenEnvironments(
        oldEnvironment,
        TelemetryEnvironment.currentEnvironment,
        client.Helpers,
      );
      const uri = Services.wm.getMostRecentWindow("navigator:browser").gBrowser
        .currentURI.asciiSpec;
      const bucketedUri = client.Helpers.bucketURI(uri);

      logger.log(
        "Add-on change - addonChanges, uri, bucketedUri",
        addonChanges,
        uri,
        bucketedUri,
      );

      if (addonChanges.lastInstalled) {
        // feature.log.debug("Just installed", client.lastInstalled, "from", uri);

        // send telemetry
        const dataOut = {
          addon_id: String(addonChanges.lastInstalled),
          srcURI: String(bucketedUri),
          pingType: "install",
        };
        client.apiEventEmitter.emit("AddonChangeTelemetry", dataOut);
      } else if (addonChanges.lastDisabledOrUninstalled) {
        // feature.log.debug("Just disabled", client.lastDisabledOrUninstalled, "from", uri);

        // send telemetry
        const dataOut = {
          addon_id: String(addonChanges.lastDisabledOrUninstalled),
          srcURI: String(bucketedUri),
          pingType: "uninstall",
        };
        client.apiEventEmitter.emit("AddonChangeTelemetry", dataOut);
      }
    }

    // eslint
    return null;
  }
}

this.taarStudyMonitor = class extends ExtensionAPI {
  getAPI(context) {
    // unit-tested study helpers
    const { Helpers } = ChromeUtils.import(
      context.extension.rootURI.resolve("helpers.js"),
    );
    const apiEventEmitter = new EventEmitter();
    const client = new Client(apiEventEmitter, Helpers);
    return {
      taarStudyMonitor: {
        onFirstRunOnly: async function onFirstRunOnly() {
          // reset client status during first run = a new study period begins
          this.client.resetStatus();
        },

        enableTaarInDiscoPane: async function enableTaarInDiscoPane(
          variationName,
        ) {
          const clientIdPromise = ClientID.getClientID();

          clientIdPromise.then(clientId => {
            let aboutAddonsDomain =
              "https://discovery.addons.mozilla.org/%LOCALE%/firefox/discovery/pane/%VERSION%/%OS%/%COMPATIBILITY_MODE%";
            aboutAddonsDomain += "?study=taarexpv3";
            aboutAddonsDomain += "&branch=" + variationName;

            // do not supply client id for the control branch
            if (variationName !== "control") {
              aboutAddonsDomain += "&clientId=" + clientId;
            }

            logger.log(`Study-specific add-ons domain: ${aboutAddonsDomain}`);

            Preferences.set(
              "extensions.webservice.discoverURL",
              aboutAddonsDomain,
            );
          });
        },

        monitorAddonChanges: async function monitorAddonChanges() {
          client.monitorAddonChanges();
        },

        setAndPersistClientStatus: async function setAndPersistClientStatus(
          key,
          value,
        ) {
          return client.setAndPersistStatus(key, value);
        },

        getClientStatus: async function getClientStatus() {
          return client.getStatus();
        },

        async incrementAndPersistClientStatusAboutAddonsActiveTabSeconds() {
          client.incrementAndPersistClientStatusAboutAddonsActiveTabSeconds();
        },

        reset: async function reset() {
          // remove artifacts of this study
          const defaultBranch = Services.prefs.getDefaultBranch(null);
          defaultBranch.deleteBranch(PREF_BRANCH);
        },

        log: async function log(...args) {
          logger.log(...args);
        },

        onAddonChangeTelemetry: new EventManager(
          context,
          "taarStudyMonitor:onAddonChangeTelemetry",
          fire => {
            const listener = (eventReference, dataOut) => {
              fire.async(dataOut);
            };
            apiEventEmitter.on("AddonChangeTelemetry", listener);
            return () => {
              apiEventEmitter.off("AddonChangeTelemetry", listener);
            };
          },
        ).api(),
      },
    };
  }
};
