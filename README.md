# TAAR Experiment v2 - Shield Study

Tests the new [Telemetry-Aware Add-on Recommender](https://github.com/mozilla/taar) (TAAR).

For more information, see [the PHD](https://docs.google.com/document/d/1ZrfxNfBiEiAkqz4ZW9wmWfJF5sdfQg-Xq6_2mY1EXtI/edit)

(The add-on for the previous version of this experiment is found [here](https://github.com/benmiroglio/taar-experiment))

## Seeing the add-on in action

See [TESTPLAN.md](./TESTPLAN.md) for more details on how to get the add-on installed and tested.

## Analyzing data

Telemetry pings are loaded into S3 and re:dash. Sample query:

 * [All pings](https://sql.telemetry.mozilla.org/queries/50057/source#table)

See [TELEMETRY.md](./TELEMETRY.md) for more details on what pings are sent by this add-on.  

## Improving this add-on

See [DEV.md](./DEV.md) for more details on how to work with this add-on as a developer.  
