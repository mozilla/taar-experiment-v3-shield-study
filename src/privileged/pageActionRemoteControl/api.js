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
const { ExtensionError } = ExtensionUtils;

// eslint-disable-next-line no-undef
XPCOMUtils.defineLazyModuleGetter(
  this,
  "BrowserWindowTracker",
  "resource:///modules/BrowserWindowTracker.jsm",
);

this.pageActionRemoteControl = class extends ExtensionAPI {
  getAPI(context) {
    const { extension } = this;
    // Copied here from tree
    function makeWidgetId(id) {
      id = id.toLowerCase();
      return id.replace(/[^a-z0-9_-]/g, "_");
    }
    const widgetId = makeWidgetId(extension.manifest.applications.gecko.id);

    function getPageActionUrlbarIcon() {
      // eslint-disable-next-line no-undef
      const window = Services.wm.getMostRecentWindow("navigator:browser");
      // Id reference style as was working pre Firefox 57
      let pageActionUrlbarIcon = window.document.getElementById(
        `${widgetId}-page-action`,
      );
      // Firefox 57+
      if (!pageActionUrlbarIcon) {
        pageActionUrlbarIcon = window.document.getElementById(
          `pageAction-urlbar-${widgetId}`,
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

    class PageActionUrlbarIconElementNotFoundError extends ExtensionError {
      constructor(debugInfo) {
        const message = `"Error: Add-on page action element not found. Debug content: window.document, pageActionUrlbarIcon, all urlbar page action classed elements: ${debugInfo.toString()}`;
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

    return {
      pageActionRemoteControl: {
        show: async function show() {
          const pageActionUrlbarIcon = getPageActionUrlbarIcon();
          pageActionUrlbarIcon.click();
        },
        hide: async function hide() {
          hidePageActionUrlbarIcon();
        },
      },
    };
  }
};
