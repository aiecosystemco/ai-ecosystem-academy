import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  generateAccessCode,
  hashPassword,
  maskCode,
  newToken,
  sha256,
} from "@/lib/access-hash";
import { ROADMAP_DAYS } from "@/lib/book-content";
import { STUDENT_BATCHES, SIGNUP_RAILS, isRetiredRail } from "@/lib/signup-rails";
import {
  DEVICE_REPLACED_MSG,
  kickMessage,
  occupancyPlan,
  PHONE_REPLACED_MSG,
  type DeviceKind,
  type SeatSnap,
} from "@/lib/seat-guard";
import {
  parseWhatsAppLink,
  parseXPostUrl,
  REFERRAL_NGN,
  REFERRAL_USD,
  slugifyName,
  validEmail,
  validPhone,
  VOICE_MAX_CHARS,
  MEDIA_MAX_CHARS,
} from "@/lib/campus-util";
import { growthScore, certificateSerial } from "@/lib/growth";
import { isOnline, seatKeyFor } from "@/lib/presence";

type SettingsRow = {
  locked: boolean;
  paid_access: boolean;
  price_ngn: number;
  price_usd: string;
  admin_password_hash: string;
  contact_email?: string;
  share_guard?: boolean;
};

type ProfileRow = {
  user_id: string;
  role: string;
  display_name: string;
  referral_slug: string;
  referred_by: string;
  batch: string;
  assigned_batch: string;
  bound_code: string;
  onboarded: boolean;
  phone: string;
  avatar: string;
};

type AuthUserRow = { id: string; email: string; name: string; image: string | null };

type SeatRow = {
  device_id: string;
  device_kind: string;
  time_zone: string;
  last_seen: string | Date;
  status: string;
};

function asBool(v: unknown) {
  return v === true || v === "t" || v === "true" || v === 1 || v === "1";
}

function asDeviceKind(value: string | undefined): DeviceKind {
  return value === "phone" ? "phone" : "computer";
}

async function academySettings() {
  const sql = await getSql();
  const rows = await sql<SettingsRow>`
    select locked, paid_access, price_ngn, price_usd, admin_password_hash, contact_email, share_guard
    from academy_settings where id = 1
  `;
  const row = rows[0];
  if (!row) throw new Error("Academy is not initialized.");
  return {
    locked: asBool(row.locked),
    paidAccess: asBool(row.paid_access),
    priceNgn: Number(row.price_ngn),
    priceUsd: row.price_usd,
    adminPasswordHash: row.admin_password_hash,
    contactEmail: (row.contact_email ?? "").trim(),
    shareGuard: row.share_guard === undefined || row.share_guard === null ? true : asBool(row.share_guard),
  };
}

async function authUser(userId: string) {
  const sql = await getSql();
  const rows = await sql<AuthUserRow>`
    select "id", "email", "name", "image" from "user" where "id" = ${userId}
  `;
  return rows[0] ?? null;
}

async function uniqueReferralSlug(name: string, userId: string) {
  const sql = await getSql();
  const base = slugifyName(name);
  let slug = base;
  for (let i = 0; i < 20; i += 1) {
    const taken = await sql<{ user_id: string }>`
      select user_id from campus_profiles
      where referral_slug = ${slug} and user_id <> ${userId}
    `;
    if (!taken[0]) return slug;
    slug = `${base}-${i + 2}`;
  }
  return `${base}-${userId.slice(0, 6).toLowerCase()}`;
}

async function logEvent(accessCode: string | null, event: string) {
  const sql = await getSql();
  await sql`insert into access_log (access_code, event) values (${accessCode}, ${event})`;
}

async function kickSharedCode(code: string, reason: string, deviceA: string, deviceB: string) {
  const sql = await getSql();
  const publicToken = newToken().slice(0, 20);
  await sql`
    update access_codes
    set status = ${"revoked"}, revoked_reason = ${"shared"}, last_used_at = now()
    where code = ${code}
  `;
  await sql`delete from sessions where access_code = ${code}`;
  await sql`update campus_profiles set bound_code = ${""}, updated_at = now() where bound_code = ${code}`;
  await sql`
    insert into share_incidents (access_code, public_token, reason, device_a, device_b)
    values (${code}, ${publicToken}, ${reason}, ${deviceA}, ${deviceB})
  `;
  await logEvent(code, "shared_kicked");
  return publicToken;
}

async function enforceSeat(opts: {
  code: string;
  deviceId: string;
  deviceKind: DeviceKind;
  timeZone: string;
}) {
  const s = await academySettings();
  if (!s.shareGuard) return;
  const deviceId = opts.deviceId.trim();
  if (deviceId.length < 8) return;
  const sql = await getSql();
  const rows = await sql<SeatRow>`
    select device_id, device_kind, time_zone, last_seen, status
    from code_seats where access_code = ${opts.code}
  `;
  const active: SeatSnap[] = rows
    .filter((r) => r.status !== "evicted")
    .map((r) => ({
      deviceId: r.device_id,
      kind: asDeviceKind(r.device_kind),
      timeZone: r.time_zone ?? "",
      lastSeenMs: new Date(r.last_seen).getTime() || 0,
    }));
  const incomingWasEvicted = rows.some(
    (r) => r.device_id === deviceId && r.status === "evicted",
  );
  const incoming: SeatSnap = {
    deviceId,
    kind: opts.deviceKind,
    timeZone: opts.timeZone,
    lastSeenMs: Date.now(),
  };
  const plan = occupancyPlan(active, incoming, incomingWasEvicted);
  if (!plan.allow) {
    throw new Error(opts.deviceKind === "phone" ? PHONE_REPLACED_MSG : DEVICE_REPLACED_MSG);
  }
  const accountKey = opts.code.startsWith("acct:");
  for (const id of plan.evict) {
    await sql`
      update code_seats
      set status = ${"evicted"}, last_seen = now()
      where access_code = ${opts.code} and device_id = ${id}
    `;
    if (accountKey) {
      await sql`
        delete from sessions
        where device_id = ${id} and (access_code = ${opts.code} or access_code = ${""} or access_code is null)
      `;
    } else {
      await sql`delete from sessions where device_id = ${id} and access_code = ${opts.code}`;
    }
    await logEvent(accountKey ? null : opts.code, "phone_replaced");
  }
  await sql`
    insert into code_seats (access_code, device_id, device_kind, time_zone, last_seen, status)
    values (${opts.code}, ${deviceId}, ${opts.deviceKind}, ${opts.timeZone}, now(), ${"active"})
    on conflict (access_code, device_id) do update set
      device_kind = excluded.device_kind,
      time_zone = excluded.time_zone,
      last_seen = now(),
      status = ${"active"}
  `;
}

async function shouldBeAuthor(userId: string, email: string) {
  const s = await academySettings();
  const contact = s.contactEmail.trim().toLowerCase();
  const mine = email.trim().toLowerCase();
  if (contact && mine && contact === mine) return true;
  // Live preview from Grok: the builder is signed in via the gate and cannot
  // sign out to use the official Gmail. Treat that preview identity as author.
  // Deployed apps have GROK_PROJECT_ID — those viewers stay students unless
  // their email is the official author Gmail.
  if (process.env.GROK_PROJECT_ID) return false;
  const sql = await getSql();
  const rows = await sql<{ providerId: string }>`
    select "providerId" from "account" where "userId" = ${userId}
  `;
  return rows.some((r) => r.providerId === "grok-gate");
}

async function maybePromoteAuthor(userId: string, email: string) {
  if (!(await shouldBeAuthor(userId, email))) return false;
  const sql = await getSql();
  await sql`
    update campus_profiles
    set role = ${"author"}, onboarded = true, updated_at = now()
    where user_id = ${userId}
  `;
  return true;
}

async function ensureProfile(userId: string): Promise<ProfileRow> {
  const sql = await getSql();
  const user = await authUser(userId);
  if (!user) throw new Error("Account not found.");
  const existing = await sql<ProfileRow>`
    select user_id, role, display_name, referral_slug, referred_by, batch, assigned_batch, bound_code, onboarded, phone, avatar
    from campus_profiles where user_id = ${userId}
  `;
  if (!existing[0]) {
    const name = (user.name ?? "").trim() || "Member";
    const slug = await uniqueReferralSlug(name, userId);
    const email = (user.email ?? "").trim().toLowerCase();
    const role = (await shouldBeAuthor(userId, email)) ? "author" : "student";
    const onboarded = role === "author";
    await sql`
      insert into campus_profiles (
        user_id, role, display_name, referral_slug, onboarded
      ) values (
        ${userId}, ${role}, ${name}, ${slug}, ${onboarded}
      )
      on conflict (user_id) do nothing
    `;
  } else {
    await maybePromoteAuthor(userId, user.email ?? "");
  }
  const rows = await sql<ProfileRow>`
    select user_id, role, display_name, referral_slug, referred_by, batch, assigned_batch, bound_code, onboarded, phone, avatar
    from campus_profiles where user_id = ${userId}
  `;
  const row = rows[0];
  if (!row) throw new Error("Profile missing.");
  return {
    ...row,
    onboarded: asBool(row.onboarded),
    phone: row.phone ?? "",
    avatar: row.avatar ?? "",
  };
}

