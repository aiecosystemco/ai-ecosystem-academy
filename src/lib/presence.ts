/** Seat last-seen: online if the device pinged within this window. */

export const ONLINE_MS = 2 * 60 * 1000;

export function lastSeenMs(value: string | Date | null | undefined) {
  if (!value) return 0;
  const t = value instanceof Date ? value.getTime() : Date.parse(String(value));
  return Number.isFinite(t) ? t : 0;
}

export function isOnline(value: string | Date | null | undefined, now = Date.now()) {
  const t = lastSeenMs(value);
  return t > 0 && now - t <= ONLINE_MS;
}

export function presenceLabel(opts: {
  online: boolean;
  classLive?: boolean;
}) {
  if (opts.online && opts.classLive) return "In class";
  if (opts.online) return "Online";
  return "Offline";
}

export function seatKeyFor(boundCode: string | null | undefined, userId: string) {
  const code = (boundCode ?? "").trim();
  return code || `acct:${userId}`;
}
