/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(feature)" }]*/
/* eslint no-console:off */

class Feature {
  constructor() {}

  async configure(/* studyInfo*/) {
    /*
    const feature = this;
    const { variation, isFirstRun } = studyInfo;
    */

    // other browser.runtime.onMessage handlers for your addon, if any
    this.feature.afterWebExtensionStartup();

    // Users with private browsing on autostart should not continue being in the study
    const privateBrowsingAutostart = browser.prefs.get(
      "browser.privatebrowsing.autostart",
    );
    if (privateBrowsingAutostart !== false) {
      console.log("Private browsing autostart, exiting study");
      await browser.study.endStudy({ reason: "ineligible" });
      return;
    }

    const experiment = new TAARExperiment();
    experiment.start();

    // to track temporary changing of preference necessary to have about:addons lead to discovery pane directly
    let currentExtensionsUiLastCategoryPreferenceValue = false;

    browser.runtime.onMessage.addListener((msg, sender, sendReply) => {
      self.log.debug(
        "Feature.jsm message handler - msg, sender, sendReply",
        msg,
        sender,
        sendReply,
      );

      // event-based message handlers
      if (msg.init) {
        self.log.debug("init received");
        browser.taarStudyMonitor.setAndPersistStatus(
          "startTime",
          String(Date.now()),
        );
        // send telemetry
        const dataOut = {
          pingType: "init",
        };
        self.notifyViaTelemetry(dataOut);
        sendReply(dataOut);
        return;
      } else if (msg["disco-pane-loaded"]) {
        browser.taarStudyMonitor.setAndPersistStatus("discoPaneLoaded", true);
        // send telemetry
        const dataOut = {
          pingType: "disco-pane-loaded",
        };
        self.notifyViaTelemetry(dataOut);
        sendReply({ response: "Disco pane loaded" });
        // restore preference if we changed it temporarily
        if (
          typeof currentExtensionsUiLastCategoryPreferenceValue !==
            "undefined" &&
          currentExtensionsUiLastCategoryPreferenceValue !== false
        ) {
          browser.prefs.set(
            "extensions.ui.lastCategory",
            currentExtensionsUiLastCategoryPreferenceValue,
          );
        }
        return;
      } else if (msg["trigger-popup"]) {
        if (browser.taarStudyMonitor.getStatus().discoPaneLoaded === true) {
          self.log.debug(
            "Not triggering popup since disco pane has already been loaded",
          );
          return;
        }
        browser.taarStudyMonitor.setAndPersistStatus("sawPopup", true);
        try {
          const pageActionUrlbarIcon = browser.pageActionRemoteControl.getPageActionUrlbarIcon();
          pageActionUrlbarIcon.click();
          // send telemetry
          const dataOut = {
            pingType: "trigger-popup",
          };
          self.notifyViaTelemetry(dataOut);
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

        browser.taarStudyMonitor.setAndPersistStatus("clickedButton", true);
        browser.pageActionRemoteControl.hidePageActionUrlbarIcon();
        // send telemetry
        const dataOut = {
          pingType: "button-click",
        };
        self.notifyViaTelemetry(dataOut);
        sendReply({ response: "Clicked discovery pane button" });
        return;
      } else if (msg["clicked-close-button"]) {
        browser.taarStudyMonitor.setAndPersistStatus("clickedButton", false);
        browser.pageActionRemoteControl.hidePageActionUrlbarIcon();
        sendReply({ response: "Closed pop-up" });
        return;
      }

      // getter and setter for browser.taarStudyMonitor status
      if (msg.getClientStatus) {
        self.log.debug(browser.taarStudyMonitor.status);
        sendReply(browser.taarStudyMonitor.getStatus());
      } else if (msg.setAndPersistClientStatus) {
        browser.taarStudyMonitor.setAndPersistStatus(msg.key, msg.value);
        self.log.debug(browser.taarStudyMonitor.status);
        sendReply(browser.taarStudyMonitor.getStatus());
      } else if (
        msg.incrementAndPersistClientStatusAboutAddonsActiveTabSeconds
      ) {
        browser.taarStudyMonitor.incrementAndPersistClientStatusAboutAddonsActiveTabSeconds();
        self.log.debug(browser.taarStudyMonitor.status);
        sendReply(browser.taarStudyMonitor.getStatus());
      }
    });
  }

  /* good practice to have the literal 'sending' be wrapped up */
  sendTelemetry(stringStringMap) {
    browser.study.sendTelemetry(stringStringMap);
  }

  /**
   * Called at end of study, and if the user disables the study or it gets uninstalled by other means.
   */
  async cleanup() {
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

class TAARExperiment {
  async start() {
    this.info = await browser.study.info();
    await browser.runtime
      .sendMessage({ getClientStatus: true })
      .then(async function(clientStatus) {
        if (clientStatus.startTime === null) {
          await TAARExperiment.firstRun();
        }
        TAARExperiment.monitorNavigation();
        TAARExperiment.notifyStudyEverySecondAboutAddonsIsTheActiveTabUrl();
      }, handleError);
  }

  static async firstRun() {
    return browser.runtime.sendMessage({ init: true }).then(noop, handleError);
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
}

// make an instance of the feature class available to background.js
// construct only. will be configured after setup
window.feature = new Feature();
