# Test plan for this add-on

<!-- START doctoc generated TOC please keep comment here to allow auto update -->

<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

* [Manual / QA TEST Instructions](#manual--qa-test-instructions)
  * [Preparations](#preparations)
  * [Install the add-on and enroll in the study](#install-the-add-on-and-enroll-in-the-study)
* [Expected User Experience / Functionality](#expected-user-experience--functionality)
  * [Example of how the popup appears when testing in Firefox](#example-of-how-the-popup-appears-when-testing-in-firefox)
  * [Do these tests](#do-these-tests)
  * [Design](#design)
  * [Note: checking "sent Telemetry is correct"](#note-checking-sent-telemetry-is-correct)
* [Debug](#debug)
* [Peculiarities](#peculiarities)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Manual / QA TEST Instructions

### Preparations

* Download a Release version of Firefox (Release is required for the recommendation heuristics to work)

### Install the add-on and enroll in the study

* Navigate to _about:config_ and set the following preferences. (If a preference does not exist, create it be right-clicking in the white area and selecting New -> String)
* Set `shieldStudy.logLevel` to `All`. This permits shield-add-on log output in browser console.
* Set `extensions.taarexpv3_shield_mozilla_org.test.variationName` to `intervention-a`, `intervention-b` or `control`.
* Go to <https://bugzilla.mozilla.org/show_bug.cgi?id=1469546> and install the latest add-on zip file

## Expected User Experience / Functionality

### Example of how the popup appears when testing in Firefox

![Example of how the popup appears when testing in Firefox](https://user-images.githubusercontent.com/793037/37150760-9cad116c-22db-11e8-822c-9959f70a8257.png)

### Do these tests

**Eligibility test 1 (ineligible locale)**

* Change your locale to one that is not specified in studySetup.js (for instance: Afrikaans `af`)
* Install the add-on as per above
* Verify that the study does not run

**Functionality test 1 (init => trigger-popup => clicked-close-button)**

* Install the add-on as per above
* Verify that the study starts
* Verify that no popup is shown immediately
* Verify that after exactly 3 successful web navigations that have completed in the currently active tab, the popup will display with the option to go to the disco-pane
* Verify that sent Telemetry is correct upon showing the popup and upon clicking the Cancel button
* Verify that no popup is shown on consecutive web navigations

**Functionality test 2 (init => trigger-popup => button-click => disco-pane-loaded)**

* Install the add-on as per above
* Verify that the study starts
* Verify that no popup is shown immediately
* Verify that after exactly 3 successful web navigations that have completed in the currently active tab, the popup will display with the option to go to the disco-pane
* Verify that sent Telemetry is correct upon showing the popup and upon clicking the Browse Add-ons button
* Verify that sent Telemetry is correct upon finished loading of the about:addons discovery pane
* Verify that no popup is shown on consecutive web navigations

**Functionality test 3 (init => disco-pane-loaded)**

* Install the add-on as per above
* Verify that the study starts
* Verify that no popup is shown immediately
* Navigate to `about:addons` and click on `Get Add-ons`
* Verify that sent Telemetry is correct upon finished loading of the about:addons discovery pane
* Verify that no popup is shown on consecutive web navigations

**Functionality test 4 (init => ?disco-pane-loaded => (addon-)install => (addon-)uninstall)**

* Install the add-on as per above
* Verify that the study starts
* Verify that no popup is shown immediately
* Install any add-on from anywhere
* Verify that sent Telemetry is correct upon installation of the add-on
* Uninstall any installed add-on
* Verify that sent Telemetry is correct upon uninstallation of the add-on

**End study clean up test 1**

* Install the add-on as per above
* Verify that the study starts
* Verify that the preference `extensions.webservice.discoverURL` has been annotated with query string parameters `?study=taarexpv3&branch={the-current-branch}`
* Uninstall the add-on
* Verify that sent exit Telemetry is correct
* Verify that the preference `extensions.webservice.discoverURL` no longer is annotated with query string parameters `?study=taarexpv3&branch={the-current-branch}`

### Design

Any UI in a Shield study should be consistent with standard Firefox design specifications. These standards can be found at [design.firefox.com](https://design.firefox.com/photon/welcome.html). Firefox logo specifications can be found [here](https://design.firefox.com/photon/visuals/product-identity-assets.html).

### Note: checking "sent Telemetry is correct"

* Open the Browser Console using Firefox's top menu at `Tools > Web Developer > Browser Console`. This will display Shield (loading/telemetry) log output from the add-on.

See [TELEMETRY.md](./TELEMETRY.md) for more details on what pings are sent by this add-on.

## Debug

To debug installation and loading of the add-on:

* Open the Browser Console using Firefox's top menu at `Tools > Web Developer > Browser Console`. This will display Shield (loading/telemetry) and log output from the add-on.

## Peculiarities

* If Discopane is loaded whilst offline and a page reload is made after getting online, the discopane loading event is not always triggered (the webnavigation listener receives no event)
* When querying for the current active tab in the current non-private-browsing window and a private browsing window is opened (but not in focus), the query result will only include the active tab in the opened private browsing window, despite that window not being active. This affects the behavior of this add-on to not track neither web navigations or about:addon active tab open seconds since those actions are restricted to work in the currently active tab and will not register anything when the result of the current active tab and the event's tab id are different.
* About:addon seconds are counting up even when the Firefox window is out of focus (it is still considered the active tab - no check on the active app in the system is done)
