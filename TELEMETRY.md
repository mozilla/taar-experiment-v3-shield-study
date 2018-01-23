# Telemetry sent by this add-on

## Usual Firefox Telemetry is unaffected.

- No change: `main` and other pings are UNAFFECTED by this add-on.
- Respects telemetry preferences.  If user has disabled telemetry, no telemetry will be sent.

##  Study-specific endings

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
**aboutAddonsActiveTabSeconds** - cumulative seconds during which about:addons has been the active tab, as per decision [here](https://github.com/motin/taar-experiment-v2-shield-study/issues/3#issuecomment-356238395)
**sawPopup** - "true" or "false" depending on if the popup has been triggered/shown during the study
**addon_id** - The add-on id in case of a install or uninstall ping type (otherwise "null")
**srcURI** - The add-on source URI in case of a install or uninstall ping type (otherwise "null")

## Example sequence for a 'init => trigger-popup => button-click => disco-pane-loaded => install => uninstall => disco-pane-loaded' interaction

These are the `payload` fields from all pings in the `shield-study` and `shield-study-addon` buckets.

```

// common fields

branch        ensemble-taar
study_name    TAARExperimentV2
addon_version 1.0.0
version       3


2018-01-17T17:52:31.625Z shield-study-addon
{
  "attributes": {
    "aboutAddonsActiveTabSeconds": "16",
    "addon_id": "null",
    "clickedButton": "true",
    "discoPaneLoaded": "true",
    "pingType": "disco-pane-loaded",
    "sawPopup": "true",
    "srcURI": "null",
    "startTime": "1516211518090"
  }
}
2018-01-17T17:52:20.568Z shield-study-addon
{
  "attributes": {
    "aboutAddonsActiveTabSeconds": "12",
    "addon_id": "support@lastpass.com",
    "clickedButton": "true",
    "discoPaneLoaded": "true",
    "pingType": "uninstall",
    "sawPopup": "true",
    "srcURI": "about:addons",
    "startTime": "1516211518090"
  }
}
2018-01-17T17:52:16.978Z shield-study-addon
{
  "attributes": {
    "aboutAddonsActiveTabSeconds": "9",
    "addon_id": "taarexpv2@shield-study.mozilla.com",
    "clickedButton": "true",
    "discoPaneLoaded": "true",
    "pingType": "install",
    "sawPopup": "true",
    "srcURI": "about:addons",
    "startTime": "1516211518090"
  }
}
2018-01-17T17:52:11.022Z shield-study-addon
{
  "attributes": {
    "aboutAddonsActiveTabSeconds": "3",
    "addon_id": "null",
    "clickedButton": "true",
    "discoPaneLoaded": "true",
    "pingType": "disco-pane-loaded",
    "sawPopup": "true",
    "srcURI": "null",
    "startTime": "1516211518090"
  }
}
2018-01-17T17:52:08.236Z shield-study-addon
{
  "attributes": {
    "aboutAddonsActiveTabSeconds": "0",
    "addon_id": "null",
    "clickedButton": "true",
    "discoPaneLoaded": "false",
    "pingType": "button-click",
    "sawPopup": "true",
    "srcURI": "null",
    "startTime": "1516211518090"
  }
}
2018-01-17T17:52:07.121Z shield-study-addon
{
  "attributes": {
    "aboutAddonsActiveTabSeconds": "0",
    "addon_id": "null",
    "clickedButton": "false",
    "discoPaneLoaded": "false",
    "pingType": "trigger-popup",
    "sawPopup": "true",
    "srcURI": "null",
    "startTime": "1516211518090"
  }
}
2018-01-17T17:51:58.094Z shield-study-addon
{
  "attributes": {
    "aboutAddonsActiveTabSeconds": "0",
    "addon_id": "null",
    "clickedButton": "false",
    "discoPaneLoaded": "false",
    "pingType": "init",
    "sawPopup": "false",
    "srcURI": "null",
    "startTime": "1516211518090"
  }
}
2018-01-17T17:51:57.985Z shield-study
{
  "study_state": "installed"
}
2018-01-17T17:51:56.174Z shield-study
{
  "study_state": "enter"
}
```
