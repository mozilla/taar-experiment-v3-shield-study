/* eslint-disable */

ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");

// eslint-disable-next-line no-undef
const { EventManager } = ExtensionCommon;
// eslint-disable-next-line no-undef
const { EventEmitter } = ExtensionUtils;

this.taarStudyMonitor = class extends ExtensionAPI {
  getAPI(context) {
    return {
      taarStudyMonitor: {
        /* @TODO no description given */
        onFirstRunOnly: async function onFirstRunOnly() {
          console.log("called onFirstRunOnly ");
          return undefined;
        },

        /* @TODO no description given */
        enableTaarInDiscoPane: async function enableTaarInDiscoPane(
          variationName,
        ) {
          console.log("called enableTaarInDiscoPane variationName");
          return undefined;
        },

        /* @TODO no description given */
        monitorAddonChanges: async function monitorAddonChanges() {
          console.log("called monitorAddonChanges ");
          return undefined;
        },

        /* @TODO no description given */
        setAndPersistClientStatus: async function setAndPersistClientStatus(
          key,
          value,
        ) {
          console.log("called setAndPersistClientStatus key, value");
          return undefined;
        },

        /* @TODO no description given */
        getClientStatus: async function getClientStatus() {
          console.log("called getClientStatus ");
          return undefined;
        },

        /* @TODO no description given */
        incrementAndPersistClientStatusAboutAddonsActiveTabSeconds: async function incrementAndPersistClientStatusAboutAddonsActiveTabSeconds() {
          console.log(
            "called incrementAndPersistClientStatusAboutAddonsActiveTabSeconds ",
          );
          return undefined;
        },

        /* @TODO no description given */
        cleanup: async function cleanup() {
          console.log("called cleanup ");
          return undefined;
        },

        /* @TODO no description given */
        log: async function log(value1, value2, value3, value4, value5) {
          console.log("called log value1, value2, value3, value4, value5");
          return undefined;
        },

        // https://firefox-source-docs.mozilla.org/toolkit/components/extensions/webextensions/events.html
        /* Fires when add-on changes are ready to be reported via telemetry. */
        onAddonChangeTelemetry: new EventManager(
          context,
          "taarStudyMonitor:onAddonChangeTelemetry",
          fire => {
            const callback = value => {
              fire.async(value);
            };
            // RegisterSomeInternalCallback(callback);
            return () => {
              // UnregisterInternalCallback(callback);
            };
          },
        ).api(),
      },
    };
  }
};