function canEnterClass(profile: ProfileRow) {
  return profile.role === "author" || profile.role === "tutor" || Boolean(profile.bound_code);
}

function isAuthor(profile: ProfileRow) {
  return profile.role === "author";
}

function isStaff(profile: ProfileRow) {
  return profile.role === "author" || profile.role === "tutor";
}

function canTeach(profile: ProfileRow) {
  return profile.role === "author" || (profile.role === "tutor" && Boolean(profile.assigned_batch));
}

type SeatSeenRow = { access_code: string; last_seen: string | Date };
type ProgressCountRow = { access_code: string; kind: string; n: number };

async function lastSeenBySeat() {
  const sql = await getSql();
  const rows = await sql<SeatSeenRow>`
    select access_code, max(last_seen) as last_seen
    from code_seats
    where status = ${"active"}
    group by access_code
  `;
  const map = new Map<string, string | Date>();
  for (const r of rows) map.set(r.access_code, r.last_seen);
  return map;
}

async function progressCountsByCode(codes: string[]) {
  const wanted = [...new Set(codes.filter(Boolean))];
  const map = new Map<string, { roadmapDone: number; chapterDone: number }>();
  if (wanted.length === 0) return map;
  const sql = await getSql();
  const rows = await sql<ProgressCountRow>`
    select access_code, kind, count(*) as n
    from progress
    where done = true and (kind = ${"roadmap"} or kind = ${"chapter"})
    group by access_code, kind
  `;
  for (const r of rows) {
    if (!wanted.includes(r.access_code)) continue;
    const cur = map.get(r.access_code) ?? { roadmapDone: 0, chapterDone: 0 };
    if (r.kind === "roadmap") cur.roadmapDone = Number(r.n);
    if (r.kind === "chapter") cur.chapterDone = Number(r.n);
    map.set(r.access_code, cur);
  }
  return map;
}

function presenceFor(userId: string, boundCode: string, seen: Map<string, string | Date>, now = Date.now()) {
  const last = seen.get(seatKeyFor(boundCode, userId));
  return {
    online: isOnline(last, now),
    lastSeen: last ? String(last) : "",
  };
}

async function liveClassOn() {
  const sql = await getSql();
  const rows = await sql<{ day_number: number }>`
    select day_number from class_days where live = true
  `;
  return rows.map((r) => Number(r.day_number));
}

async function growthForBound(boundCode: string) {
  const code = boundCode.trim();
  if (!code) return growthScore({ roadmapDone: 0, chapterDone: 0 });
  const counts = await progressCountsByCode([code]);
  const row = counts.get(code) ?? { roadmapDone: 0, chapterDone: 0 };
  return growthScore(row);
}


async function creditReferral(payerUserId: string) {
  const sql = await getSql();
  const payer = await sql<ProfileRow>`
    select user_id, role, display_name, referral_slug, referred_by, batch, assigned_batch, bound_code, onboarded, phone, avatar
    from campus_profiles where user_id = ${payerUserId}
  `;
  const referrerId = (payer[0]?.referred_by ?? "").trim();
  if (!referrerId || referrerId === payerUserId) return;
  const referrer = await sql<{ user_id: string }>`
    select user_id from campus_profiles where user_id = ${referrerId}
  `;
  if (!referrer[0]) return;
  const dup = await sql<{ id: number }>`
    select id from earnings
    where kind = ${"referral"} and source_user_id = ${payerUserId}
    limit 1
  `;
  if (dup[0]) return;
  const name = (payer[0]?.display_name ?? "A student").trim() || "A student";
  try {
    await sql`
      insert into earnings (user_id, kind, amount_ngn, amount_usd, source_user_id, note)
      values (
        ${referrerId},
        ${"referral"},
        ${REFERRAL_NGN},
        ${REFERRAL_USD},
        ${payerUserId},
        ${`20% when ${name} paid for the book`}
      )
    `;
  } catch {
    /* already credited */
  }
}

/** Bind an issued unique code to the paying student's account so class opens without a paste. */
async function attachCodeToUser(userId: string, code: string) {
  const uid = userId.trim();
  const secret = code.trim();
  if (!uid || !secret) return false;
  const sql = await getSql();
  const rows = await sql<ProfileRow>`
    select user_id, role, display_name, referral_slug, referred_by, batch, assigned_batch, bound_code, onboarded, phone, avatar
    from campus_profiles where user_id = ${uid}
  `;
  const p = rows[0];
  if (!p || p.role === "author") return false;
  const bound = (p.bound_code ?? "").trim();
  if (bound && bound !== secret) return false;
  if (bound === secret) return true;
  await sql`
    update access_codes
    set bound_user_id = ${uid}, last_used_at = now(), use_count = use_count + 1
    where code = ${secret}
  `;
  await sql`
    update campus_profiles
    set bound_code = ${secret}, updated_at = now()
    where user_id = ${uid}
  `;
  await creditReferral(uid);
  await logEvent(secret, "student_bind");
  return true;
}

async function mintAcademySession(opts: {
  role: "student" | "admin";
  accessCode: string | null;
  deviceId: string;
  deviceKind: DeviceKind;
}) {
  const sql = await getSql();
  const token = newToken();
  const tokenHash = sha256(token);
  await sql`
    insert into sessions (token_hash, role, access_code, device_id, device_kind)
    values (${tokenHash}, ${opts.role}, ${opts.accessCode}, ${opts.deviceId}, ${opts.deviceKind})
  `;
  return token;
}

async function xLinked(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ providerId: string }>`
    select "providerId" from "account" where "userId" = ${userId}
  `;
  return rows.some((r) => r.providerId === "grok-x" || r.providerId === "twitter");
}

function publicProfile(p: ProfileRow, extra: {
  email: string;
  name: string;
  locked: boolean;
  priceNgn: number;
  priceUsd: string;
  contactEmail: string;
  xLinked: boolean;
  earningsNgn: number;
  earningsUsd: string;
  codeHint: string;
  paid: boolean;
  payStatus: "" | "pending" | "approved" | "rejected";
  growth?: { percent: number; done: number; total: number; complete: boolean; roadmapDone: number; chapterDone: number };
  certified?: boolean;
}) {
  return {
    userId: p.user_id,
    email: extra.email,
    name: p.display_name || extra.name,
    role: p.role as "student" | "tutor" | "author",
    onboarded: asBool(p.onboarded) || p.role === "author",
    batch: p.batch,
    assignedBatch: p.assigned_batch,
    referralSlug: p.referral_slug,
    bound: Boolean(p.bound_code),
    phone: p.phone ?? "",
    avatar: p.avatar ?? "",
    codeHint: extra.codeHint,
    paid: extra.paid,
    payStatus: extra.payStatus,
    canEnterClass: canEnterClass(p),
    canReadBook: p.role === "author" || p.role === "tutor" || Boolean(p.bound_code),
    locked: extra.locked,
    priceNgn: extra.priceNgn,
    priceUsd: extra.priceUsd,
    contactEmail: extra.contactEmail,
    xLinked: extra.xLinked,
    earningsNgn: extra.earningsNgn,
    earningsUsd: extra.earningsUsd,
    growth: extra.growth ?? growthScore({ roadmapDone: 0, chapterDone: 0 }),
    certified: extra.certified ?? false,
  };
}

export type CampusMe = Awaited<ReturnType<typeof getCampusMe>>;

