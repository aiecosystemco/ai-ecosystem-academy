/** Occupancy: one person per unique code. Extra phones log the older phone out. */

export const SHARED_KICK_MSG =
  "This unique code was used by more than one person and has been removed.";

export const PHONE_REPLACED_MSG =
  "This phone was logged out because you signed in on a newer phone. The last phone stays on.";

export const DEVICE_REPLACED_MSG =
  "This device was logged out because you signed in on a newer one.";

export type DeviceKind = "phone" | "computer";

export type SeatSnap = {
  deviceId: string;
  kind: DeviceKind;
  timeZone: string;
  lastSeenMs: number;
};

export type OccupancyPlan = {
  allow: boolean;
  evict: string[];
  reason: string;
};

const DEVICE_KEY = "aea.device";
const KICK_REF_KEY = "aea.kickRef";

/** Latest phone (or computer) of that kind stays. Older same-kind devices are logged out. */
export function occupancyPlan(
  active: SeatSnap[],
  incoming: SeatSnap,
  incomingWasEvicted = false,
): OccupancyPlan {
  const self = active.find((s) => s.deviceId === incoming.deviceId);
  if (self) return { allow: true, evict: [], reason: "known" };

  const sameKind = active.filter((s) => s.kind === incoming.kind && s.deviceId !== incoming.deviceId);
  if (incomingWasEvicted && sameKind.length > 0) {
    return { allow: false, evict: [], reason: "replaced" };
  }
  return {
    allow: true,
    evict: sameKind.map((s) => s.deviceId),
    reason: sameKind.length ? "replace_same_kind" : "first",
  };
}

export function clientDeviceKind(): DeviceKind {
  if (typeof navigator === "undefined") return "computer";
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "phone" : "computer";
}

export function ensureDeviceId() {
  if (typeof window === "undefined") return "";
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing && existing.length >= 16) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return "";
  }
}

export function seatPayload() {
  const timeZone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || ""
      : "";
  const deviceId = ensureDeviceId();
  return {
    ...(deviceId.length >= 8 ? { deviceId } : {}),
    deviceKind: clientDeviceKind(),
    timeZone,
  };
}

export function isSharedKick(message: string) {
  return /more than one person/i.test(message);
}

export function isPhoneReplaced(message: string) {
  return /logged out because you signed in on a newer/i.test(message);
}

export function parseKickRef(message: string) {
  const m = message.match(/Ref[:\s]+([A-Za-z0-9]+)/);
  return m?.[1] ?? "";
}

export function rememberKickRef(ref: string) {
  if (typeof sessionStorage === "undefined" || !ref) return;
  try {
    sessionStorage.setItem(KICK_REF_KEY, ref);
  } catch {
    /* ignore */
  }
}

export function readKickRef() {
  if (typeof sessionStorage === "undefined") return "";
  try {
    return sessionStorage.getItem(KICK_REF_KEY) ?? "";
  } catch {
    return "";
  }
}

export function kickMessage(ref: string) {
  return ref ? `${SHARED_KICK_MSG} Ref ${ref}` : SHARED_KICK_MSG;
}
