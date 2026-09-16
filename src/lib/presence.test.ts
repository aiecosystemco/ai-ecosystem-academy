import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isOnline, presenceLabel, seatKeyFor, ONLINE_MS } from "./presence.ts";

describe("isOnline", () => {
  it("is online within the window", () => {
    const now = Date.parse("2026-09-15T20:00:00.000Z");
    assert.equal(isOnline(new Date(now - 30_000).toISOString(), now), true);
    assert.equal(isOnline(new Date(now - ONLINE_MS - 1).toISOString(), now), false);
    assert.equal(isOnline(null, now), false);
  });
});

describe("presenceLabel", () => {
  it("splits in-class from idle online and offline", () => {
    assert.equal(presenceLabel({ online: true, classLive: true }), "In class");
    assert.equal(presenceLabel({ online: true, classLive: false }), "Online");
    assert.equal(presenceLabel({ online: false, classLive: true }), "Offline");
  });
});

describe("seatKeyFor", () => {
  it("prefers the unique code, else the account seat", () => {
    assert.equal(seatKeyFor("AEA-TEST-0001", "u1"), "AEA-TEST-0001");
    assert.equal(seatKeyFor("", "u1"), "acct:u1");
  });
});
