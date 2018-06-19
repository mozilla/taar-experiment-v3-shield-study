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
        recordFirstRun: async function recordFirstRun() {
          console.log("called recordFirstRun ");
          return undefined;
        },
      },
    };
  }
};
