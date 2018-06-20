/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "getStudySetup" }]*/
/* global Preferences, TelemetryEnvironment */

/**
 *  Overview:
 *
 *  - constructs a well-formatted `studySetup` for use by `browser.study.setup`
 *  - mostly declarative, except that some fields are set at runtime
 *    asynchronously.
 *
 *  Advanced features:
 *  - testing overrides from preferences
 *  - expiration time
 *  - some user defined endings.
 *  - study defined 'shouldAllowEnroll' logic.
 */

/** Base for studySetup, as used by `browser.study.setup`.
 *
 * Will be augmented by 'getStudySetup'
 */
const baseStudySetup = {
  // used for activeExperiments tagging (telemetryEnvironment.setActiveExperiment)
  activeExperimentName: browser.runtime.id,

  // uses shield sampling and telemetry semantics.  Future: will support "pioneer"
  studyType: "shield",

  // telemetry
  telemetry: {
    // default false. Actually send pings.
    send: true,
    // Marks pings with testing=true.  Set flag to `true` before final release
    removeTestingFlag: true,
  },

  // endings with urls
  endings: {
    /** standard endings */
    "user-disable": {
      baseUrls: [],
    },
    ineligible: {
      baseUrls: [],
    },
    expired: {
      baseUrls: [],
    },
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

  // maximum time that the study should run, from the first run
  expire: {
    days: 21,
  },
};

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

// A place to put an 'isEligible' function
// Will run only during first install attempt
async function isEligible() {
  // Users with private browsing on autostart are not eligible
  if (await browser.privacyContext.permanentPrivateBrowsing()) {
    await browser.taarStudyMonitor.log(
      "Permanent private browsing, exiting study",
    );
    return false;
  }

  // Return true if locale is among those localized
  const locale = browser.i18n
    .getUILanguage()
    .replace("_", "-")
    .toLowerCase();
  await browser.taarStudyMonitor.log("locale", locale);
  return locales.has(locale);

  // Note: Since 1.0.13, we are leaving the profile age requirements fully up to Normandy targeting
}

/**
 * Determine, based on common and study-specific criteria, if enroll (first run)
 * should proceed.
 *
 * False values imply that *during first run only*, we should endStudy(`ineligible`)
 *
 * Add your own enrollment criteria as you see fit.
 *
 * (Guards against Normandy or other deployment mistakes or inadequacies).
 *
 * This implementation caches in local storage to speed up second run.
 *
 * @returns {Promise<boolean>} answer An boolean answer about whether the user should be
 *       allowed to enroll in the study
 */
async function cachingFirstRunShouldAllowEnroll() {
  // Cached answer.  Used on 2nd run
  let allowed = await browser.storage.local.get("allowEnroll");
  if (allowed) return true;

  /*
  First run, we must calculate the answer.
  If false, the study will endStudy with 'ineligible' during `setup`
  */

  // could have other reasons to be eligible, such add-ons, prefs
  allowed = await isEligible();

  // cache the answer
  await browser.storage.local.set({ allowEnroll: allowed });
  return allowed;
}

/**
 * Augment declarative studySetup with any necessary async values
 *
 * @return {object} studySetup A complete study setup object
 */
async function getStudySetup() {
  /*
   * const id = browser.runtime.id;
   * const prefs = {
   *   variationName: `shield.${id}.variationName`,
   *   };
   */

  // shallow copy
  const studySetup = Object.assign({}, baseStudySetup);

  studySetup.allowEnroll = await cachingFirstRunShouldAllowEnroll();
  studySetup.testing = {
    /* Example: override testing keys various ways, such as by prefs. (TODO) */
    variationName: null, // await browser.prefs.getStringPref(prefs.variationName);
    firstRunTimestamp: null,
    expired: null,
  };
  return studySetup;
}
