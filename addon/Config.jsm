"use strict";

/* to use:

- Recall this file has chrome privileges
- Cu.import in this file will work for any 'general firefox things' (Services,etc)
  but NOT for addon-specific libs
*/
const {utils: Cu} = Components;
Cu.import("resource://gre/modules/TelemetryEnvironment.jsm");
Cu.import("resource://gre/modules/Console.jsm")
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(config|EXPORTED_SYMBOLS)" }]*/
const EXPORTED_SYMBOLS = ["config"];
const slug = "taarexpv2"; // matches chrome.manifest;
const locales = new Set(
  [
    "ar",
    "bg",
    "cs",
    "da",
    "de",
    "el",
    "en-gb",
    "en-us",
    "es-ar",
    "es-es",
    "es-la",
    "fi",
    "fr",
    "fr-ca",
    "he",
    "hu",
    "id",
    "it",
    "ja",
    "ko",
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
    "th",
    "tl",
    "tr",
    "uk",
    "vi",
    "zh-tw"
  ]);

var config = {
  // required STUDY key
  "study": {
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
    "studyName": "TAARExperimentV2",
    "forceVariation": {
      "name": "vanilla-disco-popup",
    }, // optional, use to override/decide
    /** **endings**
      * - keys indicate the 'endStudy' even that opens these.
      * - urls should be static (data) or external, because they have to
      *   survive uninstall
      * - If there is no key for an endStudy reason, no url will open.
      * - usually surveys, orientations, explanations
      */
    "endings": {
      /** standard endings */
      "user-disable": {
        "baseUrl": "http://www.example.com/?reason=user-disable",
      },
      "ineligible": {
        "baseUrl": "http://www.example.com/?reason=ineligible",
      },
      "expired": {
        "baseUrl": "http://www.example.com/?reason=expired",
      },
      /** User defined endings */
      "used-often": {
        "baseUrl": "http://www.example.com/?reason=used-often",
        "study_state": "ended-positive",  // neutral is default
      },
      "a-non-url-opening-ending": {
        "study_state": "ended-neutral",
        "baseUrl":  null,
      },
      "introduction-leave-study": {
        "study_state": "ended-negative",
        "baseUrl": "http://www.example.com/?reason=introduction-leave-study",
      },
    },
    "telemetry": {
      "send": true, // assumed false. Actually send pings?
      "removeTestingFlag": false,  // Marks pings as testing, set true for actual release
      // TODO "onInvalid": "throw"  // invalid packet for schema?  throw||log
    },
  },

  // required LOG key
  "log": {
    // Fatal: 70, Error: 60, Warn: 50, Info: 40, Config: 30, Debug: 20, Trace: 10, All: -1,
    "bootstrap":  {
      "level": "Debug",
    },
    "studyUtils":  {
      "level": "Trace",
    },
  },

  // OPTION KEYS

  // a place to put an 'isEligible' function
  // Will run only during first install attempt
  "isEligible": async function() {
    /*
    return true if profile is at most one week old
    */

    // const locale = TelemetryEnvironment.currentEnvironment.settings.locale;
    const locale = "notelig"
    const proflileCreationDate = TelemetryEnvironment.currentEnvironment.profile.creationDate;
    // MS -> Days
    const currentDay = Math.round(Date.now() / 60 / 60 / 24 / 1000)
    return (currentDay - proflileCreationDate) <= 7 && locales.has(locale)
  },

  // Equal weighting for each  of the 4 variations
  "weightedVariations": [
    {"name": "vanilla-disco-popup",
      "weight": 1},
    {"name": "taar-disco-popup",
      "weight": 1},
    {"name": "vanilla-disco",
      "weight": 1},
    {"name": "taar-disco",
      "weight": 1}
  ],

  // Optional: relative to bootstrap.js in the xpi
  "studyUtilsPath": `./StudyUtils.jsm`,
};
