/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(feature)" }]*/

class TAARExperiment {
  constructor() {}

  async configure(studyInfo) {
    const { variation, isFirstRun } = studyInfo;

    // Users with private browsing on autostart should not continue being in the study
    if (await browser.privacyContext.permanentPrivateBrowsing()) {
      await browser.taarStudyMonitor.log(
        "Permanent private browsing, exiting study",
      );
      await browser.study.endStudy({ reason: "ineligible" });
      return;
    }

    let clientStatus;
    clientStatus = await browser.taarStudyMonitor.getClientStatus();

    if (isFirstRun || clientStatus.startTime === null) {
      await TAARExperiment.firstRun();
      clientStatus = await browser.taarStudyMonitor.getClientStatus();
    }

    await browser.taarStudyMonitor.log("clientStatus", clientStatus);
    await browser.taarStudyMonitor.enableTaarInDiscoPane(variation.name);
    browser.runtime.onMessage.addListener(TAARExperiment.popupMessageListener);
    browser.taarStudyMonitor.onAddonChangeTelemetry.addListener(
      TAARExperiment.addonChangeTelemetryListener,
    );
    await browser.taarStudyMonitor.monitorAddonChanges();
    await TAARExperiment.monitorNavigation();
    await TAARExperiment.notifyStudyEverySecondAboutAddonsIsTheActiveTabUrl();
  }

  static popupMessageListener(msg, sender, sendReply) {
    // console.debug("popupMessageListener - msg, sender, sendReply", msg, sender, sendReply);

    if (msg["clicked-disco-button"]) {
      TAARExperiment.notifyClickedDiscoButton();
      sendReply({ response: "Closed pop-up" });
    } else if (msg["clicked-close-button"]) {
      TAARExperiment.notifyClickedCloseButton();
      sendReply({ response: "Clicked discovery pane button" });
    }
  }

  static async addonChangeTelemetryListener(dataOut) {
    await browser.taarStudyMonitor.log("addonChangeTelemetryListener", dataOut);
    await TAARExperiment.notifyViaTelemetry(dataOut);
  }

  static async firstRun() {
    // console.debug("init received");
    await browser.taarStudyMonitor.onFirstRunOnly();
    await browser.taarStudyMonitor.setAndPersistClientStatus(
      "startTime",
      String(Date.now()),
    );
    // send telemetry
    const dataOut = {
      pingType: "init",
    };
    await TAARExperiment.notifyViaTelemetry(dataOut);
  }

  static async monitorNavigation() {
    await browser.taarStudyMonitor.log(
      "Monitoring navigation to be able to show popup after 3 page visits",
    );
    browser.webNavigation.onCompleted.addListener(
      TAARExperiment.webNavListener,
      {
        url: [{ schemes: ["http", "https"] }],
      },
    );
  }

  static async notifyStudyEverySecondAboutAddonsIsTheActiveTabUrl() {
    await browser.taarStudyMonitor.log(
      "Checking the active tab every second to be able to increment aboutAddonsActiveTabSeconds",
    );

    const interval = 1000;

    setInterval(function() {
      const querying = browser.tabs.query({
        currentWindow: true,
        active: true,
      });
      querying.then(function(tabs) {
        if (tabs.length > 0) {
          const gettingInfo = browser.tabs.get(tabs[0].id);
          gettingInfo.then(async function(currentActiveTabInfo) {
            if (
              currentActiveTabInfo.url === "about:addons" &&
              currentActiveTabInfo.status === "complete"
            ) {
              // Do not track anything in private browsing mode
              if (currentActiveTabInfo.incognito) {
                await browser.taarStudyMonitor.log(
                  "Do not track anything in private browsing mode",
                );
                return;
              }

              await browser.taarStudyMonitor.incrementAndPersistClientStatusAboutAddonsActiveTabSeconds();
            }
          }, handleError);
        }
      }, handleError);
    }, interval);
  }

  static async notifyDiscoPaneLoaded() {
    await browser.taarStudyMonitor.setAndPersistClientStatus(
      "discoPaneLoaded",
      true,
    );
    // send telemetry
    const dataOut = {
      pingType: "disco-pane-loaded",
    };
    await TAARExperiment.notifyViaTelemetry(dataOut);
    await browser.discoPaneNav.notifyLoaded();
  }

  static async triggerPopup(webNavInfo) {
    const clientStatus = await browser.taarStudyMonitor.getClientStatus();
    if (clientStatus.discoPaneLoaded === true) {
      await browser.taarStudyMonitor.log(
        "Not triggering popup since disco pane has already been loaded",
      );
      await browser.pageActionRemoteControl.hide();
      return;
    }
    // Show popup
    const tabId = webNavInfo.tabId;
    TAARExperiment.showPageActionAndRememberWhereItWasShown(tabId);
    const locale = browser.i18n
      .getUILanguage()
      .replace("_", "-")
      .toLowerCase();
    browser.pageAction.setPopup({
      tabId,
      popup: "/popup/locales/" + locale + "/popup.html",
    });
    // wait 500ms second to make sure pageAction exists in chrome
    // so we can run browser.pageActionRemoteControl.show() successfully
    setTimeout(TAARExperiment.showPopup, 500);
  }

