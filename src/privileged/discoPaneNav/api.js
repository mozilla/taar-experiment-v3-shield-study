"use strict";

/* global ExtensionAPI */

ChromeUtils.import("resource://gre/modules/Console.jsm");
ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

this.discoPaneNav = class extends ExtensionAPI {
  getAPI(context) {
    return {
      discoPaneNav: {
        goto: async function goto() {
          const window = Services.wm.getMostRecentWindow("navigator:browser");
          window.gBrowser.selectedTab = window.gBrowser.addTab("about:addons", {
            relatedToCurrent: true,
          });
        },
      },
    };
  }
};
