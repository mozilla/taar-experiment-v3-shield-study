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

const PROFILE_AGE_TEST_OVERRIDE_PREF = "extensions.taarexpv2.profile-age-in-days-test-override";

// const slug = "taarexpv2"; // matches chrome.manifest;
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
    "es-es",
    "es-la",
    "fi",
    "fr",
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
    "tl",
    "tr",
    "uk",
    "vi",
    "zh-tw",
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
    /** **endings**
     * - keys indicate the 'endStudy' even that opens these.
     * - urls should be static (data) or external, because they have to
     *   survive uninstall
     * - If there is no key for an endStudy reason, no url will open.
     * - usually surveys, orientations, explanations
     */
    "endings": {
      /** standard endings */
      "no-endings": {
        "url": "null",
      },
      /** User defined endings */
      "used-often": {
        "baseUrl": "http://www.example.com/?reason=used-often",
        "study_state": "ended-positive",  // neutral is default
      },
      "a-non-url-opening-ending": {
        "study_state": "ended-neutral",
        "baseUrl": null,
      },
      "introduction-leave-study": {
        "study_state": "ended-negative",
        "baseUrl": "http://www.example.com/?reason=introduction-leave-study",
      },
    },
    "telemetry": {
      "send": true, // assumed false. Actually send pings?
      "removeTestingFlag": true,  // Marks pings as testing, set true for actual release
      // TODO "onInvalid": "throw"  // invalid packet for schema?  throw||log
    },
  },

  // required LOG key
  "log": {
    // Fatal: 70, Error: 60, Warn: 50, Info: 40, Config: 30, Debug: 20, Trace: 10, All: -1,
    "studyUtils": {
      "level": "Trace",
    },
  },

  // OPTION KEYS

  // a place to put an 'isEligible' function
  // Will run only during first install attempt
  "isEligible": async function() {

    // Ensure that profile age is available
    console.log("awaiting telemetry environment initialization");
    await TelemetryEnvironment.onInitialized();
    console.log("telemetry environment initialized");

    const locale = TelemetryEnvironment.currentEnvironment.settings.locale.toLowerCase();
    console.log("locale", locale);
    const eligibleLocale = locales.has(locale);

    // Represents 00:00 the date the profile was created
    const profileCreationDate = TelemetryEnvironment.currentEnvironment.profile.creationDate;
    console.log("profileCreationDate", profileCreationDate);
    // Current date fraction
    const currentDay = Math.round(Date.now() / 1000 / 60 / 60 / 24 * 100) / 100;
    // Profile age since 00:00 the date the profile was created
    let profileAgeInDays = currentDay - profileCreationDate;
    console.log("profileAgeInDays", profileAgeInDays);

    // Ability to override the profile age - necessary for testing purposes
    const profileAgeInDaysOverride = Preferences.get(PROFILE_AGE_TEST_OVERRIDE_PREF);
    console.log("profileAgeInDaysOverride", profileAgeInDaysOverride);
    if (typeof profileAgeInDaysOverride !== "undefined") {
      console.log("Using profileAgeInDaysOverride");
      profileAgeInDays = parseFloat(profileAgeInDaysOverride);
      console.log("profileAgeInDays", profileAgeInDays);
    }

    // Profile needs to have been created at least yesterday and at most ten days ago
    const eligibleProfileAge = profileAgeInDays > 1 && profileAgeInDays < 10;

    /*
    return true if 1 < profile_age_id_days < 10
    and locale is among those localized
    */
    return eligibleProfileAge && eligibleLocale;

  },

  // Equal weighting for each of the 3 variations
  "weightedVariations": [
    {
      "name": "linear-taar",
      "weight": 1,
    },
    {
      "name": "ensemble-taar",
      "weight": 1,
    },
    {
      "name": "control",
      "weight": 1,
    },
  ],

};
