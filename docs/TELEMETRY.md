# Telemetry sent by this add-on

<!-- START doctoc generated TOC please keep comment here to allow auto update -->

<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

* [Usual Firefox Telemetry is unaffected.](#usual-firefox-telemetry-is-unaffected)
* [Study-specific endings](#study-specific-endings)
* [`shield-study` pings (common to all shield-studies)](#shield-study-pings-common-to-all-shield-studies)
* [`shield-study-addon` pings, specific to THIS study.](#shield-study-addon-pings-specific-to-this-study)
* [Example sequence for a 'voted => not sure' interaction](#example-sequence-for-a-voted--not-sure-interaction)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usual Firefox Telemetry is unaffected.

* No change: `main` and other pings are UNAFFECTED by this add-on.
* Respects telemetry preferences. If user has disabled telemetry, no telemetry will be sent.

## Study-specific endings

This study has no surveys and as such has NO SPECIFIC ENDINGS.

## `shield-study` pings (common to all shield-studies)

[shield-studies-addon-utils](https://github.com/mozilla/shield-studies-addon-utils) sends the usual packets.

## `shield-study-addon` pings, specific to THIS study.

A ping is sent from the add-on upon:

* study initialization
* upon discovery pane load (every time, not only the first)
* upon popup display
* upon popup discovery pane button click
* every time the user installs/uninstalls/disables an add-on
* study shutdown

### Attributes

All pings adhere to the same schema, with the following study-specific attributes:

**pingType** - One of init, trigger-popup, button-click, disco-pane-loaded, install, uninstall
**startTime** - String(Date.now()) at the moment of study initialization
**clickedButton** - "true" or "false" depending on if the popup's "Browse Add-ons" button has been clicked during the study
**discoPaneLoaded** - "true" or "false" depending on if the disco pane has been loaded during the study
**aboutAddonsActiveTabSeconds** - cumulative seconds during which about:addons has been the active tab, as per decision [here](https://github.com/motin/taar-experiment-v3-shield-study/issues/3#issuecomment-356238395)
**sawPopup** - "true" or "false" depending on if the popup has been triggered/shown during the study
**addon_id** - The add-on id in case of a install or uninstall ping type (otherwise "null")
**srcURI** - The add-on source URI in case of a install or uninstall ping type (otherwise "null")

## Example sequence for a 'init => trigger-popup => button-click => disco-pane-loaded => install => uninstall => disco-pane-loaded' interaction

These are the `payload` fields from all pings in the `shield-study` and `shield-study-addon` buckets.

```
// common fields

branch        linear-taar
study_name    taarexpv3@shield.mozilla.org
addon_version 1.0.14
version       3

2018-06-20T16:08:49.151Z shield-study-addon
{
  "attributes": {
    "aboutAddonsActiveTabSeconds": "20",
    "addon_id": "null",
    "clickedButton": "true",
    "discoPaneLoaded": "true",
    "pingType": "disco-pane-loaded",
    "sawPopup": "true",
    "srcURI": "null",
    "startTime": "1529510893759"
  }
}

2018-06-20T16:08:44.153Z shield-study-addon
{
  "attributes": {
    "aboutAddonsActiveTabSeconds": "15",
    "addon_id": "treestyletab@piro.sakura.ne.jp",
    "clickedButton": "true",
    "discoPaneLoaded": "true",
    "pingType": "uninstall",
    "sawPopup": "true",
    "srcURI": "about:addons",
    "startTime": "1529510893759"
  }
}

2018-06-20T16:08:39.930Z shield-study-addon
{
  "attributes": {
    "aboutAddonsActiveTabSeconds": "12",
    "addon_id": "treestyletab@piro.sakura.ne.jp",
    "clickedButton": "true",
    "discoPaneLoaded": "true",
    "pingType": "install",
    "sawPopup": "true",
    "srcURI": "about:addons",
    "startTime": "1529510893759"
  }
}

2018-06-20T16:08:35.884Z shield-study-addon
{
  "attributes": {
    "aboutAddonsActiveTabSeconds": "8",
    "addon_id": "null",
    "clickedButton": "true",
    "discoPaneLoaded": "true",
    "pingType": "disco-pane-loaded",
    "sawPopup": "true",
    "srcURI": "null",
    "startTime": "1529510893759"
  }
}

2018-06-20T16:08:27.024Z shield-study-addon
{
  "attributes": {
    "aboutAddonsActiveTabSeconds": "0",
    "addon_id": "null",
    "clickedButton": "true",
    "discoPaneLoaded": "false",
    "pingType": "button-click",
    "sawPopup": "true",
    "srcURI": "null",
    "startTime": "1529510893759"
  }
}

2018-06-20T16:08:25.215Z shield-study-addon
{
  "attributes": {
    "aboutAddonsActiveTabSeconds": "0",
    "addon_id": "null",
    "clickedButton": "false",
    "discoPaneLoaded": "false",
    "pingType": "trigger-popup",
    "sawPopup": "true",
    "srcURI": "null",
    "startTime": "1529510893759"
  }
}

2018-06-20T16:08:13.871Z shield-study-addon
{
  "attributes": {
    "aboutAddonsActiveTabSeconds": "0",
    "addon_id": "null",
    "clickedButton": "false",
    "discoPaneLoaded": "false",
    "pingType": "init",
    "sawPopup": "false",
    "srcURI": "null",
    "startTime": "1529510893759"
  }
}

2018-06-20T16:08:13.671Z shield-study
{
  "study_state": "installed"
}

2018-06-20T16:08:13.659Z shield-study
{
  "study_state": "enter"
}
```
