/** Public payment rails. Skrill is the only default. Crypto / NFT are author-added. */

export const AUTHOR_EMAIL = "aiecosystemco@gmail.com";
export const SKRILL_EMAIL = AUTHOR_EMAIL;
export const SKRILL_CHECKOUT = "https://pay.skrill.com";
export const SKRILL_SEND_MONEY = "https://www.skrill.com/en/how-to-send-money/";
export const SKRILL_ACCOUNT = "https://account.skrill.com/";
export const SKRILL_STATUS_PATH = "/api/skrill-status";

export const STUDENT_BATCHES = [
  "Cohort 1",
  "Cohort 2",
  "Cohort 3",
  "Cohort 4",
  "Self-paced",
  "Other",
] as const;

export type RailCategory = "skrill" | "crypto" | "nft";

export type SignupRail = {
  id: string;
  category: RailCategory;
  label: string;
  network: string;
  address: string;
  qrValue: string;
  details: string;
  instructions: string[];
};

/** Retired default rails — never republish unless the author pastes new details under a new id. */
export const RETIRED_RAIL_IDS = [
  "paga",
  "us-bank",
  "usdt-eth",
  "tron-usdt",
  "bitcoin",
  "other",
  "author-email",
] as const;

export function isRetiredRail(id: string) {
  return (RETIRED_RAIL_IDS as readonly string[]).includes(id);
}

export function visiblePayMethods<T extends { id: string; active: boolean }>(methods: T[]) {
  return methods.filter((m) => m.id === "skrill" || m.active || !isRetiredRail(m.id));
}

export function railSlug(kind: "crypto" | "nft", label: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);
  return `${kind}-${slug || Date.now().toString(36)}`.slice(0, 40);
}

export const SKRILL_INSTRUCTIONS = [
  "Pay with a Visa or Mastercard (or your Skrill wallet) from anywhere in the world.",
  "Skrill opens their official checkout. The academy Skrill account is aiecosystemco@gmail.com.",
  "After you pay, come back and paste the Skrill transaction id or confirmation, then submit.",
];

export const SIGNUP_RAILS: SignupRail[] = [
  {
    id: "skrill",
    category: "skrill",
    label: "Skrill",
    network: "Card · worldwide",
    address: SKRILL_EMAIL,
    qrValue: "",
    details: SKRILL_EMAIL,
    instructions: SKRILL_INSTRUCTIONS,
  },
];

export const RAIL_CATEGORIES: { id: RailCategory; label: string; hint: string }[] = [
  { id: "skrill", label: "Skrill", hint: "Card, worldwide" },
  { id: "crypto", label: "Crypto", hint: "Wallet the author added" },
  { id: "nft", label: "NFT", hint: "If the author listed one" },
];

export function railCategory(id: string, network = ""): RailCategory {
  const n = network.toLowerCase();
  if (id === "skrill" || n.includes("skrill") || n.includes("card ·")) return "skrill";
  if (id.startsWith("nft") || n === "nft" || n.includes("nft")) return "nft";
  return "crypto";
}

export function extractEthAddress(details: string) {
  const hit = details
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^0x[a-fA-F0-9]{40}$/.test(line));
  return hit ?? "";
}

export function skrillTxId() {
  const raw = `AEA${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return raw.replace(/[^a-zA-Z0-9]/g, "").slice(0, 30).toUpperCase();
}

/** Skrill Quick Checkout firstname/lastname limits. */
export function skrillPersonName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  const firstname = (parts[0] || "Student").slice(0, 20);
  const lastname = (parts.slice(1).join(" ") || "Academy").slice(0, 50);
  return { firstname, lastname };
}

/** Skrill IPN `status` codes → short label stored on the payment request. */
export function skrillStatusLabel(code: string) {
  const c = code.trim();
  if (c === "2") return "processed";
  if (c === "0") return "pending";
  if (c === "-1") return "cancelled";
  if (c === "-2") return "failed";
  if (c === "-3") return "chargeback";
  return c.slice(0, 16);
}
