# Namespace: `browser.taarStudyMonitor`

Privileged code used to monitor the study

## Functions

### `browser.taarStudyMonitor.onFirstRunOnly( )`

**Parameters**

### `browser.taarStudyMonitor.enableTaarInDiscoPane( variationName )`

**Parameters**

* `variationName`
  * type: variationName
  * $ref:
  * optional: false

### `browser.taarStudyMonitor.monitorAddonChanges( )`

**Parameters**

### `browser.taarStudyMonitor.setAndPersistClientStatus( key, value )`

**Parameters**

* `key`

  * type: key
  * $ref:
  * optional: false

* `value`
  * type: value
  * $ref:
  * optional: false

### `browser.taarStudyMonitor.getClientStatus( )`

**Parameters**

### `browser.taarStudyMonitor.incrementAndPersistClientStatusAboutAddonsActiveTabSeconds( )`

**Parameters**

### `browser.taarStudyMonitor.reset( )`

**Parameters**

## Events

### `browser.taarStudyMonitor.onAddonChangeTelemetry ()` Event

Fires when addon-changes are ready to be reported via telemetry.

**Parameters**

* `dataOut`
  * type: dataOut
  * $ref:
  * optional: false

## Properties TBD

## Data Types

### [0] AnyOrdinaryValue

```json
{
  "id": "AnyOrdinaryValue",
  "$schema": "http://json-schema.org/draft-04/schema",
  "oneOf": [
    {
      "type": "null"
    },
    {
      "type": "boolean"
    },
    {
      "type": "integer"
    },
    {
      "type": "string"
    }
  ],
  "choices": [
    {
      "type": "null"
    },
    {
      "type": "boolean"
    },
    {
      "type": "integer"
    },
    {
      "type": "string"
    }
  ],
  "testcases": [null, "a string", true, false, 123]
}
```
