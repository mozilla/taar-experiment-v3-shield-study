/* eslint-disable */

ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");

// eslint-disable-next-line no-undef
const { EventManager } = ExtensionCommon;
// eslint-disable-next-line no-undef
const { EventEmitter } = ExtensionUtils;

this.discoPaneNav = class extends ExtensionAPI {
  getAPI(context) {
    return {
      discoPaneNav: {
        /* @TODO no description given */
        goto: async function goto() {
          console.log("called goto ");
          return undefined;
        },
      },
    };
  }
};
