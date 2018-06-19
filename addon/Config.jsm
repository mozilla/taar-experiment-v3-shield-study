"use strict";

/* to use:

- Recall this file has chrome privileges
- Cu.import in this file will work for any 'general firefox things' (Services,etc)
  but NOT for addon-specific libs
*/
const { utils: Cu } = Components;
Cu.import("resource://gre/modules/TelemetryEnvironment.jsm");
Cu.import("resource://gre/modules/TelemetryController.jsm");
Cu.import("resource://gre/modules/Preferences.jsm");
Cu.import("resource://gre/modules/Console.jsm");
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(config|EXPORTED_SYMBOLS)" }]*/
const EXPORTED_SYMBOLS = ["config"];

// const slug = "taarexpv2"; // matches chrome.manifest;
const locales = new Set([
  "ar",
  "bg",
  "cs",
  "da",
  "de",
  "el",
  "en-gb",
  "en-us",
  "es-es",
  "es-la",
  "fi",
  "fr",
  "hu",
  "id",
  "it",
  "ja",
  "ms",
  "nl",
  "no",
  "pl",
  "pt",
  "pt-br",
  "ro",
  "ru",
  "sk",
  "sr",
  "sv",
  "tl",
  "tr",
  "uk",
  "vi",
  "zh-tw",
]);

const config = {
  // required STUDY key
  study: {
    /** Required for studyUtils.setup():
     *
     * - studyName
     * - endings:
     *   - map of endingName: configuration
     * - telemetry
     *   - boolean send
     *   - boolean removeTestingFlag
     *
     * All other keys are optional.
     */

    // required keys: studyName, endings, telemetry

    // will be used activeExperiments tagging
    studyName: "TAARExperimentV2",
    /** **endings**
     * - keys indicate the 'endStudy' even that opens these.
     * - urls should be static (data) or external, because they have to
     *   survive uninstall
     * - If there is no key for an endStudy reason, no url will open.
     * - usually surveys, orientations, explanations
     */
    endings: {
      /** standard endings */
      "no-endings": {
        url: "null",
      },
      /** User defined endings */
      "used-often": {
        baseUrl: "http://www.example.com/?reason=used-often",
        study_state: "ended-positive", // neutral is default
      },
      "a-non-url-opening-ending": {
        study_state: "ended-neutral",
        baseUrl: null,
      },
      "introduction-leave-study": {
        study_state: "ended-negative",
        baseUrl: "http://www.example.com/?reason=introduction-leave-study",
      },
    },
    telemetry: {
      send: true, // assumed false. Actually send pings?
      removeTestingFlag: true, // Marks pings as testing, set true for actual release
      // TODO "onInvalid": "throw"  // invalid packet for schema?  throw||log
    },
  },

  // required LOG key
  log: {
    // Fatal: 70, Error: 60, Warn: 50, Info: 40, Config: 30, Debug: 20, Trace: 10, All: -1,
    studyUtils: {
      level: "Trace",
    },
  },

  // OPTION KEYS

  // a place to put an 'isEligible' function
  // Will run only during first install attempt
  async isEligible() {
    // Users with private browsing on autostart are not eligible
    const privateBrowsingAutostart = Preferences.get(
      "browser.privatebrowsing.autostart",
    );
    if (privateBrowsingAutostart !== false) {
      console.log("Private browsing autostart, not enrolling in study");
      return false;
    }

    console.log("awaiting telemetry environment initialization");
    await TelemetryEnvironment.onInitialized();
    console.log("telemetry environment initialized");

    const locale = TelemetryEnvironment.currentEnvironment.settings.locale.toLowerCase();
    console.log("locale", locale);
    const eligibleLocale = locales.has(locale);

    /*
    return true if locale is among those localized
    */
    return eligibleLocale;

    // Note: Since 1.0.13, we are leaving the profile age requirements fully up to Normandy targeting
  },

  // Equal weighting for each of the 3 variations
  weightedVariations: [
    {
      name: "linear-taar",
      weight: 1,
    },
    {
      name: "ensemble-taar",
      weight: 1,
    },
    {
      name: "control",
      weight: 1,
    },
  ],

  // Optional: relative to bootstrap.js in the xpi
  studyUtilsPath: `./StudyUtils.jsm`,
};
