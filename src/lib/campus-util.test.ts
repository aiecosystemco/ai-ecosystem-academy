import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseWhatsAppLink, parseXPostUrl, slugifyName, whatsappSendHref } from "./campus-util.ts";

describe("slugifyName", () => {
  it("turns a student name into a referrer code", () => {
    assert.equal(slugifyName("Daniel Christopher"), "daniel-christopher");
    assert.equal(slugifyName("  Ada  Lovelace  "), "ada-lovelace");
  });

  it("falls back when the name has no letters", () => {
    assert.equal(slugifyName("***"), "student");
  });
});

describe("parseXPostUrl", () => {
  it("accepts x.com and twitter.com status URLs", () => {
    const a = parseXPostUrl("https://x.com/Brownigweco/status/1234567890");
    assert.equal(a?.handle, "Brownigweco");
    assert.equal(a?.statusId, "1234567890");
    const b = parseXPostUrl("https://twitter.com/Brownigweco/status/1234567890?s=20");
    assert.equal(b?.url, "https://x.com/Brownigweco/status/1234567890");
  });

  it("rejects non-status and non-X links", () => {
    assert.equal(parseXPostUrl("https://x.com/Brownigweco"), null);
    assert.equal(parseXPostUrl("https://example.com/status/1"), null);
  });
});

describe("parseWhatsAppLink", () => {
  it("reads a community group invite", () => {
    const g = parseWhatsAppLink("https://chat.whatsapp.com/AbCdef123");
    assert.equal(g?.kind, "group");
    assert.equal(g?.url, "https://chat.whatsapp.com/AbCdef123");
  });

  it("reads the academy community invite", () => {
    const g = parseWhatsAppLink("https://chat.whatsapp.com/CI1z5P8BAWOL2oKsMRueUF");
    assert.equal(g?.kind, "group");
    assert.equal(g?.url, "https://chat.whatsapp.com/CI1z5P8BAWOL2oKsMRueUF");
  });

  it("reads a click-to-chat number", () => {
    const c = parseWhatsAppLink("https://wa.me/2348012345678");
    assert.equal(c?.kind, "chat");
    assert.equal(c?.phone, "2348012345678");
    assert.equal(
      whatsappSendHref(c!, "Hello class"),
      "https://wa.me/2348012345678?text=Hello%20class",
    );
  });

  it("activates other https links the author adds", () => {
    const l = parseWhatsAppLink("https://example.com/community");
    assert.equal(l?.kind, "link");
    assert.equal(l?.url, "https://example.com/community");
  });
});