  static async showPopup() {
    try {
      await browser.pageActionRemoteControl.show();
    } catch (e) {
      if (e.name === "PageActionUrlbarIconElementNotFoundError") {
        console.error(e);
      }
    }
    await browser.taarStudyMonitor.setAndPersistClientStatus("sawPopup", true);
    // send telemetry
    const dataOut = {
      pingType: "trigger-popup",
    };
    await TAARExperiment.notifyViaTelemetry(dataOut);
  }

  static async showPageActionAndRememberWhereItWasShown(tabId) {
    browser.pageAction.show(tabId);
    browser.storage.local.set({ "PA-tabId": tabId });
  }

  static async hidePreviouslyShownPageAction() {
    const localStorageResult = await browser.storage.local.get("PA-tabId");
    browser.pageAction.hide(localStorageResult["PA-tabId"]);
  }

  static async notifyClickedDiscoButton() {
    await browser.discoPaneNav.goto();
    await browser.taarStudyMonitor.setAndPersistClientStatus(
      "clickedButton",
      true,
    );
    await browser.pageActionRemoteControl.hide();
    await TAARExperiment.hidePreviouslyShownPageAction();
    // send telemetry
    const dataOut = {
      pingType: "button-click",
    };
    await TAARExperiment.notifyViaTelemetry(dataOut);
  }

  static async notifyClickedCloseButton() {
    await browser.taarStudyMonitor.setAndPersistClientStatus(
      "clickedButton",
      false,
    );
    await browser.pageActionRemoteControl.hide();
    await TAARExperiment.hidePreviouslyShownPageAction();
  }

  static webNavListener(webNavInfo) {
    // console.debug("webNavListener - webNavInfo:", webNavInfo);
    TAARExperiment.webNavListener_trackDiscoPaneLoading(webNavInfo);
    TAARExperiment.webNavListener_popupRelated(webNavInfo);
  }

  static webNavListener_trackDiscoPaneLoading(webNavInfo) {
    if (
      webNavInfo.frameId > 0 &&
      webNavInfo.url.indexOf("https://discovery.addons.mozilla.org/") > -1 &&
      webNavInfo.parentFrameId === 0
    ) {
      // Only send message if not in incognito tab
      const gettingInfo = browser.tabs.get(webNavInfo.tabId);
      gettingInfo.then(async function(tabInfo) {
        // Do not track anything in private browsing mode
        if (tabInfo.incognito) {
          await browser.taarStudyMonitor.log(
            "Do not track anything in private browsing mode",
            tabInfo,
          );
          return;
        }

        await TAARExperiment.notifyDiscoPaneLoaded();
      }, handleError);
    }
  }

  static webNavListener_popupRelated(webNavInfo) {
    // Filter out any sub-frame related navigation event
    if (webNavInfo.frameId !== 0) {
      return;
    }

    // Increment total navigations and trigger popup when relevant
    const onCompletedWebNavigationInAnActiveNonIncognitoTab = async function(/* currentActiveTabInfo */) {
      // get up to date client status

      const clientStatus = await browser.taarStudyMonitor.getClientStatus();

      clientStatus.totalWebNav++;

      await browser.taarStudyMonitor.setAndPersistClientStatus(
        "totalWebNav",
        clientStatus.totalWebNav,
      );

      const updatedClientStatus = await browser.taarStudyMonitor.getClientStatus();
      await browser.taarStudyMonitor.log(
        "TotalURI: " + updatedClientStatus.totalWebNav,
      );
      if (
        !updatedClientStatus.sawPopup &&
        updatedClientStatus.totalWebNav <= 3
      ) {
        // client has not seen popup
        // arbitrary condition for now
        if (updatedClientStatus.totalWebNav > 2) {
          await TAARExperiment.triggerPopup(webNavInfo);
        }
      } else {
        // client has seen the popup
        await browser.pageActionRemoteControl.hide();
      }
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
              // await browser.taarStudyMonitor.log("Do not track anything in private browsing mode");
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

  /**
   * Wrapper that ensures that telemetry gets sent in the expected format for the study
   * @param stringStringMap
   */
  static async notifyViaTelemetry(stringStringMap) {
    const clientStatus = await browser.taarStudyMonitor.getClientStatus();
    stringStringMap.discoPaneLoaded = String(clientStatus.discoPaneLoaded);
    stringStringMap.clickedButton = String(clientStatus.clickedButton);
    stringStringMap.sawPopup = String(clientStatus.sawPopup);
    stringStringMap.startTime = String(clientStatus.startTime);
    stringStringMap.discoPaneLoaded = String(clientStatus.discoPaneLoaded);
    stringStringMap.aboutAddonsActiveTabSeconds = String(
      clientStatus.aboutAddonsActiveTabSeconds,
    );
    if (typeof stringStringMap.addon_id === "undefined") {
      stringStringMap.addon_id = "null";
    }
    if (typeof stringStringMap.srcURI === "undefined") {
      stringStringMap.srcURI = "null";
    }
    // send telemetry
    TAARExperiment.sendTelemetry(stringStringMap);
  }

  /* good practice to have the literal 'sending' be wrapped up */
  static async sendTelemetry(stringStringMap) {
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
    await TAARExperiment.notifyViaTelemetry(dataOut);
    // remove artifacts of this study
    await browser.taarStudyMonitor.cleanup();
  }
}

function handleError(error) {
  console.error(
    "A study-specific callback handler encountered the following error:",
    error,
  );
}

// make an instance of the feature class available to background.js
// construct only. will be configured after setup
window.feature = new TAARExperiment();