export const getCampusMe = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      deviceId: z.string().min(8).max(80).optional(),
      deviceKind: z.enum(["phone", "computer"]).optional(),
      timeZone: z.string().max(80).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    const user = await authUser(context.userId);
    const s = await academySettings();
    const deviceId = (data.deviceId ?? "").trim();
    if (s.shareGuard && deviceId.length >= 8) {
      await enforceSeat({
        code: profile.bound_code || `acct:${context.userId}`,
        deviceId,
        deviceKind: asDeviceKind(data.deviceKind),
        timeZone: (data.timeZone ?? "").trim(),
      });
    }
    const sql = await getSql();
    const sums = await sql<{ ngn: number; usd: string }>`
      select coalesce(sum(amount_ngn), 0)::int as ngn,
             coalesce(sum(amount_usd::numeric), 0)::text as usd
      from earnings where user_id = ${context.userId}
    `;
    let paid = false;
    if (profile.bound_code) {
      const codes = await sql<{ paid: boolean; status: string }>`
        select paid, status from access_codes where code = ${profile.bound_code}
      `;
      paid = Boolean(codes[0] && codes[0].status === "active" && asBool(codes[0].paid));
    }
    if (profile.role === "author" || profile.role === "tutor") paid = true;
    let payStatus: "" | "pending" | "approved" | "rejected" = "";
    if (profile.bound_code || profile.role === "author" || profile.role === "tutor") {
      payStatus = "approved";
    } else {
      try {
        const pay = await sql<{ status: string; issued_code: string | null }>`
          select status, issued_code from payment_requests
          where user_id = ${context.userId}
          order by created_at desc
          limit 1
        `;
        const st = (pay[0]?.status ?? "").trim();
        if (st === "pending" || st === "approved" || st === "rejected") payStatus = st;
        const issued = (pay[0]?.issued_code ?? "").trim();
        if (st === "approved" && issued) {
          const attached = await attachCodeToUser(context.userId, issued);
          if (attached) {
            profile.bound_code = issued;
            paid = true;
            payStatus = "approved";
          }
        }
      } catch {
        payStatus = "";
      }
    }
    let growth = growthScore({ roadmapDone: 0, chapterDone: 0 });
    let certified = false;
    try {
      growth = await growthForBound(profile.bound_code);
      if (profile.bound_code) {
        const cert = await sql<{ user_id: string }>`
          select user_id from certificates where user_id = ${context.userId}
        `;
        certified = Boolean(cert[0]);
      }
    } catch {
      /* growth tables optional */
    }
    return publicProfile(profile, {
      email: user?.email ?? "",
      name: user?.name ?? "",
      locked: s.locked,
      priceNgn: s.priceNgn,
      priceUsd: s.priceUsd,
      contactEmail: s.contactEmail,
      xLinked: await xLinked(context.userId),
      earningsNgn: Number(sums[0]?.ngn ?? 0),
      earningsUsd: sums[0]?.usd ?? "0",
      codeHint: profile.bound_code ? maskCode(profile.bound_code) : profile.role === "author" ? "AUTHOR" : "",
      paid,
      payStatus,
      growth,
      certified,
    });
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      role: z.enum(["student", "tutor"]),
      displayName: z.string().min(2).max(80),
      referral: z.string().max(60).optional(),
      batch: z.string().max(40).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (profile.role === "author") return { ok: true as const };
    const name = data.displayName.trim();
    const slug = await uniqueReferralSlug(name, context.userId);
    const batch = STUDENT_BATCHES.includes(data.batch as (typeof STUDENT_BATCHES)[number])
      ? (data.batch as string)
      : profile.batch;
    let referredBy = profile.referred_by;
    const referral = (data.referral ?? "").trim().toLowerCase().replace(/^@/, "");
    if (!referredBy && referral) {
      const sql = await getSql();
      const found = await sql<{ user_id: string }>`
        select user_id from campus_profiles
        where referral_slug = ${slugifyName(referral) === referral ? referral : slugifyName(referral)}
           or referral_slug = ${referral}
        limit 1
      `;
      if (found[0] && found[0].user_id !== context.userId) referredBy = found[0].user_id;
    }
    // Only the author can make tutors. Public signup is always student.
    const nextRole = profile.role === "tutor" ? "tutor" : "student";
    const sql = await getSql();
    await sql`
      update campus_profiles
      set role = ${nextRole},
          display_name = ${name},
          referral_slug = ${slug},
          referred_by = ${referredBy},
          batch = ${batch},
          onboarded = true,
          updated_at = now()
      where user_id = ${context.userId} and role <> ${"author"}
    `;
    return { ok: true as const };
  });

export const bindAccessCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      secret: z.string().min(4).max(80),
      deviceId: z.string().min(8).max(80).optional(),
      deviceKind: z.enum(["phone", "computer"]).optional(),
      timeZone: z.string().max(80).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (profile.role === "author") throw new Error("Author lock is already open.");
    const s = await academySettings();
    if (s.locked) throw new Error("The academy is locked by the author. Reading is paused.");
    const code = data.secret.trim().toUpperCase().replace(/\s+/g, "");
    const sql = await getSql();
    const rows = await sql<{
      code: string;
      status: string;
      paid: boolean;
      label: string;
      revoked_reason: string;
      bound_user_id: string;
    }>`
      select code, status, paid, label, revoked_reason, bound_user_id
      from access_codes where code = ${code}
    `;
    const row = rows[0];
    if (!row) {
      await logEvent(code, "failed_bind");
      throw new Error("That code is not valid. Pay for your own unique access code.");
    }
    if (row.status !== "active") {
      if (row.revoked_reason === "shared") {
        const refs = await sql<{ public_token: string }>`
          select public_token from share_incidents
          where access_code = ${row.code}
          order by created_at desc
          limit 1
        `;
        throw new Error(kickMessage(refs[0]?.public_token ?? ""));
      }
      throw new Error("This access code has been revoked by the author.");
    }
    const boundTo = (row.bound_user_id ?? "").trim();
    if (boundTo && boundTo !== context.userId) {
      const token = await kickSharedCode(row.code, "second_person_account", boundTo, context.userId);
      throw new Error(kickMessage(token));
    }
    if (profile.bound_code && profile.bound_code !== row.code) {
      throw new Error("This account already has a unique code. Ask the author to replace it.");
    }
    const deviceId = (data.deviceId ?? "").trim();
    const deviceKind = asDeviceKind(data.deviceKind);
    const timeZone = (data.timeZone ?? "").trim();
    if (s.shareGuard && deviceId.length >= 8) {
      await enforceSeat({ code: row.code, deviceId, deviceKind, timeZone });
    }
    const label = (row.label ?? "").trim();
    const batch =
      STUDENT_BATCHES.includes(label as (typeof STUDENT_BATCHES)[number]) ? label : profile.batch;
    await sql`
      update access_codes
      set bound_user_id = ${context.userId}, last_used_at = now(), use_count = use_count + 1
      where code = ${row.code}
    `;
    await sql`
      update campus_profiles
      set bound_code = ${row.code}, batch = ${batch || profile.batch}, updated_at = now()
      where user_id = ${context.userId}
    `;
    if (asBool(row.paid)) await creditReferral(context.userId);
    await logEvent(row.code, "student_bind");
    const token = await mintAcademySession({
      role: "student",
      accessCode: row.code,
      deviceId,
      deviceKind,
    });
    return { ok: true as const, token, role: "student" as const, codeHint: maskCode(row.code) };
  });

export const openClassSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      deviceId: z.string().min(8).max(80).optional(),
      deviceKind: z.enum(["phone", "computer"]).optional(),
      timeZone: z.string().max(80).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    const s = await academySettings();
    const deviceId = (data.deviceId ?? "").trim();
    const deviceKind = asDeviceKind(data.deviceKind);
    const timeZone = (data.timeZone ?? "").trim();
    const seatKey = profile.bound_code || `acct:${context.userId}`;
    if (s.shareGuard && deviceId.length >= 8) {
      await enforceSeat({
        code: seatKey,
        deviceId,
        deviceKind,
        timeZone,
      });
    }
    if (profile.role === "author") {
      const token = await mintAcademySession({
        role: "admin",
        accessCode: null,
        deviceId,
        deviceKind,
      });
      return { ok: true as const, token, role: "admin" as const, codeHint: "AUTHOR" };
    }
    if (!profile.bound_code && profile.role !== "tutor") {
      throw new Error("Enter your unique code to open the class.");
    }
    if (profile.role !== "tutor") {
      if (s.locked) throw new Error("The academy is locked by the author. Reading is paused.");
      const sql = await getSql();
      const codes = await sql<{ status: string; revoked_reason: string }>`
        select status, revoked_reason from access_codes where code = ${profile.bound_code}
      `;
      if (!codes[0] || codes[0].status !== "active") {
        if (codes[0]?.revoked_reason === "shared") {
          const refs = await sql<{ public_token: string }>`
            select public_token from share_incidents
            where access_code = ${profile.bound_code}
            order by created_at desc
            limit 1
          `;
          throw new Error(kickMessage(refs[0]?.public_token ?? ""));
        }
        throw new Error("This access code has been revoked.");
      }
    }
    const token = await mintAcademySession({
      role: "student",
      accessCode: profile.bound_code || null,
      deviceId,
      deviceKind,
    });
    return {
      ok: true as const,
      token,
      role: "student" as const,
      codeHint: profile.bound_code ? maskCode(profile.bound_code) : "TUTOR",
    };
  });

export const claimAuthor = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ password: z.string().min(4).max(80) }))
  .handler(async ({ context }) => {
    throw new Error("The lock room opens only when you sign in with the official author Gmail.");
  });

export const updateAuthorEmail = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ email: z.string().min(5).max(120) }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    const email = validEmail(data.email);
    const sql = await getSql();
    const taken = await sql<{ id: string }>`
      select "id" from "user" where lower("email") = ${email} and "id" <> ${context.userId}
    `;
    if (taken[0]) throw new Error("That email is already on another account.");
    await sql`update academy_settings set contact_email = ${email}, updated_at = now() where id = 1`;
    await sql`update "user" set "email" = ${email}, "updatedAt" = now() where "id" = ${context.userId}`;
    await logEvent(null, "author_email");
    return { ok: true as const, email };
  });

