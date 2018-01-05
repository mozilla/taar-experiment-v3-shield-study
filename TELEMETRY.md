# Telemetry sent by this add-on

## Usual Firefox Telemetry is unaffected.

- No change: `main` and other pings are UNAFFECTED by this add-on.
- Respects telemetry preferences.  If user has disabled telemetry, no telemetry will be sent.

##  Study-specific endings

This study has no surveys and as such has NO SPECIFIC ENDINGS.

## `shield-study` pings (common to all shield-studies)

`shield-studies-addon-utils` sends the usual packets.

## `shield-study-addon` pings, specific to THIS study.

A ping is sent from the add-on upon:

* initialization
* upon discovery pane load
* upon popup display
* upon popup discovery pane button click
* every time the user installs/uninstalls/disables an add-on 

### Attributes

.... todo

## Example sequence for a 'init => trigger-popup => button-click => disco-pane-loaded => install' interaction

These are the `payload` fields from all pings in the `shield-study` and `shield-study-addon` buckets.

```

// common fields

branch        foo        // should describe Question text
study_name    TAARExperimentV2
addon_version 0.1.0
version       3

2017-10-09T14:16:18.042Z shield-study
{
  "study_state": "enter"
}
2017-10-09T14:16:18.055Z shield-study
{
  "study_state": "installed"
}
... todo
```


