import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { occupancyPlan, type SeatSnap } from "./seat-guard.ts";

function seat(id: string, kind: "phone" | "computer", lastSeenMs = 1): SeatSnap {
  return { deviceId: id, kind, timeZone: "Africa/Lagos", lastSeenMs };
}

describe("occupancyPlan", () => {
  it("lets the first phone in", () => {
    const plan = occupancyPlan([], seat("p1", "phone"));
    assert.equal(plan.allow, true);
    assert.deepEqual(plan.evict, []);
  });

  it("logs the first phone out when a second phone signs in", () => {
    const plan = occupancyPlan([seat("p1", "phone")], seat("p2", "phone"));
    assert.equal(plan.allow, true);
    assert.deepEqual(plan.evict, ["p1"]);
  });

  it("keeps only the newest phone when a third signs in", () => {
    const plan = occupancyPlan([seat("p2", "phone")], seat("p3", "phone"));
    assert.equal(plan.allow, true);
    assert.deepEqual(plan.evict, ["p2"]);
  });

  it("does not steal the seat back from an evicted phone", () => {
    const plan = occupancyPlan([seat("p3", "phone")], seat("p1", "phone"), true);
    assert.equal(plan.allow, false);
    assert.deepEqual(plan.evict, []);
  });

  it("lets a known phone heartbeat without evicting", () => {
    const plan = occupancyPlan([seat("p3", "phone"), seat("c1", "computer")], seat("p3", "phone"));
    assert.equal(plan.allow, true);
    assert.deepEqual(plan.evict, []);
  });

  it("keeps one computer beside the phone", () => {
    const plan = occupancyPlan([seat("p3", "phone")], seat("c1", "computer"));
    assert.equal(plan.allow, true);
    assert.deepEqual(plan.evict, []);
  });

  it("replaces an older computer, not the phone", () => {
    const plan = occupancyPlan(
      [seat("p3", "phone"), seat("c1", "computer")],
      seat("c2", "computer"),
    );
    assert.equal(plan.allow, true);
    assert.deepEqual(plan.evict, ["c1"]);
  });
});