export const updateAuthorKey = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      current: z.string().min(1).max(80),
      next: z.string().min(10).max(80),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    const s = await academySettings();
    if (hashPassword(data.current) !== s.adminPasswordHash) {
      throw new Error("Current author key is incorrect.");
    }
    const sql = await getSql();
    await sql`
      update academy_settings
      set admin_password_hash = ${hashPassword(data.next)}, updated_at = now()
      where id = 1
    `;
    await logEvent(null, "author_key_changed");
    return { ok: true as const };
  });

export const requestNewCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ note: z.string().max(400).optional() }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    const user = await authUser(context.userId);
    const email = validEmail(user?.email || "student@example.com");
    const name = profile.display_name.trim() || user?.name || "Student";
    const sql = await getSql();
    await sql`
      insert into replacement_requests (incident_token, student_name, student_email, note, user_id)
      values (${""}, ${name}, ${email}, ${(data.note ?? "").trim()}, ${context.userId})
    `;
    await logEvent(null, "replacement_request");
    return { ok: true as const };
  });

export const listClassDays = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await ensureProfile(context.userId);
    if (!canEnterClass(profile)) throw new Error("Enter your unique code to open the class.");
    const sql = await getSql();
    const rows = await sql<{ day_number: number; live: boolean }>`
      select day_number, live from class_days order by day_number asc
    `;
    const liveMap = new Map(rows.map((r) => [Number(r.day_number), asBool(r.live)]));
    return {
      canTeach: canTeach(profile),
      days: ROADMAP_DAYS.map((d) => ({
        day: d.day,
        week: d.week,
        task: d.task,
        live: liveMap.get(d.day) ?? false,
      })),
    };
  });

export const toggleClassLive = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ day: z.number().int().min(1).max(30), live: z.boolean() }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!canTeach(profile)) throw new Error("Only the author or an assigned tutor can open class.");
    const sql = await getSql();
    if (data.live) {
      await sql`
        insert into class_days (day_number, live, live_started_at, live_by)
        values (${data.day}, true, now(), ${context.userId})
        on conflict (day_number) do update set
          live = true, live_started_at = now(), live_by = ${context.userId}
      `;
    } else {
      await sql`
        insert into class_days (day_number, live, live_by)
        values (${data.day}, false, ${context.userId})
        on conflict (day_number) do update set
          live = false, live_by = ${context.userId}
      `;
    }
    return { ok: true as const, live: data.live };
  });

export const listClassMessages = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ day: z.number().int().min(1).max(30) }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!canEnterClass(profile)) throw new Error("Enter your unique code to open the class.");
    const sql = await getSql();
    const liveRows = await sql<{ live: boolean }>`
      select live from class_days where day_number = ${data.day}
    `;
    const roadmap = ROADMAP_DAYS.find((d) => d.day === data.day);
    const rows = await sql<{
      id: number;
      user_id: string;
      author_name: string;
      role: string;
      kind: string;
      body: string;
      audio_data: string;
      created_at: string | Date;
    }>`
      select id, user_id, author_name, role, kind, body, audio_data, created_at
      from class_messages
      where day_number = ${data.day}
      order by created_at asc
      limit 200
    `;
    const live = asBool(liveRows[0]?.live);
    let roster: { name: string; online: boolean; codeHint: string }[] = [];
    if (canTeach(profile)) {
      try {
        const seen = await lastSeenBySeat();
        const now = Date.now();
        const students =
          profile.role === "tutor" && profile.assigned_batch
            ? await sql<{ user_id: string; display_name: string; bound_code: string }>`
                select user_id, display_name, bound_code
                from campus_profiles
                where role = ${"student"} and batch = ${profile.assigned_batch} and bound_code <> ${""}
                order by display_name asc
                limit 200
              `
            : await sql<{ user_id: string; display_name: string; bound_code: string }>`
                select user_id, display_name, bound_code
                from campus_profiles
                where role = ${"student"} and bound_code <> ${""}
                order by display_name asc
                limit 200
              `;
        roster = students.map((st) => {
          const pres = presenceFor(st.user_id, st.bound_code, seen, now);
          return {
            name: st.display_name,
            online: pres.online,
            codeHint: st.bound_code ? maskCode(st.bound_code) : "",
          };
        });
      } catch {
        roster = [];
      }
    }
    return {
      day: data.day,
      week: roadmap?.week ?? "",
      task: roadmap?.task ?? "",
      live,
      canTeach: canTeach(profile),
      canPost: canTeach(profile) || live,
      roster,
      messages: rows.map((m) => ({
        id: Number(m.id),
        mine: m.user_id === context.userId,
        name: m.author_name,
        role: m.role,
        kind: m.kind,
        body: m.body,
        audio: m.audio_data,
        createdAt: String(m.created_at ?? ""),
      })),
    };
  });

export const postClassMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      day: z.number().int().min(1).max(30),
      kind: z.enum(["text", "voice", "resource", "image", "video"]),
      body: z.string().max(4000).optional(),
      audio: z.string().max(MEDIA_MAX_CHARS).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!canEnterClass(profile)) throw new Error("Enter your unique code to open the class.");
    const sql = await getSql();
    const liveRows = await sql<{ live: boolean }>`
      select live from class_days where day_number = ${data.day}
    `;
    const live = asBool(liveRows[0]?.live);
    if (!canTeach(profile) && !live) {
      throw new Error("This class is off. Wait for the green light.");
    }
    if ((data.kind === "image" || data.kind === "video") && !canTeach(profile)) {
      throw new Error("Only the author or an assigned tutor can upload class materials.");
    }
    const body = (data.body ?? "").trim();
    const audio = data.kind === "text" || data.kind === "resource" ? "" : (data.audio ?? "");
    if (data.kind === "voice") {
      if (!audio.startsWith("data:audio/") || audio.length < 32) {
        throw new Error("Voice note was empty.");
      }
      if (audio.length > VOICE_MAX_CHARS) throw new Error("That voice note is too large.");
    } else if (data.kind === "image") {
      if (!audio.startsWith("data:image/") || audio.length < 32) {
        throw new Error("Choose an image first.");
      }
    } else if (data.kind === "video") {
      if (!audio.startsWith("data:video/") || audio.length < 32) {
        throw new Error("Choose a short video first.");
      }
    } else if (body.length < 1) {
      throw new Error("Write a message first.");
    }
    const user = await authUser(context.userId);
    const name = profile.display_name || user?.name || "Member";
    const storedBody =
      data.kind === "voice"
        ? "Voice note"
        : data.kind === "image"
          ? body || "Image material"
          : data.kind === "video"
            ? body || "Video material"
            : body;
    await sql`
      insert into class_messages (day_number, user_id, author_name, role, kind, body, audio_data)
      values (
        ${data.day},
        ${context.userId},
        ${name},
        ${profile.role},
        ${data.kind},
        ${storedBody},
        ${audio}
      )
    `;
    return { ok: true as const };
  });

export const listPublicFeed = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    const posts = await sql<{
      id: number;
      user_id: string;
      author_name: string;
      role: string;
      day_number: number | null;
      x_url: string;
      x_handle: string;
      caption: string;
      created_at: string | Date;
    }>`
      select id, user_id, author_name, role, day_number, x_url, x_handle, caption, created_at
      from public_posts
      order by created_at desc
      limit 80
    `;
    const likes = await sql<{ post_id: number; user_id: string; is_author: boolean }>`
      select post_id, user_id, is_author from post_likes
    `;
    const comments = await sql<{
      id: number;
      post_id: number;
      user_id: string;
      author_name: string;
      body: string;
      created_at: string | Date;
    }>`
      select id, post_id, user_id, author_name, body, created_at
      from post_comments
      order by created_at asc
    `;
    const ads = await sql<{
      id: number;
      author_name: string;
      title: string;
      body: string;
      link: string;
    }>`
      select id, author_name, title, body, link from book_ads order by created_at desc limit 12
    `;
    return {
      ads: ads.map((a) => ({
        id: Number(a.id),
        name: a.author_name,
        title: a.title,
        body: a.body,
        link: a.link,
      })),
      posts: posts.map((p) => {
        const id = Number(p.id);
        const postLikes = likes.filter((l) => Number(l.post_id) === id);
        return {
          id,
          mine: p.user_id === context.userId,
          name: p.author_name,
          role: p.role,
          day: p.day_number ? Number(p.day_number) : null,
          url: p.x_url,
          handle: p.x_handle,
          caption: p.caption,
          createdAt: String(p.created_at ?? ""),
          likeCount: postLikes.length,
          authorLiked: postLikes.some((l) => asBool(l.is_author)),
          youLiked: postLikes.some((l) => l.user_id === context.userId),
          comments: comments
            .filter((c) => Number(c.post_id) === id)
            .map((c) => ({
              id: Number(c.id),
              name: c.author_name,
              body: c.body,
              mine: c.user_id === context.userId,
              createdAt: String(c.created_at ?? ""),
            })),
        };
      }),
    };
  });

