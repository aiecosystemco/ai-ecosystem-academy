import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { skrillPersonName, skrillStatusLabel } from "./signup-rails.ts";

describe("skrillPersonName", () => {
  it("splits a full name within Skrill field limits", () => {
    const n = skrillPersonName("Daniel Christopher");
    assert.equal(n.firstname, "Daniel");
    assert.equal(n.lastname, "Christopher");
  });

  it("falls back when the name is empty", () => {
    const n = skrillPersonName("   ");
    assert.equal(n.firstname, "Student");
    assert.equal(n.lastname, "Academy");
  });
});

describe("skrillStatusLabel", () => {
  it("maps official IPN status codes", () => {
    assert.equal(skrillStatusLabel("2"), "processed");
    assert.equal(skrillStatusLabel("0"), "pending");
    assert.equal(skrillStatusLabel("-1"), "cancelled");
    assert.equal(skrillStatusLabel("-2"), "failed");
    assert.equal(skrillStatusLabel("-3"), "chargeback");
  });
});
