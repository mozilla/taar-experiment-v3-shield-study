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

### `browser.taarStudyMonitor.log( value1, value2, value3, value4, value5 )`

**Parameters**

* `value1`

  * type: value1
  * $ref:
  * optional: false

* `value2`

  * type: value2
  * $ref:
  * optional: true

* `value3`

  * type: value3
  * $ref:
  * optional: true

* `value4`

  * type: value4
  * $ref:
  * optional: true

* `value5`
  * type: value5
  * $ref:
  * optional: true

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
      "type": "object"
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
      "type": "object"
    },
    {
      "type": "string"
    }
  ],
  "testcases": [
    null,
    "a string",
    true,
    false,
    123,
    {
      "foo": "bar"
    }
  ]
}
```
