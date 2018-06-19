/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(feature)" }]*/
/* eslint no-console:off */

// to track temporary changing of preference necessary to have about:addons lead to discovery pane directly
let currentExtensionsUiLastCategoryPreferenceValue = false;

class TAARExperiment {
  constructor() {}

  async configure(studyInfo) {
    const { variation, isFirstRun } = studyInfo;

    // Users with private browsing on autostart should not continue being in the study
    if (await browser.privacyContext.permanentPrivateBrowsing()) {
      console.log("Permanent private browsing, exiting study");
      await browser.study.endStudy({ reason: "ineligible" });
      return;
    }

    // TODO: Remove need for this
    browser.runtime.onMessage.addListener(this.messageBus);

    await browser.taarStudyMonitor.enableTaarInDiscoPane(variation.name);

    const clientStatus = await browser.taarStudyMonitor.getClientStatus();

    console.log("clientStatus", clientStatus);

    if (isFirstRun) {
      if (clientStatus.startTime === null) {
        await this.firstRun();
      }
    }

    await browser.taarStudyMonitor.monitorAddonChanges();
    TAARExperiment.monitorNavigation();
    TAARExperiment.notifyStudyEverySecondAboutAddonsIsTheActiveTabUrl();
  }

  async firstRun() {
    console.debug("init received");
    await browser.taarStudyMonitor.setAndPersistClientStatus(
      "startTime",
      String(Date.now()),
    );
    // send telemetry
    const dataOut = {
      pingType: "init",
    };
    await this.notifyViaTelemetry(dataOut);
  }

  static monitorNavigation() {
    // console.log("Monitoring navigation to be able to show popup after 3 page visits");
    browser.webNavigation.onCompleted.addListener(webNavListener, {
      url: [{ schemes: ["http", "https"] }],
    });
  }

  static notifyStudyEverySecondAboutAddonsIsTheActiveTabUrl() {
    // console.log("Checking the active tab every second to be able to increment aboutAddonsActiveTabSeconds");

    const interval = 1000;

    setInterval(function() {
      const querying = browser.tabs.query({
        currentWindow: true,
        active: true,
      });
      querying.then(function(tabs) {
        if (tabs.length > 0) {
          const gettingInfo = browser.tabs.get(tabs[0].id);
          gettingInfo.then(function(currentActiveTabInfo) {
            if (
              currentActiveTabInfo.url === "about:addons" &&
              currentActiveTabInfo.status === "complete"
            ) {
              // Do not track anything in private browsing mode
              if (currentActiveTabInfo.incognito) {
                // console.log("Do not track anything in private browsing mode");
                return;
              }

              browser.runtime
                .sendMessage({
                  incrementAndPersistClientStatusAboutAddonsActiveTabSeconds: true,
                })
                .then(
                  function(/* clientStatus */) {
                    // console.log("aboutAddonsActiveTabSeconds increased to: " + clientStatus.aboutAddonsActiveTabSeconds);
                  },
                  handleError,
                );
            }
          }, handleError);
        }
      }, handleError);
    }, interval);
  }