export const postPublicX = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      url: z.string().min(12).max(300),
      caption: z.string().max(400).optional(),
      day: z.number().int().min(1).max(30).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!canEnterClass(profile) && profile.role !== "tutor") {
      throw new Error("Open the class with your unique code before posting.");
    }
    const parsed = parseXPostUrl(data.url);
    if (!parsed) throw new Error("Paste a public X post link (x.com/…/status/…).");
    const user = await authUser(context.userId);
    const name = profile.display_name || user?.name || "Member";
    const sql = await getSql();
    await sql`
      insert into public_posts (user_id, author_name, role, day_number, x_url, x_handle, x_status_id, caption)
      values (
        ${context.userId},
        ${name},
        ${profile.role},
        ${data.day ?? null},
        ${parsed.url},
        ${parsed.handle},
        ${parsed.statusId},
        ${(data.caption ?? "").trim()}
      )
    `;
    return { ok: true as const };
  });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ postId: z.number().int() }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    const sql = await getSql();
    const existing = await sql<{ user_id: string }>`
      select user_id from post_likes where post_id = ${data.postId} and user_id = ${context.userId}
    `;
    if (existing[0]) {
      await sql`delete from post_likes where post_id = ${data.postId} and user_id = ${context.userId}`;
      return { liked: false };
    }
    await sql`
      insert into post_likes (post_id, user_id, is_author)
      values (${data.postId}, ${context.userId}, ${profile.role === "author"})
    `;
    return { liked: true };
  });

export const commentPublic = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ postId: z.number().int(), body: z.string().min(1).max(400) }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    const user = await authUser(context.userId);
    const name = profile.display_name || user?.name || "Member";
    const sql = await getSql();
    await sql`
      insert into post_comments (post_id, user_id, author_name, body)
      values (${data.postId}, ${context.userId}, ${name}, ${data.body.trim()})
    `;
    return { ok: true as const };
  });

export const listEarnings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await ensureProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      kind: string;
      amount_ngn: number;
      amount_usd: string;
      note: string;
      created_at: string | Date;
    }>`
      select id, kind, amount_ngn, amount_usd, note, created_at
      from earnings where user_id = ${context.userId}
      order by created_at desc
      limit 80
    `;
    const totalNgn = rows.reduce((n, r) => n + Number(r.amount_ngn), 0);
    return {
      referralSlug: profile.referral_slug,
      totalNgn,
      totalUsd: rows.reduce((n, r) => n + Number(r.amount_usd), 0).toFixed(2),
      items: rows.map((r) => ({
        id: Number(r.id),
        kind: r.kind,
        amountNgn: Number(r.amount_ngn),
        amountUsd: r.amount_usd,
        note: r.note,
        createdAt: String(r.created_at ?? ""),
      })),
    };
  });

export const listTutorDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await ensureProfile(context.userId);
    if (profile.role !== "tutor" && profile.role !== "author") {
      throw new Error("Tutor desk is for tutors.");
    }
    const sql = await getSql();
    const batch = profile.role === "author" ? "" : profile.assigned_batch;
    const students = batch
      ? await sql<{
          user_id: string;
          display_name: string;
          batch: string;
          bound_code: string;
        }>`
          select user_id, display_name, batch, bound_code
          from campus_profiles
          where role = ${"student"} and batch = ${batch}
          order by display_name asc
        `
      : profile.role === "author"
        ? await sql<{
            user_id: string;
            display_name: string;
            batch: string;
            bound_code: string;
          }>`
            select user_id, display_name, batch, bound_code
            from campus_profiles
            where role = ${"student"}
            order by display_name asc
            limit 200
          `
        : [];
    const ratings = await sql<{
      student_user_id: string;
      score: number;
      note: string;
    }>`
      select student_user_id, score, note from student_ratings
      where tutor_user_id = ${context.userId}
    `;
    const rateMap = new Map(ratings.map((r) => [r.student_user_id, r]));
    const ads = await sql<{
      id: number;
      title: string;
      body: string;
      link: string;
      created_at: string | Date;
    }>`
      select id, title, body, link, created_at from book_ads
      where user_id = ${context.userId}
      order by created_at desc
      limit 20
    `;
    let seen = new Map<string, string | Date>();
    let liveDays: number[] = [];
    let counts = new Map<string, { roadmapDone: number; chapterDone: number }>();
    try {
      seen = await lastSeenBySeat();
      liveDays = await liveClassOn();
      counts = await progressCountsByCode(students.map((st) => st.bound_code));
    } catch {
      /* seats optional */
    }
    const now = Date.now();
    const classLive = liveDays.length > 0;
    return {
      assignedBatch: profile.assigned_batch,
      liveDays,
      classLive,
      students: students.map((st) => {
        const pres = presenceFor(st.user_id, st.bound_code, seen, now);
        const growth = growthScore(counts.get(st.bound_code) ?? { roadmapDone: 0, chapterDone: 0 });
        return {
          userId: st.user_id,
          name: st.display_name,
          batch: st.batch,
          codeHint: st.bound_code ? maskCode(st.bound_code) : "",
          score: rateMap.get(st.user_id)?.score ?? 0,
          note: rateMap.get(st.user_id)?.note ?? "",
          online: pres.online,
          lastSeen: pres.lastSeen,
          inClass: pres.online && classLive,
          grade: growth.percent,
          complete: growth.complete,
        };
      }),
      ads: ads.map((a) => ({
        id: Number(a.id),
        title: a.title,
        body: a.body,
        link: a.link,
        createdAt: String(a.created_at ?? ""),
      })),
    };
  });

export const rateStudent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      studentUserId: z.string().min(3).max(80),
      score: z.number().int().min(1).max(5),
      note: z.string().max(240).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (profile.role !== "tutor" && profile.role !== "author") {
      throw new Error("Only tutors can rate.");
    }
    const sql = await getSql();
    const student = await sql<ProfileRow>`
      select user_id, role, display_name, referral_slug, referred_by, batch, assigned_batch, bound_code, onboarded, phone, avatar
      from campus_profiles where user_id = ${data.studentUserId}
    `;
    const st = student[0];
    if (!st || st.role !== "student") throw new Error("Student not found.");
    if (profile.role === "tutor" && profile.assigned_batch && st.batch !== profile.assigned_batch) {
      throw new Error("That student is not in your assigned class.");
    }
    await sql`
      insert into student_ratings (tutor_user_id, student_user_id, score, note, updated_at)
      values (${context.userId}, ${data.studentUserId}, ${data.score}, ${(data.note ?? "").trim()}, now())
      on conflict (tutor_user_id, student_user_id) do update set
        score = excluded.score, note = excluded.note, updated_at = now()
    `;
    return { ok: true as const };
  });

export const saveBookAd = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      title: z.string().min(2).max(80),
      body: z.string().max(400),
      link: z.string().max(300).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (profile.role !== "tutor" && profile.role !== "author") {
      throw new Error("Book ads are for tutors.");
    }
    const user = await authUser(context.userId);
    const name = profile.display_name || user?.name || "Tutor";
    const sql = await getSql();
    await sql`
      insert into book_ads (user_id, author_name, title, body, link)
      values (${context.userId}, ${name}, ${data.title.trim()}, ${data.body.trim()}, ${(data.link ?? "").trim()})
    `;
    return { ok: true as const };
  });

