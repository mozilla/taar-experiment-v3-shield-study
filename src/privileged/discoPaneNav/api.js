"use strict";

/* global ExtensionAPI, Services, Preferences */

ChromeUtils.import("resource://gre/modules/Console.jsm");
ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource://gre/modules/Preferences.jsm");

this.discoPaneNav = class extends ExtensionAPI {
  getAPI(context) {
    // to track temporary changing of preference necessary to have about:addons lead to discovery pane directly
    let currentExtensionsUiLastCategoryPreferenceValue = false;
    return {
      discoPaneNav: {
        goto: async function goto() {
          // set pref to force discovery page temporarily so that navigation to about:addons leads directly to the discovery pane
          currentExtensionsUiLastCategoryPreferenceValue = Preferences.get(
            "extensions.ui.lastCategory",
          );
          Preferences.set("extensions.ui.lastCategory", "addons://discover/");

          const window = Services.wm.getMostRecentWindow("navigator:browser");
          window.gBrowser.selectedTab = window.gBrowser.addTab("about:addons", {
            relatedToCurrent: true,
          });
        },
        notifyLoaded: async function notifyLoaded() {
          // restore preference if we changed it temporarily
          if (
            typeof currentExtensionsUiLastCategoryPreferenceValue !==
              "undefined" &&
            currentExtensionsUiLastCategoryPreferenceValue !== false
          ) {
            Preferences.set(
              "extensions.ui.lastCategory",
              currentExtensionsUiLastCategoryPreferenceValue,
            );
          }
        },
      },
    };
  }
};
