"use strict";

/* global  __SCRIPT_URI_SPEC__  */
/* global Feature, Services */ // Cu.import
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(startup|shutdown|install|uninstall)" }]*/

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Console.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const CONFIGPATH = `${__SCRIPT_URI_SPEC__}/../Config.jsm`;
const { config } = Cu.import(CONFIGPATH, {});

const STUDYUTILSPATH = `${__SCRIPT_URI_SPEC__}/../${config.studyUtilsPath}`;
const { studyUtils } = Cu.import(STUDYUTILSPATH, {});
const studyConfig = config.study;
Cu.import("resource://gre/modules/Preferences.jsm");
Cu.import("resource://gre/modules/ClientID.jsm");
Cu.import("resource://gre/modules/TelemetryEnvironment.jsm");
Cu.import("resource://gre/modules/TelemetryController.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");
Cu.import('resource://gre/modules/Services.jsm');

console.log({ "CONFIG": config, "isEligible": config.isEligible() })

const REASONS = studyUtils.REASONS;

// QA NOTE: Study Specific Modules - package.json:addon.chromeResouce
const BASE = `template-shield-study-button-study`;
//XPCOMUtils.defineLazyModuleGetter(this, "Feature", `resource://${BASE}/lib/Feature.jsm`);


// var log = createLog(studyConfig.study.studyName, config.log.bootstrap.level);  // defined below.
// log("LOG started!");

/* Example addon-specific module imports.  Remember to Unload during shutdown() below.

  // https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Using

   Ideally, put ALL your feature code in a Feature.jsm file,
   NOT in this bootstrap.js.

  const SOMEEXPORTEDSYMBOLPATH = `${__SCRIPT_URI_SPEC__}/../lib/SomeExportedSymbol.jsm`;
  const { someExportedSymbol } = Cu.import(SOMEEXPORTEDSYMBOLPATH, {});

  XPCOMUtils.defineLazyModuleGetter(this, "Preferences",
    "resource://gre/modules/Preferences.jsm");
*/


class clientStatus {
  constructor() {
    this.clickedButton = null;
    this.sawPop = false;
    this.activeAddons = new Set()
    this.addonHistory  = new Set()
    this.lastInstalled = null
    this.lastDisabled = null
    this.startTime = null
  }

  updateAddons() {
    let prev = this.activeAddons
    let curr = getNonSystemAddons()

    console.log({'prev':prev, 'curr':curr})

    let currDiff = curr.difference(prev)
    if (currDiff.size > 0) { // an add-on was installed or re-enabled
      var newInstalls = curr.difference(this.addonHistory)
      if (newInstalls.size > 0) { // new install, not a re-enable
        this.lastInstalled = newInstalls.values().next().value
      }
    } else { //an add-on was disabled or uninstalled
      this.lastDisabled =  prev.difference(curr).values().next().value
    }
    this.activeAddons = curr
  }
}

function getNonSystemAddons() {
  var activeAddons = TelemetryEnvironment.currentEnvironment.addons.activeAddons
  var result = new Set()
  for (var addon in activeAddons) {
    let data = activeAddons[addon]
    if (!data.isSystem && !data.foreignInstall) {
      result.add(addon)
    }
  }
  return(result)
}

function getNonSystemAddonData() {
  var activeAddons = TelemetryEnvironment.currentEnvironment.addons.activeAddons
  for (var addon in activeAddons) {
    let data = activeAddons[addon]
    if (!data.isSystem && !data.foreignInstall) {
      console.log(data)
    }
  }
}

function bucketURI(uri) {
  if (uri != "about:addons") {
        if (uri.indexOf("addons.mozilla.org") > 0) {
        uri = "AMO"
      } else {
        uri = "other"
      }
    }
  return uri
}