  async messageBus(msg, sender, sendReply) {
    console.debug(
      "Feature.jsm message handler - msg, sender, sendReply",
      msg,
      sender,
      sendReply,
    );

    // event-based message handlers
    if (msg["disco-pane-loaded"]) {
      await browser.taarStudyMonitor.setAndPersistClientStatus(
        "discoPaneLoaded",
        true,
      );
      // send telemetry
      const dataOut = {
        pingType: "disco-pane-loaded",
      };
      await this.notifyViaTelemetry(dataOut);
      sendReply({ response: "Disco pane loaded" });
      // restore preference if we changed it temporarily
      if (
        typeof currentExtensionsUiLastCategoryPreferenceValue !== "undefined" &&
        currentExtensionsUiLastCategoryPreferenceValue !== false
      ) {
        browser.prefs.set(
          "extensions.ui.lastCategory",
          currentExtensionsUiLastCategoryPreferenceValue,
        );
      }
      return;
    } else if (msg["trigger-popup"]) {
      if (
        (await browser.taarStudyMonitor.getClientStatus().discoPaneLoaded) ===
        true
      ) {
        console.debug(
          "Not triggering popup since disco pane has already been loaded",
        );
        return;
      }
      await browser.taarStudyMonitor.setAndPersistClientStatus(
        "sawPopup",
        true,
      );
      try {
        await browser.pageActionRemoteControl.show();
        // send telemetry
        const dataOut = {
          pingType: "trigger-popup",
        };
        await this.notifyViaTelemetry(dataOut);
        sendReply({ response: "Triggered pop-up" });
      } catch (e) {
        if (e.name === "PageActionUrlbarIconElementNotFoundError") {
          console.error(e);
        }
      }
      return;
    } else if (msg["clicked-disco-button"]) {
      // set pref to force discovery page temporarily so that navigation to about:addons leads directly to the discovery pane
      currentExtensionsUiLastCategoryPreferenceValue = browser.prefs.get(
        "extensions.ui.lastCategory",
      );
      browser.prefs.set("extensions.ui.lastCategory", "addons://discover/");

      // navigate to about:addons
      /*
        const window = Services.wm.getMostRecentWindow("navigator:browser");
        window.gBrowser.selectedTab = window.gBrowser.addTab("about:addons", {
          relatedToCurrent: true,
        });
        */

      await browser.taarStudyMonitor.setAndPersistClientStatus(
        "clickedButton",
        true,
      );
      browser.pageActionRemoteControl.hidePageActionUrlbarIcon();
      // send telemetry
      const dataOut = {
        pingType: "button-click",
      };
      await this.notifyViaTelemetry(dataOut);
      sendReply({ response: "Clicked discovery pane button" });
      return;
    } else if (msg["clicked-close-button"]) {
      await browser.taarStudyMonitor.setAndPersistClientStatus(
        "clickedButton",
        false,
      );
      browser.pageActionRemoteControl.hidePageActionUrlbarIcon();
      sendReply({ response: "Closed pop-up" });
      return;
    }

    // getter and setter for browser.taarStudyMonitor status
    if (msg.getClientStatus) {
      console.debug(await browser.taarStudyMonitor.getClientStatus());
      sendReply(await browser.taarStudyMonitor.getClientStatus());
    } else if (msg.setAndPersistClientStatus) {
      await browser.taarStudyMonitor.setAndPersistClientStatus(
        msg.key,
        msg.value,
      );
      console.debug(await browser.taarStudyMonitor.getClientStatus());
      sendReply(await browser.taarStudyMonitor.getClientStatus());
    } else if (msg.incrementAndPersistClientStatusAboutAddonsActiveTabSeconds) {
      await browser.taarStudyMonitor.incrementAndPersistClientStatusAboutAddonsActiveTabSeconds();
      console.debug(await browser.taarStudyMonitor.getClientStatus());
      sendReply(await browser.taarStudyMonitor.getClientStatus());
    }
  }

  /**
   * Wrapper that ensures that telemetry gets sent in the expected format for the study
   * @param stringStringMap
   */
  async notifyViaTelemetry(stringStringMap) {
    const client = this.client;
    stringStringMap.discoPaneLoaded = String(client.status.discoPaneLoaded);
    stringStringMap.clickedButton = String(client.status.clickedButton);
    stringStringMap.sawPopup = String(client.status.sawPopup);
    stringStringMap.startTime = String(client.status.startTime);
    stringStringMap.discoPaneLoaded = String(client.status.discoPaneLoaded);
    stringStringMap.aboutAddonsActiveTabSeconds = String(
      client.status.aboutAddonsActiveTabSeconds,
    );
    if (typeof stringStringMap.addon_id === "undefined") {
      stringStringMap.addon_id = "null";
    }
    if (typeof stringStringMap.srcURI === "undefined") {
      stringStringMap.srcURI = "null";
    }
    // send telemetry
    this.sendTelemetry(stringStringMap);
  }

  /* good practice to have the literal 'sending' be wrapped up */
  async sendTelemetry(stringStringMap) {
    if (await browser.privacyContext.aPrivateBrowserWindowIsOpen()) {
      // drop the ping - do not send any telemetry
      return;
    }
    browser.study.sendTelemetry(stringStringMap);
  }

  /**
   * Called at end of study, and if the user disables the study or it gets uninstalled by other means.
   */
  async cleanup() {
    // send final telemetry
    const dataOut = {
      pingType: "shutdown",
    };
    this.notifyViaTelemetry(dataOut);

    await browser.taarStudyMonitor.reset();
  }
}

