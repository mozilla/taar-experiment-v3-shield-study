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
        onFirstRun: async function onFirstRun() {
          console.log("called onFirstRun ");
          return undefined;
        },

        /* @TODO no description given */
        setAndPersistStatus: async function setAndPersistStatus() {
          console.log("called setAndPersistStatus ");
          return undefined;
        },

        /* @TODO no description given */
        getStatus: async function getStatus() {
          console.log("called getStatus ");
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
        reset: async function reset() {
          console.log("called reset ");
          return undefined;
        },
      },
    };
  }
};
