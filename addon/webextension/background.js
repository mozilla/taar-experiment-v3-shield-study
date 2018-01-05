"use strict";

/** `background.js` example for embedded webExtensions.
 * - As usual for webExtensions, controls BrowserAction (toolbar button)
 *   look, feel, interactions.
 *
 * - Also handles 2-way communication with the HOST (Legacy Addon)
 *
 *   - all communication to the Legacy Addon is via `browser.runtime.sendMessage`
 *
 *   - Only the webExtension can initiate messages.  see `msgStudyUtils('info')` below.
 */


/**  Re-usable code for talking to `studyUtils` using `browser.runtime.sendMessage`
 *  - Host listens and responds at `bootstrap.js`:
 *
 *   `browser.runtime.onMessage.addListener(studyUtils.respondToWebExtensionMessage)`;
 *
 *  - `msg` calls the corresponding studyUtils API call.
 *
 *     - info: current studyUtils configuration, including 'variation'
 *     - endStudy: for ending a study
 *     - telemetry: send a 'shield-study-addon' packet
 */
async function msgStudyUtils(msg, data) {
  const allowed = ["endStudy", "telemetry", "info"];
  if (!allowed.includes(msg)) throw new Error(`shieldUtils doesn't know ${msg}, only knows ${allowed}`);
  try {
    // the 'shield' key is how the Host listener knows it's for shield.
    return await browser.runtime.sendMessage({ shield: true, msg, data });
  } catch (e) {
    console.error("ERROR msgStudyUtils", msg, data, e);
    throw e;
  }
}

/** `telemetry`
 *
 * - check all pings for validity as 'shield-study-addon' pings
 * - tell Legacy Addon to send
 *
 * Good practice: send all Telemetry from one function for easier
 * logging, debugging, validation
 *
 * Note: kyes, values must be strings to fulfill the `shield-study-addon`
 *   ping-type validation.  This allows `payload.data.attributes` to store
 *   correctly at Parquet at s.t.m.o.
 *
 *   Bold claim:  catching errors here
 *
 */

/*
function telemetry(data) {
  function throwIfInvalid(obj) {
    // Check: all keys and values must be strings,
    for (const k in obj) {
      if (typeof k !== 'string') throw new Error(`key ${k} not a string`);
      if (typeof obj[k] !== 'string') throw new Error(`value ${k} ${obj[k]} not a string`);
    }
    return true
  }

  throwIfInvalid(data);
  return msgStudyUtils("telemetry", data);
}
*/

function handleError(error) {
  console.error("A study-specific message handler encountered the following error:", error);
}

/**
 * To use as response handler when no response is necessary - to workaround the apparent bug that messages sent without a response handler yields an error
 */
function noop() {
}

function triggerPopup() {
  browser.runtime.sendMessage({ "trigger-popup": true }).then(noop, handleError);
}

function webNavListener(info) {
  console.log('webNavListener info', info);
  webNavListener_trackDiscoPaneLoading(info);
  webNavListener_popupRelated(info);
}

function webNavListener_trackDiscoPaneLoading(info) {
  if (info.frameId > 0 && info.url.indexOf('https://discovery.addons.mozilla.org/') > -1 && info.parentFrameId === 0) {
    browser.runtime.sendMessage({ "disco-pane-loaded": true }).then(noop, handleError);
  }
}

function webNavListener_popupRelated(info) {
  // Filter out any sub-frame related navigation event
  if (info.frameId !== 0) {
    return;
  }

  // get up to date client status
  browser.runtime.sendMessage({ "getClientStatus": true }).then(
    function(clientStatus) {

      const forcePopup = false; // for testing/debugging - true makes the popup trigger regardless of how many urls have been loaded and despite it having been recorded as shown in local storage
      const locale = browser.i18n.getUILanguage().replace("_", "-").toLowerCase();
      const tabId = info.tabId;

      clientStatus.totalWebNav++;

      browser.runtime.sendMessage({
        "setAndPersistClientStatus": true,
        "key": "totalWebNav",
        "value": clientStatus.totalWebNav
      }).then(
        function(clientStatus) {

          console.log('TotalURI: ' + clientStatus.totalWebNav);

          if ((!clientStatus.sawPopup && clientStatus.totalWebNav <= 3) || forcePopup) { // client has not seen popup
            // arbitrary condition for now
            if (clientStatus.totalWebNav > 2 || forcePopup) {
              browser.storage.local.set({ "PA-tabId": tabId });
              browser.pageAction.show(tabId);
              browser.pageAction.setPopup({
                tabId,
                popup: "/popup/locales/" + locale + "/popup.html"
              });
              // wait 500ms second to make sure pageAction exists in chrome
              // so we can pageAction.show() from bootstrap.js
              setTimeout(triggerPopup, 500);
            }
          } else { //client has seen the popup
            browser.storage.local.get("PA-tabId").then(function(result2) {
              browser.pageAction.hide(result2["PA-tabId"]);
            });
          }

        },
        handleError
      );

    },
    handleError
  );

}


class TAARExperiment {

  async start() {
    this.info = await msgStudyUtils('info');
    await browser.runtime.sendMessage({ "getClientStatus": true }).then(async function(clientStatus) {
      if (clientStatus.startTime === null) {
        await TAARExperiment.firstRun();
      }
      TAARExperiment.monitorNavigation();
    }, handleError);
  }

  static async firstRun() {
    return browser.runtime.sendMessage({ "init": true }).then(noop, handleError);
  }

  static monitorNavigation() {
    console.log('Monitoring navigation to be able to show popup after 3 page visits');
    browser.webNavigation.onCompleted.addListener(webNavListener,
      { url: [{ schemes: ["http", "https"] }] });
  }
}

let experiment = new TAARExperiment();
experiment.start();