function handleError(error) {
  console.error(
    "A study-specific callback handler encountered the following error:",
    error,
  );
}

/**
 * To use as response handler when no response is necessary - to workaround the apparent bug that messages sent without a response handler yields an error
 */
function noop() {}

function triggerPopup() {
  browser.runtime
    .sendMessage({ "trigger-popup": true })
    .then(noop, handleError);
}

function webNavListener(webNavInfo) {
  // console.log("webNavListener - webNavInfo:", webNavInfo);
  webNavListener_trackDiscoPaneLoading(webNavInfo);
  webNavListener_popupRelated(webNavInfo);
}

function webNavListener_trackDiscoPaneLoading(webNavInfo) {
  if (
    webNavInfo.frameId > 0 &&
    webNavInfo.url.indexOf("https://discovery.addons.mozilla.org/") > -1 &&
    webNavInfo.parentFrameId === 0
  ) {
    // Only send message if not in incognito tab
    const gettingInfo = browser.tabs.get(webNavInfo.tabId);
    gettingInfo.then(function(tabInfo) {
      // Do not track anything in private browsing mode
      if (tabInfo.incognito) {
        // console.log("Do not track anything in private browsing mode", tabInfo);
        return;
      }

      browser.runtime
        .sendMessage({ "disco-pane-loaded": true })
        .then(noop, handleError);
    });
  }
}

function webNavListener_popupRelated(webNavInfo) {
  // Filter out any sub-frame related navigation event
  if (webNavInfo.frameId !== 0) {
    return;
  }

  // Increment total navigations and trigger popup when relevant
  const onCompletedWebNavigationInAnActiveNonIncognitoTab = function(/* currentActiveTabInfo */) {
    // get up to date client status
    browser.runtime
      .sendMessage({ getClientStatus: true })
      .then(function(clientStatus) {
        const forcePopup = false; // for testing/debugging - true makes the popup trigger regardless of how many urls have been loaded and despite it having been recorded as shown in local storage
        const locale = browser.i18n
          .getUILanguage()
          .replace("_", "-")
          .toLowerCase();
        const tabId = webNavInfo.tabId;

        clientStatus.totalWebNav++;

        browser.runtime
          .sendMessage({
            setAndPersistClientStatus: true,
            key: "totalWebNav",
            value: clientStatus.totalWebNav,
          })
          .then(function(updatedClientStatus) {
            // console.log("TotalURI: " + updatedClientStatus.totalWebNav);
            if (
              (!updatedClientStatus.sawPopup &&
                updatedClientStatus.totalWebNav <= 3) ||
              forcePopup
            ) {
              // client has not seen popup
              // arbitrary condition for now
              if (updatedClientStatus.totalWebNav > 2 || forcePopup) {
                browser.storage.local.set({ "PA-tabId": tabId });
                browser.pageAction.show(tabId);
                browser.pageAction.setPopup({
                  tabId,
                  popup: "/popup/locales/" + locale + "/popup.html",
                });
                // wait 500ms second to make sure pageAction exists in chrome
                // so we can pageAction.show() from bootstrap.js
                setTimeout(triggerPopup, 500);
              }
            } else {
              // client has seen the popup
              browser.storage.local.get("PA-tabId").then(function(result2) {
                browser.pageAction.hide(result2["PA-tabId"]);
              });
            }
          }, handleError);
      }, handleError);
  };

  // Only consider web navigations that has completed in the currently active tab
  const querying = browser.tabs.query({ currentWindow: true, active: true });
  querying.then(function(tabs) {
    if (tabs.length > 0) {
      const gettingInfo = browser.tabs.get(tabs[0].id);
      gettingInfo.then(function(currentActiveTabInfo) {
        if (
          currentActiveTabInfo.status === "complete" &&
          webNavInfo.tabId === currentActiveTabInfo.id
        ) {
          // Do not track anything in private browsing mode
          if (currentActiveTabInfo.incognito) {
            // console.log("Do not track anything in private browsing mode");
            return;
          }

          onCompletedWebNavigationInAnActiveNonIncognitoTab(
            currentActiveTabInfo,
          );
        }
      });
    }
  });
}

// make an instance of the feature class available to background.js
// construct only. will be configured after setup
window.feature = new TAARExperiment();