function addonChangeListener(change, client) {
  if (change == "addons-changed") {
    console.log("\n\n SOMETHING CHANGED WITH ADDONS... \n\n\n -----------------")
    client.updateAddons()
    var uri = bucketURI(Services.wm.getMostRecentWindow('navigator:browser').gBrowser.currentURI.asciiSpec);

    if (client.lastInstalled) {
      //send telemetry
      var dataOut = {
           "clickedButton": String(client.clickedButton),
           "sawPopup": String(client.sawPopup),
           "startTime": String(client.startTime),
           "addon_id": String(client.lastInstalled),
           "srcURI": String(uri),
           "pingType": "install"
        }
      console.log("Just installed", client.lastInstalled, "from", uri)
      console.log(dataOut)
      studyUtils.telemetry(dataOut)

      /////
      client.lastInstalled = null;
    }
    else if (client.lastDisabled) {
      console.log("Just disabled", client.lastDisabled, "from", uri)

      //send telemetry
      var dataOut = {
           "clickedButton": String(client.clickedButton),
           "sawPopup": String(client.sawPopup),
           "startTime": String(client.startTime),
           "addon_id": String(client.lastDisabled),
           "srcURI": String(uri),
           "pingType": "uninstall"
        }
      studyUtils.telemetry(dataOut)
      console.log(dataOut)

      //////
      client.lastDisabled = null

    }


  }
}

function closePageAction() {
  var window = Services.wm.getMostRecentWindow('navigator:browser')
  var pageAction = window.document.getElementById("taarexp_mozilla_com-page-action")
  pageAction.parentNode.removeChild(pageAction);
}

async function startup(addonData, reason) {
  // `addonData`: Array [ "id", "version", "installPath", "resourceURI", "instanceID", "webExtension" ]  bootstrap.js:48
  console.log("startup", REASONS[reason] || reason);

  var client = new clientStatus();

  /* Configuration of Study Utils*/
  studyUtils.setup({
    ...config,
    addon: { id: addonData.id, version: addonData.version },
  });
  // choose the variation for this particular user, then set it.
  const variation = (studyConfig.forceVariation ||
    await studyUtils.deterministicVariation(
      studyConfig.weightedVariations
    )
  );
  studyUtils.setVariation(variation);
  console.log(`studyUtils has config and variation.name: ${variation.name}.  Ready to send telemetry`);


  /** addon_install ONLY:
    * - note first seen,
    * - check eligible
    */
  if ((REASONS[reason]) === "ADDON_INSTALL") {
    //  telemetry "enter" ONCE
    studyUtils.firstSeen();
    const eligible = await config.isEligible(); // addon-specific
    if (!eligible) {
      // 1. uses config.endings.ineligible.url if any,
      // 2. sends UT for "ineligible"
      // 3. then uninstalls addon
      await studyUtils.endStudy({reason: "ineligible"});
      return;
    }
  }

  // startup for eligible users.
  // 1. sends `install` ping IFF ADDON_INSTALL.
  // 2. sets activeExperiments in telemetry environment.
  await studyUtils.startup({reason});

  // if you have code to handle expiration / long-timers, it could go here
  (function fakeTrackExpiration() {})();

  // log what the study variation and other info is.
  console.log(`info ${JSON.stringify(studyUtils.info())}`);


  const clientId = await ClientID.getClientID()

  //default
  var aboutAddonsDomain = "https://discovery.addons.mozilla.org/%LOCALE%/firefox/discovery/pane/%VERSION%/%OS%/%COMPATIBILITY_MODE%"
  if (variation.name == "taar-disco-popup" || variation.name == "taar-disco") {
    aboutAddonsDomain += "?clientId=" + clientId
    Preferences.set("extensions.webservice.discoverURL", aboutAddonsDomain)
  }

  // IFF your study has an embedded webExtension, start it.
  const { webExtension } = addonData;
  if (webExtension) {
    webExtension.startup().then(api => {
    client.activeAddons = getNonSystemAddons()
    client.addonHistory = getNonSystemAddons()
    TelemetryEnvironment.registerChangeListener("addonListener", function(x) {
      addonChangeListener(x, client)
      console.log(client)
    });

      const {browser} = api;
      /** spec for messages intended for Shield =>
        * {shield:true,msg=[info|endStudy|telemetry],data=data}
        */
      browser.runtime.onMessage.addListener(studyUtils.respondToWebExtensionMessage);
      // other browser.runtime.onMessage handlers for your addon, if any
      browser.runtime.onMessage.addListener((msg, sender, sendReply) => {
        console.log('msg, sender, sendReply', msg, sender, sendReply);
        // message handers //////////////////////////////////////////
        if (msg["init"]) {
          console.log("init received")
          client.startTime = Date.now();
          var dataOut = {
             "clickedButton": String(client.clickedButton),
             "sawPopup": String(client.sawPopup),
             "startTime": String(client.startTime),
             "addon_id": String(client.lastInstalled),
             "srcURI": "null",
             "pingType": "init"
          }
        studyUtils.telemetry(dataOut)
        console.log(dataOut)
          sendReply(dataOut);
        }
        else if (msg['trigger-popup']) {
          var window = Services.wm.getMostRecentWindow('navigator:browser')
          var pageAction = window.document.getElementById("taarexp_mozilla_com-page-action")
          pageAction.click()
          sendReply(null);


        }
        else if (msg['clicked-disco-button']) {
            var window = Services.wm.getMostRecentWindow('navigator:browser')
            window.gBrowser.selectedTab = window.gBrowser.addTab("about:addons", {relatedToCurrent:true});
            client.clickedButton = true;
            closePageAction();
            sendReply(null);
        }
        else if (msg['clicked-close-button']) {
            client.clickedButton = false
            closePageAction();
            sendReply(null);
        }
      });
    });
  }

  // log what the study variation and other info is.
  console.log(`info ${JSON.stringify(studyUtils.info())}`);

  // Actually Start up your feature
  //new Feature({variation, studyUtils, reasonName: REASONS[reason]});
}

