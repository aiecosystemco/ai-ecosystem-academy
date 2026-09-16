import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { certificateSerial, growthScore, CHAPTER_COUNT, ROADMAP_COUNT } from "./growth.ts";

describe("growthScore", () => {
  it("starts at zero and climbs as tasks finish", () => {
    const empty = growthScore({ roadmapDone: 0, chapterDone: 0 });
    assert.equal(empty.percent, 0);
    assert.equal(empty.complete, false);
    assert.equal(empty.total, ROADMAP_COUNT + CHAPTER_COUNT);

    const mid = growthScore({ roadmapDone: 15, chapterDone: 11 });
    assert.equal(mid.done, 26);
    assert.equal(mid.percent, Math.round((26 / 52) * 100));
    assert.equal(mid.complete, false);

    const done = growthScore({ roadmapDone: 30, chapterDone: 22 });
    assert.equal(done.percent, 100);
    assert.equal(done.complete, true);
  });

  it("does not count past the totals", () => {
    const over = growthScore({ roadmapDone: 99, chapterDone: 99 });
    assert.equal(over.done, ROADMAP_COUNT + CHAPTER_COUNT);
    assert.equal(over.complete, true);
  });
});

describe("certificateSerial", () => {
  it("builds a stable academy serial", () => {
    const serial = certificateSerial("founder-author", new Date("2026-09-15T12:00:00Z"));
    assert.equal(serial, "AEA-20260915-AUTHOR");
  });
});
