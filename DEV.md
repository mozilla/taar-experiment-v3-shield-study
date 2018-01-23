# Developing this add-on

## Getting started

```bash
# install dependencies
npm install

## build
npm run eslint
npm run build

## build and run
npm run firefox
```

## Details

First, make sure you are on NPM 5+ installed so that the proper dependencies are installed using the package-lock.json file.

`$ npm install -g npm`

Clone the repo:

`$ git clone https://github.com/motin/taar-experiment-v2-shield-study.git -b develop`

After cloning the repo, you can run the following commands from the top level directory, one after another:

`$ npm install`
`$ npm run build`

This packages the add-on into `linked-addon.xpi` which is stored in `dist/`. This file is what you load into Firefox.

To do that, open your standard issue Firefox (with your ordinary profile) and load the `.xpi` using the following steps:

* Navigate to *about:config* and set `extensions.legacy.enabled` to `true`. This permits the loading of the embedded Web Extension since new versions of Firefox are becoming restricted to pure Web Extensions only.
* Navigate to *about:debugging* in your URL bar
* Select "Load Temporary Add-on"
* Find and select the `dist/linked-addon.xpi` file.

## General notes on Shield Study Engineering

Shield study add-ons are legacy (`addon/bootstrap.js`) add-ons with an optional embedded web extension (`addon/webextension/background.js`).

The web extension needs to be packaged together with a legacy add-on in order to be able to access Telemetry data, user preferences etc that are required for collecting relevant data for [Shield Studies](https://wiki.mozilla.org/Firefox/Shield/Shield_Studies).

It is recommended to build necessary logic and user interface using in the context of the webextension and communicate with the legacy add-on code through messaging whenever privileged access is required.

## Loading the Web Extension in Firefox

You can have Firefox automatically launched and the add-on installed by running:

`$ npm run firefox`

To load the extension manually instead, open (preferably) the [Developer Edition of Firefox](https://www.mozilla.org/firefox/developer/) and load the `.xpi` using the following steps:

* Navigate to *about:config* and set `extensions.legacy.enabled` to `true`. This permits the loading of the embedded Web Extension since new versions of Firefox are becoming restricted to pure Web Extensions only.
* Navigate to *about:debugging* in your URL bar
* Select "Load Temporary Add-on"
* Find and select the `linked-addon.xpi` file you just built.

## Seeing the add-on in action

To debug installation and loading of the add-on:

* Navigate to *about:config* and set `shield.testing.logging.level` to `10`. This permits shield-add-on log output in browser console
* Open the Browser Console using Firefox's top menu at `Tools > Web Developer > Browser Console`. This will display Shield (loading/telemetry) and log output from the add-on.

See [TESTPLAN.md](./TESTPLAN.md) for more details on how to see this add-on in action and hot it is expected to behave.

## Automation and tests

`$ npm run firefox` starts Firefox and automatically installs the add-on in a new profile and opens the browser console automatically.

Note: This runs in a recently created profile. To have the study run despite the eligibility requirement of having at least 1 day old profiles, a config override is set in place to force the study to run.

`$ node test/unit_tests.js` runs some study-specific unit tests.

## Watch

You can automatically build recent changes and package them into a `.xpi` by running the following from the top level directory:

`$ npm run watch`

Now, anytime a file is changed and saved, node will repackage the add-on. You must reload the add-on as before, or by clicking the "Reload" under the add-on in *about:debugging*. Note that a hard re-load is recommended to clear local storage. To do this, simply remove the add-on and reload as before.

Note: This is currently only useful if you load the extension manually - it has no effect when running `npm run firefox`.

## Directory Structure and Files

```
├── .circleci             # setup for .circle ci integration
│   └── config.yml
├── .eslintignore
├── .eslintrc.js          # mozilla, json
├── .gitignore
├── LICENSE
├── README.md             # (this file)
├── TELEMETRY.md          # Telemetry examples for this addon
├── TESTPLAN.md           # Manual QA test plan
├── addon                 # Files that will go into the addon
│   ├── Config.jsm        # Study-specific configuration regarding branches, eligibility etc
│   ├── LICENSE
│   ├── StudyUtils.jsm    # (copied in during `prebuild`)
│   ├── bootstrap.js      # LEGACY Bootstrap.js
│   ├── chrome.manifest   # (derived from templates)
│   ├── icon.png
│   ├── install.rdf       # (derived from templates)
│   ├── lib               # JSM (Firefox modules)
│   │   └── Feature.jsm   # contains study-specific privileged code
│   └── webextension      # study-specific embedded webextension
│       ├── .eslintrc.json
│       ├── README.md
│       ├── background.js
│       ├── manifest.json
│       └── popup
│           ├── img
│           │   └── firefoxicon.png
│           ├── locales
│           │   ├── ar
│           │   │   ├── popup.html
│           │   │   └── raw.txt
│           │   ├── ... # etc locales
│           ├── popup.css
│           └── popup.js
├── analysis              # will contain the notebook used for the study's analysis (currently contains the notebook from the taar v1 experiment)
│   └── TAARExperimentETL.ipynb
├── bin                   # Scripts / commands
│   └── xpi.sh            # build the XPI
├── dist                  # built xpis (addons)
│   ├── .gitignore
│   ├── linked-addon.xpi -> taarexpv2@shield-study.mozilla.com-0.1.0.xpi
│   └── taarexpv2@shield-study.mozilla.com-0.1.0.xpi
├── fetch_translations.py # python script used in v1 to fetch translations used to generate the popup html
├── generate_html.py      # python script used in v1 generate the popup html
├── package-lock.json
├── package.json
├── run-firefox.js        # used by `npm run firefox`
├── schemas
│   └── schema.json
├── templates             # mustache templates, filled from `package.json`
│   ├── chrome.manifest.mustache
│   └── install.rdf.mustache
└── test                  # Automated tests `npm test` and circle
    ├── Dockerfile
    ├── docker_setup.sh
    ├── functional_tests.js
    ├── test_harness.js
    ├── test_printer.py
    └── utils.js

>> tree -a -I 'node_modules|.git|.DS_Store|screenshot.png|pings.json'

```

This structure is set forth in [shield-studies-addon-template](https://github.com/mozilla/shield-studies-addon-template), with study-specific changes found mostly in `addon/lib`, `addon/webextension` and `addon/Config.jsm`.

### Description of what goes on when this add-on is started

During `bootstrap.js:startup(data, reason)`:

    a. `shieldUtils` imports and sets configuration from `Config.jsm`
    b. `bootstrap.js:chooseVariation` explicitly and deterministically chooses a variation from `studyConfig.weightedVariations`
    c.  the WebExtension starts up
    d.  `bootstrap.js` listens for messages from the `webExtension` that are study related
    e.  `webExtension` (`background.js`) asks for `info` from `studyUtils` using `askShield` function
    f.  The study-specific logic starts using the `variation` from that info, including adapting the about:addons discovery pane source url and starting web navigation listeners to be able to track relevant user interactions

Tip: For more insight on what is study-specific, compare the source code of previously deployed shield studies with this template (and each other) to get an idea of what is actually relevant to change between studies vs what is mostly untouched boilerplate.
