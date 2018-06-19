"use strict";

/* global ExtensionAPI */

ChromeUtils.import("resource://gre/modules/Console.jsm");
ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");

// eslint-disable-next-line no-undef
// const { EventManager } = ExtensionCommon;
// eslint-disable-next-line no-undef
// const { EventEmitter } = ExtensionUtils;

// eslint-disable-next-line no-undef
XPCOMUtils.defineLazyModuleGetter(
  this,
  "BrowserWindowTracker",
  "resource:///modules/BrowserWindowTracker.jsm",
);

/** Return most recent NON-PRIVATE browser window, so that we can
 * manipulate chrome elements on it.
 */
function getMostRecentBrowserWindow() {
  return BrowserWindowTracker.getTopWindow({
    private: false,
    allowPopups: false,
  });
}

function getPageActionUrlbarIcon() {
  // eslint-disable-next-line no-undef
  const window = Services.wm.getMostRecentWindow("navigator:browser");
  // Id reference style as was working in taar v1
  let pageActionUrlbarIcon = window.document.getElementById(
    "taarexpv3_shield_mozilla_org-page-action",
  );
  // Firefox 57+
  if (!pageActionUrlbarIcon) {
    pageActionUrlbarIcon = window.document.getElementById(
      "pageAction-urlbar-taarexpv3_shield_mozilla_org",
    );
  }
  if (!pageActionUrlbarIcon) {
    throw new PageActionUrlbarIconElementNotFoundError([
      window.document,
      pageActionUrlbarIcon,
      window.document.querySelectorAll(".urlbar-page-action"),
    ]);
  }
  return pageActionUrlbarIcon;
}

class PageActionUrlbarIconElementNotFoundError extends Error {
  constructor(debugInfo) {
    const message = `"Error: TAAR V3 study add-on page action element not found. Debug content: window.document, pageActionUrlbarIcon, all urlbar page action classed elements: ${debugInfo.toString()}`;
    super(message);
    this.message = message;
    this.debugInfo = debugInfo;
    this.name = "PageActionUrlbarIconElementNotFoundError";
  }
}

/**
 * Note: The page action popup should already be closed via it's own javascript's window.close() after any button is called
 * but it will also close when we hide the page action urlbar icon via this method
 */
function hidePageActionUrlbarIcon() {
  try {
    const pageActionUrlbarIcon = getPageActionUrlbarIcon();
    pageActionUrlbarIcon.remove();
  } catch (e) {
    if (e.name === "PageActionUrlbarIconElementNotFoundError") {
      // All good, no element found
    }
  }
}

this.pageActionRemoteControl = class extends ExtensionAPI {
  getAPI(context) {
    return {
      pageAction: {
        remoteControl: {
          show() {
            getMostRecentBrowserWindow();
          },
          hide() {
            hidePageActionUrlbarIcon();
          },
        },
      },
    };
  }
};
