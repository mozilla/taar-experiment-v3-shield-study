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
    throw e
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

function triggerPopup() {

  function handleResponse(message) {
    console.log(`Message from the privileged script: ${message.response}`);
    browser.storage.local.set({ sawPopup: true });
  }

  function handleError(error) {
    console.log(error);
  }

  const sending = browser.runtime.sendMessage({ "trigger-popup": true });
  sending.then(handleResponse, handleError);
}

function webNavListener(info) {
  console.log('webNavListener info', info);
  // Filter out any sub-frame related navigation event
  if (info.frameId !== 0) {
    return;
  }
  browser.storage.local.get("hostNavigationStats").then(results => {
    console.log('hostNavigationStats results', results);
    // Initialize the saved stats if not yet initialized.
    if (!results.hostNavigationStats) {
      results = {
        hostNavigationStats: {}
      };
    }
    const testing = false; // true makes the popup trigger regardless of how many urls have been loaded and despite it having been recorded as shown in local storage
    const locale = browser.i18n.getUILanguage().replace("_", "-").toLowerCase();

    const { hostNavigationStats } = results;
    hostNavigationStats["totalWebNav"] = hostNavigationStats["totalWebNav"] || 0;
    hostNavigationStats['totalWebNav']++;

    const totalCount = hostNavigationStats['totalWebNav'];
    const tabId = info.tabId;
    const sawPopup = browser.storage.local.get("sawPopup");

    console.log('TotalURI: ' + totalCount);

    sawPopup.then(function(result) {
      if ((!result.sawPopup && totalCount <= 3) || testing) { // client has not seen popup
        // arbitrary condition for now
        if (totalCount > 2 || testing) {
          browser.storage.local.set({ "PA-tabId": tabId })
          browser.pageAction.show(tabId)
          browser.pageAction.setPopup({
            tabId,
            popup: "/popup/locales/" + locale + "/popup.html"
          });
          // wait 500ms second to make sure pageAction exists in chrome
          // so we can pageAction.show() from bootsrap.js
          setTimeout(triggerPopup, 500);
        }
      } else { //client has seen the popup
        browser.storage.local.get("PA-tabId").then(function(result2) {
          browser.pageAction.hide(result2["PA-tabId"])
        });
        browser.webNavigation.onCompleted.removeListener(webNavListener);
      }
    })
    // Persist the updated webNav stats.
    browser.storage.local.set(results);
  })
}


class TAARExperiment {

  /*
  logStorage() {
    browser.storage.local.get().then(console.log);
  }
  */

  async start() {
    this.info = await msgStudyUtils('info');
    let isFirstRun = !(await browser.storage.local.get('initialized'))['initialized'];
    if (isFirstRun) await TAARExperiment.firstRun();
    TAARExperiment.monitorNavigation();
  }

  static async firstRun() {
    await browser.storage.local.set({ sawPopup: false });
    browser.runtime.sendMessage({ "init": true });
  }

  static monitorNavigation() {
    console.log('monitorNavigation');
    browser.webNavigation.onCompleted.addListener(webNavListener,
      { url: [{ schemes: ["http", "https"] }] });
  }
}

let experiment = new TAARExperiment();
experiment.start();

