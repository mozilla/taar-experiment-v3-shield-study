/* eslint-env node, mocha, chai */
/* global browser, sinon, assert, Helpers */

"use strict";

describe("helpers.js", function() {
  describe("Helpers.addedItemsDifference:", function() {
    it("test 1", function() {
      const fixtures = {
        previousNonSystemAddons: new Set(["taarexpv2@shield.mozilla.org"]),
        currentNonSystemAddons: new Set([
          "taarexpv2@shield.mozilla.org",
          "uBlock0@raymondhill.net",
        ]),
      };

      const expected = new Set(["uBlock0@raymondhill.net"]);

      const actual = Helpers.addedItemsDifference(
        fixtures.previousNonSystemAddons,
        fixtures.currentNonSystemAddons,
      );

      assert.deepStrictEqual(expected, actual);
    });
    it("test 2", function() {
      const fixtures = {
        previousNonSystemAddons: new Set([
          "taarexpv2@shield.mozilla.org",
          "uBlock0@raymondhill.net",
        ]),
        currentNonSystemAddons: new Set([
          "taarexpv2@shield.mozilla.org",
          "uBlock0@raymondhill.net",
          "support@lastpass.com",
        ]),
      };

      const expected = new Set(["support@lastpass.com"]);

      const actual = Helpers.addedItemsDifference(
        fixtures.previousNonSystemAddons,
        fixtures.currentNonSystemAddons,
      );

      assert.deepStrictEqual(expected, actual);
    });
    describe("Helpers.analyzeAddonChanges:", function() {
      it("test 1", function() {
        const fixtures = {
          previousNonSystemAddons: new Set(["taarexpv2@shield.mozilla.org"]),
          currentNonSystemAddons: new Set([
            "taarexpv2@shield.mozilla.org",
            "uBlock0@raymondhill.net",
          ]),
        };

        const expected = {
          lastInstalled: "uBlock0@raymondhill.net",
        };

        const actual = Helpers.analyzeAddonChanges(
          fixtures.previousNonSystemAddons,
          fixtures.currentNonSystemAddons,
        );

        assert.deepStrictEqual(expected, actual);
      });
      it("test 2", function() {
        const fixtures = {
          previousNonSystemAddons: new Set([
            "taarexpv2@shield.mozilla.org",
            "uBlock0@raymondhill.net",
          ]),
          currentNonSystemAddons: new Set([
            "taarexpv2@shield.mozilla.org",
            "uBlock0@raymondhill.net",
            "support@lastpass.com",
          ]),
        };

        const expected = {
          lastInstalled: "support@lastpass.com",
        };

        const actual = Helpers.analyzeAddonChanges(
          fixtures.previousNonSystemAddons,
          fixtures.currentNonSystemAddons,
        );

        assert.deepStrictEqual(expected, actual);
      });
      it("test 3", function() {
        const fixtures = {
          previousNonSystemAddons: new Set([
            "taarexpv2@shield.mozilla.org",
            "uBlock0@raymondhill.net",
            "support@lastpass.com",
          ]),
          currentNonSystemAddons: new Set([
            "taarexpv2@shield.mozilla.org",
            "support@lastpass.com",
          ]),
        };

        const expected = {
          lastDisabledOrUninstalled: "uBlock0@raymondhill.net",
        };

        const actual = Helpers.analyzeAddonChanges(
          fixtures.previousNonSystemAddons,
          fixtures.currentNonSystemAddons,
        );

        assert.deepStrictEqual(expected, actual);
      });
      it("test 4", function() {
        const fixtures = {
          previousNonSystemAddons: new Set([
            "taarexpv2@shield.mozilla.org",
            "uBlock0@raymondhill.net",
            "support@lastpass.com",
          ]),
          currentNonSystemAddons: new Set([
            "taarexpv2@shield.mozilla.org",
            "support@lastpass.com",
            "new@foo.com",
          ]),
        };

        const expected = {
          lastInstalled: "new@foo.com",
          lastDisabledOrUninstalled: "uBlock0@raymondhill.net",
        };

        const actual = Helpers.analyzeAddonChanges(
          fixtures.previousNonSystemAddons,
          fixtures.currentNonSystemAddons,
        );
        assert.deepStrictEqual(expected, actual);
      });
    });
    describe("Helpers.bucketURI:", function() {
      it("test 1", function() {
        const fixture = "about:addons";

        const expected = "about:addons";

        const actual = Helpers.bucketURI(fixture);

        assert.strictEqual(expected, actual);
      });
      it("test 2", function() {
        const fixture =
          "https://addons.mozilla.org/en-US/firefox/addon/clippings/?src=collection";

        const expected = "AMO";

        const actual = Helpers.bucketURI(fixture);

        assert.strictEqual(expected, actual);
      });
      it("test 3", function() {
        const fixture = "https://bugzilla.mozilla.org/show_bug.cgi?id=1450951";

        const expected = "other";

        const actual = Helpers.bucketURI(fixture);

        assert.strictEqual(expected, actual);
      });
      it("test 4", function() {
        const fixture = "foobar";

        const expected = "other";

        const actual = Helpers.bucketURI(fixture);

        assert.strictEqual(expected, actual);
      });
      it("test 5", function() {
        const fixture =
          "https://example.com/false-positive-amo/addons.mozilla.org/";

        const expected = "AMO";

        const actual = Helpers.bucketURI(fixture);

        assert.strictEqual(expected, actual);
      });
      it("test 6", function() {
        const fixture = "about:addons#foo";

        const expected = "about:addons";

        const actual = Helpers.bucketURI(fixture);

        assert.strictEqual(expected, actual);
      });
    });
  });
});
