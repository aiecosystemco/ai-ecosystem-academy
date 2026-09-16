import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { generateAccessCode, hashPassword, maskCode, sha256 } from "./access-hash.ts";

describe("sha256", () => {
  it("matches NIST for abc", () => {
    assert.equal(sha256("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("matches node:crypto for the author key salt", () => {
    const raw = "aea-academy-v1O9onedum1$";
    assert.equal(sha256(raw), createHash("sha256").update(raw).digest("hex"));
    assert.equal(
      hashPassword("O9onedum1$"),
      "51bbc90f9fe394eb752c2a092b277b8bd8ba4138b0f32874103937abd2c2ac06",
    );
  });
});

describe("codes", () => {
  it("masks a unique code", () => {
    assert.equal(maskCode("AEA-WXYZ-G2RH").slice(0, 8), "AEA-****");
  });

  it("issues AEA-shaped codes", () => {
    assert.match(generateAccessCode(), /^AEA-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });
});