export const listAuthorCampus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    const s = await academySettings();
    const sql = await getSql();
    const tutors = await sql<{
      user_id: string;
      display_name: string;
      assigned_batch: string;
      batch: string;
      bound_code: string;
    }>`
      select user_id, display_name, assigned_batch, batch, bound_code
      from campus_profiles where role = ${"tutor"}
      order by display_name asc
    `;
    const students = await sql<{
      user_id: string;
      display_name: string;
      batch: string;
      bound_code: string;
    }>`
      select user_id, display_name, batch, bound_code
      from campus_profiles where role = ${"student"}
      order by display_name asc
      limit 200
    `;
    const methods = await sql<{
      id: string;
      label: string;
      network: string;
      details: string;
      active: boolean;
    }>`
      select id, label, network, details, active from payment_methods order by sort_order asc, label asc
    `;
    const requests = await sql<{
      id: number;
      student_name: string;
      student_email: string;
      note: string;
      status: string;
      user_id: string;
      created_at: string | Date;
    }>`
      select id, student_name, student_email, note, status, user_id, created_at
      from replacement_requests
      order by created_at desc
      limit 40
    `;
    const unused = await sql<{ code: string; label: string }>`
      select code, label from access_codes
      where status = ${"active"} and bound_user_id = ${""}
      order by created_at desc
      limit 40
    `;
    let seen = new Map<string, string | Date>();
    let liveDays: number[] = [];
    let counts = new Map<string, { roadmapDone: number; chapterDone: number }>();
    let recoveries: {
      id: number;
      userId: string;
      email: string;
      createdAt: string;
      used: boolean;
    }[] = [];
    try {
      seen = await lastSeenBySeat();
      liveDays = await liveClassOn();
      counts = await progressCountsByCode(students.map((st) => st.bound_code));
      const rec = await sql<{
        id: number;
        user_id: string;
        email: string;
        created_at: string | Date;
        used_at: string | Date | null;
      }>`
        select id, user_id, email, created_at, used_at
        from password_recovery
        order by created_at desc
        limit 40
      `;
      recoveries = rec.map((r) => ({
        id: Number(r.id),
        userId: r.user_id,
        email: r.email,
        createdAt: String(r.created_at ?? ""),
        used: Boolean(r.used_at),
      }));
    } catch {
      /* optional tables */
    }
    const now = Date.now();
    const classLive = liveDays.length > 0;
    return {
      contactEmail: s.contactEmail,
      classLive,
      liveDays,
      tutors: tutors.map((t) => ({
        userId: t.user_id,
        name: t.display_name,
        assignedBatch: t.assigned_batch,
        batch: t.batch,
        bound: Boolean(t.bound_code),
        codeHint: t.bound_code ? maskCode(t.bound_code) : "",
      })),
      students: students.map((st) => {
        const pres = presenceFor(st.user_id, st.bound_code, seen, now);
        const growth = growthScore(counts.get(st.bound_code) ?? { roadmapDone: 0, chapterDone: 0 });
        return {
          userId: st.user_id,
          name: st.display_name,
          batch: st.batch,
          codeHint: st.bound_code ? maskCode(st.bound_code) : "",
          bound: Boolean(st.bound_code),
          online: pres.online,
          lastSeen: pres.lastSeen,
          inClass: pres.online && classLive,
          grade: growth.percent,
          complete: growth.complete,
        };
      }),
      unusedCodes: unused.map((c) => ({ code: c.code, label: c.label })),
      methods: methods.map((m) => ({
        id: m.id,
        label: m.label,
        network: m.network,
        details: m.details,
        active: asBool(m.active),
      })),
      replacements: requests.map((r) => ({
        id: Number(r.id),
        name: r.student_name,
        email: r.student_email,
        note: r.note,
        status: r.status,
        userId: r.user_id,
        createdAt: String(r.created_at ?? ""),
      })),
      recoveries,
      batches: [...STUDENT_BATCHES],
    };
  });

export const assignTutor = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string().min(3).max(80), batch: z.string().max(40) }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    const sql = await getSql();
    const batch = STUDENT_BATCHES.includes(data.batch as (typeof STUDENT_BATCHES)[number])
      ? data.batch
      : "";
    await sql`
      update campus_profiles
      set assigned_batch = ${batch}, updated_at = now()
      where user_id = ${data.userId} and role = ${"tutor"}
    `;
    return { ok: true as const };
  });

export const replaceStudentCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string().min(3).max(80) }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    const sql = await getSql();
    const student = await sql<ProfileRow>`
      select user_id, role, display_name, referral_slug, referred_by, batch, assigned_batch, bound_code, onboarded, phone, avatar
      from campus_profiles where user_id = ${data.userId}
    `;
    const st = student[0];
    if (!st) throw new Error("Student not found.");
    let code = generateAccessCode();
    for (let n = 0; n < 8; n += 1) {
      const exists = await sql<{ code: string }>`select code from access_codes where code = ${code}`;
      if (!exists[0]) break;
      code = generateAccessCode();
    }
    const old = st.bound_code;
    await sql`insert into access_codes (code, paid, label, bound_user_id) values (${code}, ${true}, ${st.batch || "replacement"}, ${st.user_id})`;
    if (old) {
      await sql`
        update access_codes
        set status = ${"revoked"}, revoked_reason = ${"author"}, replaced_by = ${code}
        where code = ${old}
      `;
      await sql`delete from sessions where access_code = ${old}`;
      await sql`delete from code_seats where access_code = ${old}`;
    }
    await sql`
      update campus_profiles set bound_code = ${code}, updated_at = now() where user_id = ${st.user_id}
    `;
    await sql`
      update replacement_requests set status = ${"replaced"}
      where user_id = ${st.user_id} and status = ${"pending"}
    `;
    await logEvent(code, "author_replaced_code");
    return { ok: true as const, code };
  });

export const saveCampusPayMethod = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.string().min(2).max(40),
      label: z.string().min(2).max(60),
      network: z.string().max(40).optional(),
      details: z.string().max(600),
      active: z.boolean(),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    const sql = await getSql();
    const network = (data.network ?? "").trim();
    const details = data.details.trim();
    const existing = await sql<{ id: string }>`select id from payment_methods where id = ${data.id}`;
    if (existing[0]) {
      await sql`
        update payment_methods
        set label = ${data.label.trim()}, network = ${network}, details = ${details},
            active = ${data.active}, updated_at = now()
        where id = ${data.id}
      `;
    } else {
      await sql`
        insert into payment_methods (id, label, network, details, active, sort_order)
        values (${data.id}, ${data.label.trim()}, ${network}, ${details}, ${data.active}, ${20})
      `;
    }
    await logEvent(null, "pay_method_saved");
    return { ok: true as const };
  });

export const removeCampusPayMethod = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(2).max(40) }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    const sql = await getSql();
    await sql`
      update payment_methods
      set active = false, details = ${""}, updated_at = now()
      where id = ${data.id}
    `;
    await logEvent(null, "pay_method_removed");
    return { ok: true as const };
  });

async function mintPaidCode(label: string) {
  const sql = await getSql();
  let code = generateAccessCode();
  for (let n = 0; n < 8; n += 1) {
    const exists = await sql<{ code: string }>`select code from access_codes where code = ${code}`;
    if (!exists[0]) break;
    code = generateAccessCode();
  }
  const tag = label.trim() || "paid";
  await sql`insert into access_codes (code, paid, label) values (${code}, ${true}, ${tag})`;
  await logEvent(code, "issued");
  return code;
}

export const issueCampusCodes = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      count: z.number().int().min(1).max(25),
      label: z.string().max(40).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    const label = (data.label ?? "").trim();
    const codes: string[] = [];
    for (let i = 0; i < data.count; i += 1) {
      codes.push(await mintPaidCode(label));
    }
    return { codes };
  });

export const listCampusEnrollments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      payment_ref: string;
      note: string;
      status: string;
      issued_code: string | null;
      created_at: string | Date;
      method: string;
      network: string;
      student_name: string;
      phone: string;
      x_handle: string;
      batch: string;
      user_id: string;
      skrill_status: string;
    }>`
      select id, payment_ref, note, status, issued_code, created_at, method, network,
             student_name, phone, x_handle, batch, user_id, skrill_status
      from payment_requests
      order by created_at desc
      limit 80
    `;
    return {
      requests: rows.map((r) => ({
        id: Number(r.id),
        paymentRef: r.payment_ref,
        note: r.note,
        status: r.status,
        hasCode: Boolean(r.issued_code),
        createdAt: String(r.created_at ?? ""),
        method: r.method,
        network: r.network,
        studentName: r.student_name,
        phone: r.phone,
        xHandle: r.x_handle,
        batch: r.batch,
        userId: r.user_id ?? "",
        skrillStatus: r.skrill_status ?? "",
        attached: Boolean((r.user_id ?? "").trim() && r.issued_code),
      })),
    };
  });

const enrollmentInput = z.object({
  studentName: z.string().min(2).max(80),
  phone: z.string().min(8).max(24),
  xHandle: z.string().min(1).max(40),
  batch: z.string().min(1).max(40),
  methodId: z.string().min(2).max(40),
  paymentRef: z.string().min(4).max(120),
  note: z.string().max(200).optional(),
});

export const submitCampusEnrollment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(enrollmentInput)
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (profile.role === "author") throw new Error("The author account does not enroll.");
    if (profile.bound_code) throw new Error("This account already has a unique code.");
    const s = await academySettings();
    if (s.locked) throw new Error("The academy is locked. New access is not being issued.");
    if (isRetiredRail(data.methodId)) throw new Error("That payment method is not available right now.");
    if (!(STUDENT_BATCHES as readonly string[]).includes(data.batch)) {
      throw new Error("Choose a batch.");
    }
    const sql = await getSql();
    const methods = await sql<{ id: string; label: string; network: string; details: string; active: boolean }>`
      select id, label, network, details, active from payment_methods where id = ${data.methodId}
    `;
    const row = methods[0];
    const seed = SIGNUP_RAILS.find((r) => r.id === data.methodId);
    let method: { label: string; network: string } | null = null;
    if (row && asBool(row.active) && (row.details ?? "").trim()) {
      method = { label: row.label, network: row.network };
    } else if (seed) {
      method = { label: seed.label, network: seed.network };
    }
    if (!method) throw new Error("That payment method is not available right now.");
    const name = data.studentName.trim();
    const phone = data.phone.trim();
    const handle = data.xHandle.trim().replace(/^@+/, "");
    const ref = data.paymentRef.trim();
    const note = (data.note ?? "").trim();
    const byRef = await sql<{ id: number; status: string }>`
      select id, status from payment_requests
      where payment_ref = ${ref}
      order by created_at desc
      limit 1
    `;
    if (byRef[0] && byRef[0].status !== "pending") {
      throw new Error("That payment reference is already on file.");
    }
    const byUser = await sql<{ id: number }>`
      select id from payment_requests
      where user_id = ${context.userId} and status = ${"pending"}
      order by created_at desc
      limit 1
    `;
    const existingId = byRef[0]?.id ?? byUser[0]?.id;
    if (existingId) {
      await sql`
        update payment_requests
        set payment_ref = ${ref},
            note = ${note},
            method = ${method.label},
            network = ${method.network},
            student_name = ${name},
            phone = ${phone},
            x_handle = ${handle},
            batch = ${data.batch},
            user_id = ${context.userId}
        where id = ${existingId}
      `;
    } else {
      await sql`
        insert into payment_requests (
          payment_ref, note, method, network, student_name, phone, x_handle, batch, user_id
        ) values (
          ${ref}, ${note}, ${method.label}, ${method.network}, ${name}, ${phone}, ${handle}, ${data.batch}, ${context.userId}
        )
      `;
    }
    await sql`
      update campus_profiles
      set phone = ${phone},
          display_name = ${name || profile.display_name},
          batch = ${data.batch},
          updated_at = now()
      where user_id = ${context.userId}
    `;
    await logEvent(null, "enrollment");
    return { ok: true as const };
  });