/** Shutdown needs to distinguish between USER-DISABLE and other
  * times that `endStudy` is called.
  *
  * studyUtils._isEnding means this is a '2nd shutdown'.
  */
function shutdown(addonData, reason) {
  console.log("shutdown", REASONS[reason] || reason);
  // FRAGILE: handle uninstalls initiated by USER or by addon
  if (reason === REASONS.ADDON_UNINSTALL || reason === REASONS.ADDON_DISABLE) {
    console.log("uninstall or disable");
    if (!studyUtils._isEnding) {
      // we are the first 'uninstall' requestor => must be user action.
      console.log("probably: user requested shutdown");
      studyUtils.endStudy({reason: "user-disable"});
      return;
    }
    // normal shutdown, or 2nd uninstall request

    // QA NOTE:  unload addon specific modules here.
    //Cu.unload();


    // clean up our modules.
    Cu.unload(CONFIGPATH);
    Cu.unload(STUDYUTILSPATH);
    // Cu.unload(SOMEEXPORTEDSYMBOLPATH);

  }
}

function uninstall(addonData, reason) {
  console.log("uninstall", REASONS[reason] || reason);
}

function install(addonData, reason) {
  console.log("install", REASONS[reason] || reason);
  // handle ADDON_UPGRADE (if needful) here
}


// helper to let Dev or QA set the variation name
function getVariationFromPref(weightedVariations) {
  const key = "shield.test.variation";
  const name = Services.prefs.getCharPref(key, "");
  if (name !== "") {
    const variation = weightedVariations.filter(x => x.name === name)[0];
    if (!variation) {
      throw new Error(`about:config => shield.test.variation set to ${name}, but not variation with that name exists`);
    }
    return variation;
  }
  return name; // undefined
}

Set.prototype.difference = function(setB) {
    var difference = new Set(this);
    for (var elem of setB) {
        difference.delete(elem);
    }
    return difference;
}

Set.prototype.union = function(setB) {
    var union = new Set(this);
    for (var elem of setB) {
        union.add(elem);
    }
    return union;
}

// logging, unfinished
// function createLog(name, levelWord) {
//  Cu.import("resource://gre/modules/Log.jsm");
//  var L = Log.repository.getLogger(name);
//  L.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));
//  L.level = Log.Level[levelWord] || Log.Level.Debug; // should be a config / pref
//  return L;
// }

