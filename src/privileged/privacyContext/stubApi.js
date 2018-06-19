/* eslint-disable */

ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");

// eslint-disable-next-line no-undef
const { EventManager } = ExtensionCommon;
// eslint-disable-next-line no-undef
const { EventEmitter } = ExtensionUtils;

this.privacyContext = class extends ExtensionAPI {
  getAPI(context) {
    return {
      privacyContext: {
        /* @TODO no description given */
        permanentPrivateBrowsing: async function permanentPrivateBrowsing() {
          console.log("called permanentPrivateBrowsing ");
          return undefined;
        },

        /* @TODO no description given */
        aPrivateBrowserWindowIsOpen: async function aPrivateBrowserWindowIsOpen() {
          console.log("called aPrivateBrowserWindowIsOpen ");
          return undefined;
        },
      },
    };
  }
};
