/* eslint-disable */

ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");

// eslint-disable-next-line no-undef
const { EventManager } = ExtensionCommon;
// eslint-disable-next-line no-undef
const { EventEmitter } = ExtensionUtils;

this.pageActionRemoteControl = class extends ExtensionAPI {
  getAPI(context) {
    return {
      pageActionRemoteControl: {
        /* @TODO no description given */
        show: async function show() {
          console.log("called show ");
          return undefined;
        },

        /* @TODO no description given */
        hide: async function hide() {
          console.log("called hide ");
          return undefined;
        },
      },
    };
  }
};