export const decideCampusEnrollment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number().int(), approve: z.boolean() }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    const sql = await getSql();
    if (!data.approve) {
      await sql`update payment_requests set status = ${"rejected"} where id = ${data.id}`;
      return { ok: true as const, code: null as string | null, attached: false };
    }
    const existing = await sql<{ issued_code: string | null; batch: string; user_id: string }>`
      select issued_code, batch, user_id from payment_requests where id = ${data.id}
    `;
    const row = existing[0];
    if (!row) throw new Error("That payment request was not found.");
    let code = (row.issued_code ?? "").trim();
    if (!code) {
      code = await mintPaidCode(row.batch || "paid");
      await sql`
        update payment_requests
        set status = ${"approved"}, issued_code = ${code}
        where id = ${data.id}
      `;
    } else {
      await sql`update payment_requests set status = ${"approved"} where id = ${data.id}`;
    }
    const attached = await attachCodeToUser(row.user_id ?? "", code);
    return { ok: true as const, code, attached };
  });

export const aboutTheBook = createServerFn({ method: "GET" }).handler(async () => {
  const s = await academySettings();
  return {
    locked: s.locked,
    paidAccess: s.paidAccess,
    priceNgn: s.priceNgn,
    priceUsd: s.priceUsd,
    contactEmail: s.contactEmail,
  };
});

export const promoteToTutor = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      userId: z.string().min(3).max(80),
      batch: z.string().max(40),
      unusedCode: z.string().max(80).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    if (data.userId === context.userId) throw new Error("You are already the author.");
    const batch = STUDENT_BATCHES.includes(data.batch as (typeof STUDENT_BATCHES)[number])
      ? data.batch
      : "";
    const sql = await getSql();
    const target = await sql<ProfileRow>`
      select user_id, role, display_name, referral_slug, referred_by, batch, assigned_batch, bound_code, onboarded, phone, avatar
      from campus_profiles where user_id = ${data.userId}
    `;
    const row = target[0];
    if (!row) throw new Error("That account was not found.");
    if (row.role === "author") throw new Error("The author account cannot become a tutor.");
    const unused = (data.unusedCode ?? "").trim().toUpperCase().replace(/\s+/g, "");
    if (unused) {
      const codes = await sql<{ code: string; status: string; bound_user_id: string }>`
        select code, status, bound_user_id from access_codes where code = ${unused}
      `;
      const code = codes[0];
      if (!code || code.status !== "active") throw new Error("That unique code is not available.");
      const boundTo = (code.bound_user_id ?? "").trim();
      if (boundTo && boundTo !== data.userId) throw new Error("That unique code is already on another account.");
      await sql`
        update access_codes
        set bound_user_id = ${data.userId}, last_used_at = now()
        where code = ${code.code}
      `;
      await sql`
        update campus_profiles
        set bound_code = ${code.code}, updated_at = now()
        where user_id = ${data.userId}
      `;
    }
    await sql`
      update campus_profiles
      set role = ${"tutor"},
          assigned_batch = ${batch},
          onboarded = true,
          updated_at = now()
      where user_id = ${data.userId}
    `;
    await logEvent(null, "tutor_promoted");
    return { ok: true as const };
  });

export const requestPasswordRecovery = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().min(4).max(120) }))
  .handler(async ({ data }) => {
    const email = validEmail(data.email);
    const sql = await getSql();
    const users = await sql<{ id: string; email: string }>`
      select "id", "email" from "user" where lower("email") = ${email}
      limit 1
    `;
    if (users[0]) {
      await sql`
        insert into password_recovery (user_id, email, token_hash, expires_at)
        values (${users[0].id}, ${email}, ${""}, ${new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()})
      `;
    }
    return {
      ok: true as const,
      message: "If that email is on an account, the author can send a private recovery link to it.",
    };
  });

export const issueRecoveryLink = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    const sql = await getSql();
    const rows = await sql<{ id: number; user_id: string; email: string; used_at: string | Date | null }>`
      select id, user_id, email, used_at from password_recovery where id = ${data.id}
    `;
    const row = rows[0];
    if (!row) throw new Error("That recovery request was not found.");
    if (row.used_at) throw new Error("That recovery link was already used.");
    const token = newToken();
    const tokenHash = sha256(token);
    await sql`
      update password_recovery
      set token_hash = ${tokenHash}, expires_at = ${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}
      where id = ${row.id}
    `;
    await logEvent(null, "password_recovery_issued");
    return { ok: true as const, token, email: row.email };
  });

export const resetPasswordWithToken = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(8).max(80),
      password: z.string().min(8).max(80),
    }),
  )
  .handler(async ({ data }) => {
    const tokenHash = sha256(data.token.trim());
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      user_id: string;
      expires_at: string | Date | null;
      used_at: string | Date | null;
    }>`
      select id, user_id, expires_at, used_at
      from password_recovery
      where token_hash = ${tokenHash}
      limit 1
    `;
    const row = rows[0];
    if (!row || row.used_at) throw new Error("That recovery link is not valid.");
    const exp = row.expires_at ? new Date(row.expires_at).getTime() : 0;
    if (!exp || exp < Date.now()) throw new Error("That recovery link has expired. Ask the author for a new one.");
    const { hashPassword: hashCredential } = await import("better-auth/crypto");
    const hashed = await hashCredential(data.password);
    const accounts = await sql<{ id: string }>`
      select "id" from "account"
      where "userId" = ${row.user_id} and "providerId" = ${"credential"}
    `;
    if (accounts[0]) {
      await sql`
        update "account"
        set "password" = ${hashed}, "updatedAt" = now()
        where "id" = ${accounts[0].id}
      `;
    } else {
      const id = `cred-${row.user_id}`.slice(0, 64);
      await sql`
        insert into "account" (
          "id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt"
        ) values (
          ${id}, ${row.user_id}, ${"credential"}, ${row.user_id}, ${hashed}, now(), now()
        )
      `;
    }
    await sql`
      update password_recovery
      set used_at = now()
      where id = ${row.id}
    `;
    await logEvent(null, "password_reset");
    return { ok: true as const };
  });

export const getMyGrowth = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await ensureProfile(context.userId);
    if (!canEnterClass(profile) && profile.role !== "student") {
      throw new Error("Enter your unique code to open growth.");
    }
    const growth = await growthForBound(profile.bound_code);
    const sql = await getSql();
    let certificate: { serial: string; name: string; issuedAt: string } | null = null;
    try {
      const cert = await sql<{ serial: string; display_name: string; issued_at: string | Date }>`
        select serial, display_name, issued_at from certificates where user_id = ${context.userId}
      `;
      if (cert[0]) {
        certificate = {
          serial: cert[0].serial,
          name: cert[0].display_name,
          issuedAt: String(cert[0].issued_at ?? ""),
        };
      }
    } catch {
      certificate = null;
    }
    return {
      name: profile.display_name,
      bound: Boolean(profile.bound_code),
      ...growth,
      certificate,
    };
  });

