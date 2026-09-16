/** Referral slugs, public X post URLs, WhatsApp links. No book prose. */

export const REFERRAL_NGN = 1000;
export const REFERRAL_USD = "0.76";
export const VOICE_MAX_CHARS = 350_000;
export const VOICE_MAX_SECONDS = 20;
export const AVATAR_MAX_CHARS = 120_000;
export const MEDIA_MAX_CHARS = 620_000;

export function slugifyName(name: string) {
  const s = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return s || "student";
}

export type ParsedXPost = {
  url: string;
  handle: string;
  statusId: string;
};

const X_HOSTS = new Set([
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com",
  "mobile.x.com",
]);

export function parseXPostUrl(raw: string): ParsedXPost | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (!X_HOSTS.has(host)) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const statusIdx = parts.findIndex((p) => p === "status");
  if (statusIdx < 1 || !parts[statusIdx + 1]) return null;
  const handle = parts[0].replace(/^@/, "");
  const statusId = parts[statusIdx + 1].replace(/[^0-9]/g, "");
  if (!handle || !statusId) return null;
  return {
    url: `https://x.com/${handle}/status/${statusId}`,
    handle,
    statusId,
  };
}

export function validEmail(value: string) {
  const v = value.trim();
  if (!v) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.length > 120) {
    throw new Error("Enter a valid email.");
  }
  return v.toLowerCase();
}

export function validPhone(value: string) {
  const v = value.trim();
  if (!v) return "";
  const digits = v.replace(/\D/g, "");
  if (digits.length < 8 || v.length > 24) {
    throw new Error("Enter a phone number the academy can reach.");
  }
  return v.slice(0, 24);
}

export const WHATSAPP_COMMUNITY_URL = "https://chat.whatsapp.com/CI1z5P8BAWOL2oKsMRueUF";
export const WHATSAPP_COMMUNITY_LABEL = "Academy community";

export type WhatsLink = {
  kind: "group" | "chat" | "channel" | "link";
  url: string;
  phone: string;
};

export function parseWhatsAppLink(raw: string): WhatsLink | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "chat.whatsapp.com") {
    const invite = url.pathname.replace(/^\//, "").split("/")[0];
    if (!invite) return null;
    return { kind: "group", url: `https://chat.whatsapp.com/${invite}`, phone: "" };
  }
  if (host === "wa.me") {
    const phone = url.pathname.replace(/\D/g, "");
    if (phone.length < 8) return null;
    return { kind: "chat", url: `https://wa.me/${phone}`, phone };
  }
  if (host === "api.whatsapp.com") {
    const phone = (url.searchParams.get("phone") || "").replace(/\D/g, "");
    if (phone.length < 8) return null;
    return { kind: "chat", url: `https://wa.me/${phone}`, phone };
  }
  if (host === "whatsapp.com" && url.pathname.startsWith("/channel/")) {
    return { kind: "channel", url: `https://www.whatsapp.com${url.pathname}`, phone: "" };
  }
  return { kind: "link", url: url.toString(), phone: "" };
}

export function whatsappSendHref(channel: { url: string; phone: string }, text: string) {
  if (channel.phone) {
    const body = text.trim();
    return body
      ? `https://wa.me/${channel.phone}?text=${encodeURIComponent(body)}`
      : `https://wa.me/${channel.phone}`;
  }
  return channel.url;
}
