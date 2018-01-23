# Test plan for this add-on

## Manual / QA TEST Instructions

### Preparations

* Download a Release version of Firefox (Release is required for the recommendation heuristics to work)

### Install the add-on and enroll in the study

* Navigate to *about:config* and set the following preferences. (If a preference does not exist, create it be right-clicking in the white area and selecting New -> String or Integer depending on the type of preference)
* Set `extensions.legacy.enabled` to `true`. This permits the loading of the embedded Web Extension since new versions of Firefox are becoming restricted to pure Web Extensions only.
* Set `shield.test.variation` to `ensemble-taar` or `linear-taar`.
* Set `extensions.taarexpv2.profile-age-in-days-test-override` to a value as mandated below. This permits the study run / not run depending on the eligibility requirement related to profile age. This preference must be of `integer` type and can be created by right-clicking in the white area and selecting New -> Integer.
* Go to [https://bugzilla.mozilla.org/show_bug.cgi?id=1428308](https://bugzilla.mozilla.org/show_bug.cgi?id=1428308) and install the latest signed XPI

### Do these tests

**Eligibility test 1 (too old profile)**

* Install the add-on as per above, with `extensions.taarexpv2.profile-age-in-days-test-override` set to `10` or higher
* Verify that the study does not run

**Eligibility test 2 (too young profile)**

* Install the add-on as per above, with `extensions.taarexpv2.profile-age-in-days-test-override` set to `1` or lower
* Verify that the study does not run

**Eligibility test 3 (ineligible locale)**

* Change your locale to one that is not specified in Config.jsm (for instance: Afrikaans `af`)
* Install the add-on as per above, with `extensions.taarexpv2.profile-age-in-days-test-override` set to `5` (or anything higher than 1 but lower than 10)
* Verify that the study does not run

**Functionality test 1 (init => trigger-popup => clicked-close-button)**

* Install the add-on as per above, with `extensions.taarexpv2.profile-age-in-days-test-override` set to `5` (or anything higher than 1 but lower than 10)
* Verify that the study starts
* Verify that no popup is shown immediately
* Verify that after exactly 3 successful web navigations that have completed in the currently active tab, the popup will display with the option to go to the disco-pane
* Verify that sent Telemetry is correct upon showing the popup and upon clicking the Cancel button
* Verify that no popup is shown on consecutive web navigations

**Functionality test 2 (init => trigger-popup => button-click => disco-pane-loaded)**

* Install the add-on as per above, with `extensions.taarexpv2.profile-age-in-days-test-override` set to `5` (or anything higher than 1 but lower than 10)
* Verify that the study starts
* Verify that no popup is shown immediately
* Verify that after exactly 3 successful web navigations that have completed in the currently active tab, the popup will display with the option to go to the disco-pane
* Verify that sent Telemetry is correct upon showing the popup and upon clicking the Browse Add-ons button
* Verify that sent Telemetry is correct upon finished loading of the about:addons discovery pane
* Verify that no popup is shown on consecutive web navigations

**Functionality test 3 (init => disco-pane-loaded)**

* Install the add-on as per above, with `extensions.taarexpv2.profile-age-in-days-test-override` set to `5` (or anything higher than 1 but lower than 10)
* Verify that the study starts
* Verify that no popup is shown immediately
* Navigate to `about:addons` and click on `Get Add-ons`
* Verify that sent Telemetry is correct upon finished loading of the about:addons discovery pane
* Verify that no popup is shown on consecutive web navigations

**Functionality test 4 (init => ?disco-pane-loaded => (addon-)install => (addon-)uninstall)**

* Install the add-on as per above, with `extensions.taarexpv2.profile-age-in-days-test-override` set to `5` (or anything higher than 1 but lower than 10)
* Verify that the study starts
* Verify that no popup is shown immediately
* Install any add-on from anywhere
* Verify that sent Telemetry is correct upon installation of the add-on
* Uninstall any installed add-on
* Verify that sent Telemetry is correct upon uninstallation of the add-on

### Bonus

If you happen to have a profile age between 1 and 10 lying around, verify that the study starts without any use of the override preference.

### Note: checking "sent Telemetry is correct"

* Open the Browser Console using Firefox's top menu at `Tools > Web Developer > Browser Console`. This will display Shield (loading/telemetry) log output from the add-on.

See [TELEMETRY.md](./TELEMETRY.md) for more details on what pings are sent by this add-on.

### Example of how the popup appears when testing in Firefox

![Example of how the popup appears when testing in Firefox](https://user-images.githubusercontent.com/793037/35304654-fa9b6116-009e-11e8-8057-7b2f7152b825.png)

## Debug

To debug installation and loading of the add-on:

* Navigate to *about:config* and set `shield.testing.logging.level` to `10`. This permits shield-add-on log output in browser console (If the preference does not exist, create it be right-clicking in the white area and selecting New -> Integer)
* Open the Browser Console using Firefox's top menu at `Tools > Web Developer > Browser Console`. This will display Shield (loading/telemetry) and log output from the add-on.