export const claimCertificate = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await ensureProfile(context.userId);
    if (!profile.bound_code && profile.role === "student") {
      throw new Error("Finish the program with your unique code first.");
    }
    const growth = await growthForBound(profile.bound_code);
    if (!growth.complete) {
      throw new Error("Finish every chapter and all 30 days before the certificate opens.");
    }
    const sql = await getSql();
    const existing = await sql<{ serial: string; display_name: string; issued_at: string | Date }>`
      select serial, display_name, issued_at from certificates where user_id = ${context.userId}
    `;
    if (existing[0]) {
      return {
        serial: existing[0].serial,
        name: existing[0].display_name,
        issuedAt: String(existing[0].issued_at ?? ""),
      };
    }
    const user = await authUser(context.userId);
    const name = profile.display_name || user?.name || "Student";
    const issuedAt = new Date();
    const serial = certificateSerial(context.userId, issuedAt);
    await sql`
      insert into certificates (user_id, serial, display_name, issued_at)
      values (${context.userId}, ${serial}, ${name}, ${issuedAt.toISOString()})
      on conflict (user_id) do nothing
    `;
    const saved = await sql<{ serial: string; display_name: string; issued_at: string | Date }>`
      select serial, display_name, issued_at from certificates where user_id = ${context.userId}
    `;
    const row = saved[0];
    if (!row) throw new Error("Could not issue the certificate.");
    await logEvent(profile.bound_code || null, "certificate_issued");
    return {
      serial: row.serial,
      name: row.display_name,
      issuedAt: String(row.issued_at ?? ""),
    };
  });

const AI_TURNS_PER_DAY = 16;

async function transcribeVoice(dataUrl: string) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return "";
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return "";
  const header = dataUrl.slice(0, comma);
  const b64 = dataUrl.slice(comma + 1);
  const mime = /data:([^;]+)/.exec(header)?.[1] || "audio/webm";
  const bytes = Buffer.from(b64, "base64");
  if (bytes.length < 32) return "";
  const ext = mime.includes("mp4") ? "m4a" : mime.includes("mpeg") ? "mp3" : "webm";
  const form = new FormData();
  form.append("file", new File([bytes], `voice.${ext}`, { type: mime }));
  form.append("language", "en");
  const res = await fetch("https://api.x.ai/v1/stt", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) return "";
  const body = (await res.json()) as { text?: string };
  return (body.text ?? "").trim();
}

export const listClassAi = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ day: z.number().int().min(1).max(30) }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!canEnterClass(profile)) throw new Error("Enter your unique code to open the class.");
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      role: string;
      body: string;
      created_at: string | Date;
    }>`
      select id, role, body, created_at
      from class_ai_messages
      where day_number = ${data.day} and user_id = ${context.userId}
      order by created_at asc
      limit 40
    `;
    return {
      available: Boolean(process.env.XAI_API_KEY),
      messages: rows.map((m) => ({
        id: Number(m.id),
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        body: m.body,
        createdAt: String(m.created_at ?? ""),
      })),
    };
  });

export const askClassAi = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      day: z.number().int().min(1).max(30),
      text: z.string().max(2000).optional(),
      audio: z.string().max(VOICE_MAX_CHARS).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!canEnterClass(profile)) throw new Error("Enter your unique code to open the class.");
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error("Academy AI is not available right now.");
    let prompt = (data.text ?? "").trim();
    if (!prompt && data.audio) {
      prompt = await transcribeVoice(data.audio);
    }
    if (prompt.length < 2) throw new Error("Type a question, or record a short voice note.");
    const sql = await getSql();
    const used = await sql<{ n: number }>`
      select count(*)::int as n from class_ai_messages
      where user_id = ${context.userId} and day_number = ${data.day} and role = ${"user"}
    `;
    if (Number(used[0]?.n ?? 0) >= AI_TURNS_PER_DAY) {
      throw new Error("Today's AI questions for this class are used up. Ask again tomorrow.");
    }
    const hist = await sql<{ role: string; body: string }>`
      select role, body from class_ai_messages
      where user_id = ${context.userId} and day_number = ${data.day}
      order by created_at desc
      limit 8
    `;
    const roadmap = ROADMAP_DAYS.find((d) => d.day === data.day);
    const messages = [
      {
        role: "system" as const,
        content:
          "You are the in-class AI for AI Ecosystem Academy (Prompt Engineering & AI Content Creation Editing 101 by Daniel Christopher). Help this student ask questions, research, and write prompts. Be concise and practical. Do not paste long book chapters or copyrighted book prose. Do not issue access codes or mention other students.",
      },
      ...hist.reverse().map((h) => ({
        role: (h.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
        content: h.body,
      })),
      {
        role: "user" as const,
        content: roadmap ? `Class day ${data.day}: ${roadmap.task}\n\n${prompt}` : prompt,
      },
    ];
    await sql`
      insert into class_ai_messages (day_number, user_id, role, body)
      values (${data.day}, ${context.userId}, ${"user"}, ${prompt})
    `;
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 700,
        messages,
      }),
    });
    if (!res.ok) {
      throw new Error("Academy AI could not answer just then. Try again in a moment.");
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const answer = (body.choices?.[0]?.message?.content ?? "").trim() || "I could not form an answer.";
    await sql`
      insert into class_ai_messages (day_number, user_id, role, body)
      values (${data.day}, ${context.userId}, ${"assistant"}, ${answer})
    `;
    return { ok: true as const, prompt, answer };
  });

export const saveCampusProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      phone: z.string().max(24).optional(),
      avatar: z.string().max(120_000).optional(),
      clearAvatar: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    const sql = await getSql();
    const phone = data.phone === undefined ? profile.phone : validPhone(data.phone);
    let avatar = profile.avatar;
    if (data.clearAvatar) avatar = "";
    else if (data.avatar !== undefined) {
      if (data.avatar && !data.avatar.startsWith("data:image/")) {
        throw new Error("Choose a photo from your phone or computer.");
      }
      avatar = data.avatar;
    }
    await sql`
      update campus_profiles
      set phone = ${phone}, avatar = ${avatar}, updated_at = now()
      where user_id = ${context.userId}
    `;
    if (data.avatar !== undefined || data.clearAvatar) {
      await sql`update "user" set image = ${avatar || null}, "updatedAt" = now() where "id" = ${context.userId}`;
    }
    return { ok: true as const, phone, avatar };
  });

export const listWhatsChannels = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      label: string;
      url: string;
      kind: string;
      phone: string;
      active: boolean;
    }>`
      select id, label, url, kind, phone, active
      from whatsapp_channels
      where active = true
      order by created_at desc
    `;
    return {
      channels: rows.map((r) => ({
        id: Number(r.id),
        label: r.label,
        url: r.url,
        kind: r.kind,
        phone: r.phone,
        active: asBool(r.active),
      })),
    };
  });

export const saveWhatsChannel = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      label: z.string().min(2).max(80),
      url: z.string().min(8).max(400),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    const parsed = parseWhatsAppLink(data.url);
    if (!parsed) throw new Error("Paste a WhatsApp group, chat, or https link.");
    const sql = await getSql();
    const inserted = await sql<{ id: number }>`
      insert into whatsapp_channels (label, url, kind, phone, active)
      values (${data.label.trim()}, ${parsed.url}, ${parsed.kind}, ${parsed.phone}, ${true})
      returning id
    `;
    await logEvent(null, "whatsapp_channel");
    return { ok: true as const, id: Number(inserted[0]?.id ?? 0) };
  });

export const removeWhatsChannel = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    const sql = await getSql();
    await sql`update whatsapp_channels set active = false where id = ${data.id}`;
    return { ok: true as const };
  });

export const listWhatsMessages = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ channelId: z.number().int().positive() }))
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    const sql = await getSql();
    const channels = await sql<{
      id: number;
      label: string;
      url: string;
      kind: string;
      phone: string;
      active: boolean;
    }>`
      select id, label, url, kind, phone, active from whatsapp_channels where id = ${data.channelId}
    `;
    const channel = channels[0];
    if (!channel || !asBool(channel.active)) throw new Error("That WhatsApp desk is not active.");
    const rows = await sql<{
      id: number;
      body: string;
      created_at: string | Date;
    }>`
      select id, body, created_at
      from whatsapp_messages
      where channel_id = ${data.channelId}
      order by created_at desc
      limit 40
    `;
    return {
      channel: {
        id: Number(channel.id),
        label: channel.label,
        url: channel.url,
        kind: channel.kind,
        phone: channel.phone,
      },
      messages: rows.map((m) => ({
        id: Number(m.id),
        body: m.body,
        createdAt: String(m.created_at ?? ""),
      })),
    };
  });

export const sendWhatsMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      channelId: z.number().int().positive(),
      body: z.string().min(1).max(1000),
    }),
  )
  .handler(async ({ context, data }) => {
    const profile = await ensureProfile(context.userId);
    if (!isAuthor(profile)) throw new Error("Author lock required.");
    const sql = await getSql();
    const channels = await sql<{ url: string; phone: string; active: boolean }>`
      select url, phone, active from whatsapp_channels where id = ${data.channelId}
    `;
    const channel = channels[0];
    if (!channel || !asBool(channel.active)) throw new Error("That WhatsApp desk is not active.");
    const body = data.body.trim();
    await sql`
      insert into whatsapp_messages (channel_id, user_id, body)
      values (${data.channelId}, ${context.userId}, ${body})
    `;
    const href = channel.phone
      ? `https://wa.me/${channel.phone}?text=${encodeURIComponent(body)}`
      : channel.url;
    return { ok: true as const, href, copy: !channel.phone };
  });

