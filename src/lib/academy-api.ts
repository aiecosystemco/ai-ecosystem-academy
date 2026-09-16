import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import {
  generateAccessCode,
  hashPassword,
  maskCode,
  newToken,
  sha256,
} from "@/lib/access-hash";
import { chapters, chapterBySlug, neighbors, PROMPT_LIBRARY, ROADMAP_DAYS } from "@/lib/book-content";
import { catalogFor, liveChapterBySlug, mergeChapter, type ExampleOverride } from "@/lib/live-chapter";
import {
  SIGNUP_RAILS,
  STUDENT_BATCHES,
  extractEthAddress,
  isRetiredRail,
  railCategory,
  type SignupRail,
} from "@/lib/signup-rails";
import {
  PRACTICE_TOOLS,
  isToolCategory,
  mapPracticeToolRow,
  slugForTool,
  type PracticeTool,
} from "@/lib/practice-tools";
import {
  DEVICE_REPLACED_MSG,
  kickMessage,
  occupancyPlan,
  PHONE_REPLACED_MSG,
  type DeviceKind,
  type SeatSnap,
} from "@/lib/seat-guard";
import { REFERRAL_NGN, REFERRAL_USD } from "@/lib/campus-util";

type SettingsRow = {
  locked: boolean;
  paid_access: boolean;
  price_ngn: number;
  price_usd: string;
  admin_password_hash: string;
  contact_email?: string;
  share_guard?: boolean;
};

type CodeRow = {
  code: string;
  status: string;
  paid: boolean;
  label: string;
  created_at: string;
  last_used_at: string | null;
  use_count: number;
  revoked_reason?: string;
  replaced_by?: string;
};

type SessionRow = {
  token_hash: string;
  role: string;
  access_code: string | null;
  device_id?: string;
};

type SeatRow = {
  device_id: string;
  device_kind: string;
  time_zone: string;
  last_seen: string | Date;
  status?: string;
};

type RequestRow = {
  id: number;
  payment_ref: string;
  note: string;
  status: string;
  issued_code: string | null;
  created_at: string;
};

type ProgressRow = {
  access_code: string;
  kind: string;
  item_key: string;
  done: boolean;
  payload: string;
};

function asBool(v: unknown) {
  return v === true || v === "t" || v === "true" || v === 1 || v === "1";
}

async function settings() {
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

async function logEvent(accessCode: string | null, event: string) {
  const sql = await getSql();
  await sql`insert into access_log (access_code, event) values (${accessCode}, ${event})`;
}

async function sessionFromToken(token: string) {
  const sql = await getSql();
  const hash = sha256(token);
  const rows = await sql<SessionRow>`select token_hash, role, access_code from sessions where token_hash = ${hash}`;
  const row = rows[0];
  if (!row) return null;
  await sql`update sessions set last_seen = now() where token_hash = ${hash}`;
  return { role: row.role as "student" | "admin", accessCode: row.access_code };
}

async function requireSession(token: string) {
  const session = await sessionFromToken(token);
  if (!session) throw new Error("Session expired. Enter your access code again.");
  const s = await settings();
  if (session.role === "student") {
    if (s.locked) throw new Error("The academy is locked by the author. Reading is paused.");
    if (session.accessCode) {
      const sql = await getSql();
      const codes = await sql<{ status: string; revoked_reason: string }>`
        select status, revoked_reason from access_codes where code = ${session.accessCode}
      `;
      if (!codes[0] || codes[0].status !== "active") {
        if (codes[0]?.revoked_reason === "shared") {
          const refs = await sql<{ public_token: string }>`
            select public_token from share_incidents
            where access_code = ${session.accessCode}
            order by created_at desc
            limit 1
          `;
          throw new Error(kickMessage(refs[0]?.public_token ?? ""));
        }
        throw new Error("This access code has been revoked.");
      }
    }
  }
  return { ...session, settings: s };
}

function asDeviceKind(value: string | undefined): DeviceKind {
  return value === "phone" ? "phone" : "computer";
}

function seatsFromRows(rows: SeatRow[]): SeatSnap[] {
  return rows
    .filter((r) => r.status !== "evicted")
    .map((r) => ({
      deviceId: r.device_id,
      kind: asDeviceKind(r.device_kind),
      timeZone: r.time_zone ?? "",
      lastSeenMs: new Date(r.last_seen).getTime() || 0,
    }));
}

async function kickSharedCode(
  code: string,
  reason: string,
  deviceA: string,
  deviceB: string,
) {
  const sql = await getSql();
  const publicToken = newToken().slice(0, 20);
  await sql`
    update access_codes
    set status = ${"revoked"}, revoked_reason = ${"shared"}, last_used_at = now()
    where code = ${code}
  `;
  await sql`delete from sessions where access_code = ${code}`;
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
  tokenHash?: string;
}) {
  const s = await settings();
  if (!s.shareGuard) return;
  const deviceId = opts.deviceId.trim();
  if (deviceId.length < 8) return;
  const sql = await getSql();
  const rows = await sql<SeatRow>`
    select device_id, device_kind, time_zone, last_seen, status
    from code_seats
    where access_code = ${opts.code}
  `;
  const incoming: SeatSnap = {
    deviceId,
    kind: opts.deviceKind,
    timeZone: opts.timeZone.trim().slice(0, 80),
    lastSeenMs: Date.now(),
  };
  const incomingWasEvicted = rows.some(
    (r) => r.device_id === deviceId && r.status === "evicted",
  );
  const plan = occupancyPlan(seatsFromRows(rows), incoming, incomingWasEvicted);
  if (!plan.allow) {
    throw new Error(opts.deviceKind === "phone" ? PHONE_REPLACED_MSG : DEVICE_REPLACED_MSG);
  }
  for (const id of plan.evict) {
    await sql`
      update code_seats
      set status = ${"evicted"}, last_seen = now()
      where access_code = ${opts.code} and device_id = ${id}
    `;
    await sql`delete from sessions where device_id = ${id} and access_code = ${opts.code}`;
    await logEvent(opts.code, "phone_replaced");
  }
  const existing = await sql<{ device_id: string }>`
    select device_id from code_seats
    where access_code = ${opts.code} and device_id = ${deviceId}
  `;
  if (existing[0]) {
    await sql`
      update code_seats
      set device_kind = ${opts.deviceKind},
          time_zone = ${incoming.timeZone},
          last_seen = now(),
          status = ${"active"}
      where access_code = ${opts.code} and device_id = ${deviceId}
    `;
  } else {
    await sql`
      insert into code_seats (access_code, device_id, device_kind, time_zone, status)
      values (${opts.code}, ${deviceId}, ${opts.deviceKind}, ${incoming.timeZone}, ${"active"})
    `;
  }
  if (opts.tokenHash) {
    await sql`
      update sessions
      set device_id = ${deviceId}, device_kind = ${opts.deviceKind}, last_seen = now()
      where token_hash = ${opts.tokenHash}
    `;
  }
}

async function requireAdmin(token: string) {
  const session = await requireSession(token);
  if (session.role !== "admin") throw new Error("Author lock required.");
  return session;
}

export const getGateState = createServerFn({ method: "GET" }).handler(async () => {
  const s = await settings();
  return {
    locked: s.locked,
    paidAccess: s.paidAccess,
    priceNgn: s.priceNgn,
    priceUsd: s.priceUsd,
    contactEmail: s.contactEmail,
    shareGuard: s.shareGuard,
  };
});

export const unlockAcademy = createServerFn({ method: "POST" })
  .validator(
    z.object({
      secret: z.string().min(1).max(80),
      deviceId: z.string().min(8).max(80).optional(),
      deviceKind: z.enum(["phone", "computer"]).optional(),
      timeZone: z.string().max(80).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const secret = data.secret.trim();
    const s = await settings();
    const sql = await getSql();
    if (hashPassword(secret) === s.adminPasswordHash) {
      throw new Error("The lock room opens only when you sign in with the official author Gmail.");
    }
    const code = secret.toUpperCase().replace(/\s+/g, "");
    const rows = await sql<CodeRow>`
      select code, status, paid, label, created_at, last_used_at, use_count, revoked_reason
      from access_codes where code = ${code}
    `;
    const row = rows[0];
    if (!row) {
      await logEvent(code, "failed_unlock");
      throw new Error("That code is not valid. If this book was shared with you, you need to pay for your own unique access code.");
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
    if (s.locked) throw new Error("The academy is locked by the author. Reading is paused.");
    const deviceId = (data.deviceId ?? "").trim();
    const deviceKind = asDeviceKind(data.deviceKind);
    const timeZone = (data.timeZone ?? "").trim();
    if (s.shareGuard && deviceId.length >= 8) {
      await enforceSeat({ code: row.code, deviceId, deviceKind, timeZone });
    }
    const token = newToken();
    const tokenHash = sha256(token);
    await sql`
      insert into sessions (token_hash, role, access_code, device_id, device_kind)
      values (${tokenHash}, ${"student"}, ${row.code}, ${deviceId}, ${deviceKind})
    `;
    await sql`update access_codes set last_used_at = now(), use_count = use_count + 1 where code = ${row.code}`;
    await logEvent(row.code, "student_unlock");
    return { ok: true, role: "student" as const, token, codeHint: maskCode(row.code) };
  });

export const getMe = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(8),
      deviceId: z.string().min(8).max(80).optional(),
      deviceKind: z.enum(["phone", "computer"]).optional(),
      timeZone: z.string().max(80).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireSession(data.token);
    if (session.role === "student" && session.accessCode && data.deviceId) {
      await enforceSeat({
        code: session.accessCode,
        deviceId: data.deviceId,
        deviceKind: asDeviceKind(data.deviceKind),
        timeZone: data.timeZone ?? "",
        tokenHash: sha256(data.token),
      });
    }
    return {
      role: session.role,
      codeHint: session.accessCode
        ? maskCode(session.accessCode)
        : session.role === "admin"
          ? "AUTHOR"
          : "TUTOR",
      locked: session.settings.locked,
      paidAccess: session.settings.paidAccess,
      priceNgn: session.settings.priceNgn,
      priceUsd: session.settings.priceUsd,
    };
  });

export const signOutSession = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`delete from sessions where token_hash = ${sha256(data.token)}`;
    return { ok: true };
  });

export const listCurriculum = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    const session = await requireSession(data.token);
    const sql = await getSql();
    let done = new Set<string>();
    if (session.accessCode) {
      const rows = await sql<ProgressRow>`select access_code, kind, item_key, done, payload from progress where access_code = ${session.accessCode} and kind = ${"chapter"}`;
      done = new Set(rows.filter((r) => asBool(r.done)).map((r) => r.item_key));
    }
    return {
      chapters: chapters.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        minutes: c.minutes,
        done: done.has(c.slug),
      })),
    };
  });

export type ChapterMeta = Awaited<ReturnType<typeof listCurriculum>>["chapters"][number];

export const getChapter = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8), slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireSession(data.token);
    const chapter = chapterBySlug(data.slug);
    if (!chapter) throw new Error("Chapter not found.");
    const safe = chapter;
    const nav = neighbors(data.slug);
    return { chapter: safe, prev: nav.prev, next: nav.next };
  });

export const listPrompts = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    await requireSession(data.token);
    return { prompts: PROMPT_LIBRARY };
  });

export const listRoadmap = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    await requireSession(data.token);
    return { days: ROADMAP_DAYS };
  });

export const saveProgress = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(8),
      kind: z.string().min(1).max(40),
      itemKey: z.string().min(1).max(80),
      done: z.boolean(),
      payload: z.string().max(8000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireSession(data.token);
    if (session.role !== "student" || !session.accessCode) return { ok: true };
    const sql = await getSql();
    const payload = data.payload ?? "{}";
    await sql`
      insert into progress (access_code, kind, item_key, done, payload, updated_at)
      values (${session.accessCode}, ${data.kind}, ${data.itemKey}, ${data.done}, ${payload}, now())
      on conflict (access_code, kind, item_key)
      do update set done = excluded.done, payload = excluded.payload, updated_at = now()
    `;
    return { ok: true };
  });

export const loadProgress = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8), kind: z.string().min(1).max(40) }))
  .handler(async ({ data }) => {
    const session = await requireSession(data.token);
    if (!session.accessCode) return { items: [] as { key: string; done: boolean; payload: string }[] };
    const sql = await getSql();
    const rows = await sql<ProgressRow>`select access_code, kind, item_key, done, payload from progress where access_code = ${session.accessCode} and kind = ${data.kind}`;
    return {
      items: rows.map((r) => ({ key: r.item_key, done: asBool(r.done), payload: r.payload })),
    };
  });

export const requestPaidAccess = createServerFn({ method: "POST" })
  .validator(
    z.object({
      paymentRef: z.string().min(4).max(80),
      note: z.string().max(200).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const s = await settings();
    if (s.locked) throw new Error("The academy is locked. New access is not being issued.");
    const sql = await getSql();
    const ref = data.paymentRef.trim();
    const note = (data.note ?? "").trim();
    await sql`insert into payment_requests (payment_ref, note) values (${ref}, ${note})`;
    await logEvent(null, "payment_request");
    return { ok: true };
  });

export const adminOverview = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    const s = await settings();
    const codes = await sql<CodeRow>`
      select code, status, paid, label, created_at, last_used_at, use_count, revoked_reason, replaced_by
      from access_codes order by created_at desc
    `;
    const requests = await sql<RequestRow>`select id, payment_ref, note, status, issued_code, created_at from payment_requests order by created_at desc limit 50`;
    const logs = await sql<{ id: number; access_code: string | null; event: string; created_at: string }>`
      select id, access_code, event, created_at from access_log order by created_at desc limit 30
    `;
    const active = codes.filter((c) => c.status === "active").length;
    const revoked = codes.filter((c) => c.status === "revoked").length;
    const pending = requests.filter((r) => r.status === "pending").length;
    return {
      locked: s.locked,
      paidAccess: s.paidAccess,
      priceNgn: s.priceNgn,
      priceUsd: s.priceUsd,
      stats: { active, revoked, pending, total: codes.length },
      codes: codes.map((c) => ({
        code: c.code,
        status: c.status,
        paid: asBool(c.paid),
        label: c.label,
        createdAt: String(c.created_at ?? ""),
        lastUsedAt: c.last_used_at ? String(c.last_used_at) : null,
        useCount: Number(c.use_count),
        revokedReason: c.revoked_reason ?? "",
        replacedBy: c.replaced_by ?? "",
      })),
      requests: requests.map((r) => ({
        id: Number(r.id),
        paymentRef: r.payment_ref,
        note: r.note,
        status: r.status,
        issuedCode: r.issued_code,
        createdAt: String(r.created_at ?? ""),
      })),
      logs: logs.map((l) => ({
        id: Number(l.id),
        accessCode: l.access_code,
        event: l.event,
        createdAt: String(l.created_at ?? ""),
      })),
    };
  });

export const setLock = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8), locked: z.boolean() }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    await sql`update academy_settings set locked = ${data.locked}, updated_at = now() where id = 1`;
    if (data.locked) {
      await sql`delete from sessions where role = ${"student"}`;
    }
    await logEvent(null, data.locked ? "locked" : "unlocked");
    return { ok: true, locked: data.locked };
  });

export const setPaidAccess = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8), paidAccess: z.boolean() }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    await sql`update academy_settings set paid_access = ${data.paidAccess}, updated_at = now() where id = 1`;
    return { ok: true, paidAccess: data.paidAccess };
  });

export const issueCodes = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(8),
      count: z.number().int().min(1).max(25),
      label: z.string().max(40).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    const label = (data.label ?? "").trim();
    const issued: string[] = [];
    for (let i = 0; i < data.count; i += 1) {
      let code = generateAccessCode();
      for (let n = 0; n < 8; n += 1) {
        const exists = await sql<{ code: string }>`select code from access_codes where code = ${code}`;
        if (!exists[0]) break;
        code = generateAccessCode();
      }
      await sql`insert into access_codes (code, paid, label) values (${code}, ${true}, ${label})`;
      issued.push(code);
    }
    await logEvent(null, `issued_${issued.length}`);
    return { codes: issued };
  });

export const revokeCode = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8), code: z.string().min(4) }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    await sql`update access_codes set status = ${"revoked"}, revoked_reason = ${"author"} where code = ${data.code}`;
    await sql`delete from sessions where access_code = ${data.code}`;
    await logEvent(data.code, "revoked");
    return { ok: true };
  });

export const restoreCode = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8), code: z.string().min(4) }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    await sql`update access_codes set status = ${"active"}, revoked_reason = ${""} where code = ${data.code}`;
    await sql`delete from code_seats where access_code = ${data.code}`;
    await logEvent(data.code, "restored");
    return { ok: true };
  });

async function attachIssuedCode(userId: string, code: string) {
  const uid = (userId ?? "").trim();
  const secret = (code ?? "").trim();
  if (!uid || !secret) return false;
  const sql = await getSql();
  const rows = await sql<{ role: string; bound_code: string; display_name: string; referred_by: string }>`
    select role, bound_code, display_name, referred_by from campus_profiles where user_id = ${uid}
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
  const referrerId = (p.referred_by ?? "").trim();
  if (referrerId && referrerId !== uid) {
    const dup = await sql<{ id: number }>`
      select id from earnings
      where kind = ${"referral"} and source_user_id = ${uid}
      limit 1
    `;
    if (!dup[0]) {
      const name = (p.display_name ?? "A student").trim() || "A student";
      try {
        await sql`
          insert into earnings (user_id, kind, amount_ngn, amount_usd, source_user_id, note)
          values (
            ${referrerId},
            ${"referral"},
            ${REFERRAL_NGN},
            ${REFERRAL_USD},
            ${uid},
            ${`20% when ${name} paid for the book`}
          )
        `;
      } catch {
        /* already credited */
      }
    }
  }
  await logEvent(secret, "student_bind");
  return true;
}

export const decidePayment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(8),
      id: z.number().int(),
      approve: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    if (!data.approve) {
      await sql`update payment_requests set status = ${"rejected"} where id = ${data.id}`;
      return { ok: true, issuedCode: null as string | null, attached: false };
    }
    const existing = await sql<{ issued_code: string | null; batch: string; user_id: string }>`
      select issued_code, batch, user_id from payment_requests where id = ${data.id}
    `;
    const row = existing[0];
    if (!row) throw new Error("That payment request was not found.");
    let code = (row.issued_code ?? "").trim();
    if (!code) {
      code = generateAccessCode();
      await sql`insert into access_codes (code, paid, label) values (${code}, ${true}, ${row.batch || "paid"})`;
      await logEvent(code, "paid_approved");
    }
    await sql`update payment_requests set status = ${"approved"}, issued_code = ${code} where id = ${data.id}`;
    const attached = await attachIssuedCode(row.user_id ?? "", code);
    return { ok: true, issuedCode: code, attached };
  });

export const changeAdminPassword = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(8),
      current: z.string().min(1).max(80),
      next: z.string().min(10).max(80),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const s = await settings();
    if (hashPassword(data.current) !== s.adminPasswordHash) {
      throw new Error("Current author password is incorrect.");
    }
    const sql = await getSql();
    await sql`update academy_settings set admin_password_hash = ${hashPassword(data.next)}, updated_at = now() where id = 1`;
    await logEvent(null, "password_changed");
    return { ok: true };
  });

type StudioRow = {
  id: number;
  access_code: string;
  work_kind: string;
  title: string;
  body: string;
  payload: string;
  submitted_at: string;
  rating: number | null;
  review: string;
  reviewed_at: string | null;
};

function mapStudio(row: StudioRow, label = "") {
  return {
    id: Number(row.id),
    accessCode: row.access_code,
    label,
    workKind: row.work_kind,
    title: row.title,
    body: row.body,
    payload: row.payload,
    submittedAt: String(row.submitted_at ?? ""),
    rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
    review: row.review ?? "",
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
  };
}

export const submitStudioWork = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(8),
      workKind: z.enum(["bible", "formula", "prompt"]),
      title: z.string().min(1).max(80),
      body: z.string().min(8).max(6000),
      payload: z.string().max(8000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireSession(data.token);
    if (session.role !== "student" || !session.accessCode) {
      throw new Error("Only students can send prompt work for rating.");
    }
    const sql = await getSql();
    const payload = data.payload ?? "{}";
    const rows = await sql<{ id: number }>`
      insert into studio_submissions (access_code, work_kind, title, body, payload)
      values (${session.accessCode}, ${data.workKind}, ${data.title.trim()}, ${data.body.trim()}, ${payload})
      returning id
    `;
    await logEvent(session.accessCode, "studio_submit");
    return { ok: true as const, id: Number(rows[0]?.id ?? 0) };
  });

export const myStudioWork = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    const session = await requireSession(data.token);
    if (!session.accessCode) return { submissions: [] as ReturnType<typeof mapStudio>[] };
    const sql = await getSql();
    const rows = await sql<StudioRow>`
      select id, access_code, work_kind, title, body, payload, submitted_at, rating, review, reviewed_at
      from studio_submissions
      where access_code = ${session.accessCode}
      order by submitted_at desc
      limit 40
    `;
    return { submissions: rows.map((r) => mapStudio(r)) };
  });

export const listStudioWork = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    const rows = await sql<StudioRow & { label: string | null }>`
      select s.id, s.access_code, s.work_kind, s.title, s.body, s.payload, s.submitted_at, s.rating, s.review, s.reviewed_at, c.label
      from studio_submissions s
      left join access_codes c on c.code = s.access_code
      order by (s.rating is null) desc, s.submitted_at desc
      limit 80
    `;
    return {
      submissions: rows.map((r) => mapStudio(r, r.label ?? "")),
      pending: rows.filter((r) => r.rating === null || r.rating === undefined).length,
    };
  });

export const rateStudioWork = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(8),
      id: z.number().int(),
      rating: z.number().int().min(1).max(5),
      review: z.string().max(800).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    const review = (data.review ?? "").trim();
    await sql`
      update studio_submissions
      set rating = ${data.rating}, review = ${review}, reviewed_at = now()
      where id = ${data.id}
    `;
    await logEvent(null, "studio_rated");
    return { ok: true as const };
  });

type MethodRow = {
  id: string;
  label: string;
  network: string;
  details: string;
  active: boolean;
  sort_order: number;
};

function mapMethod(row: MethodRow) {
  return {
    id: row.id,
    label: row.label,
    network: row.network,
    details: row.details,
    active: asBool(row.active),
    sortOrder: Number(row.sort_order),
  };
}

export const listPublicPayMethods = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<MethodRow>`
    select id, label, network, details, active, sort_order
    from payment_methods
    where active = true and details <> ${""}
    order by sort_order asc, label asc
  `;
  return { methods: rows.filter((r) => !isRetiredRail(r.id)).map(mapMethod) };
});

export const listPayMethodsAdmin = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    const rows = await sql<MethodRow>`
      select id, label, network, details, active, sort_order
      from payment_methods
      order by sort_order asc, label asc
    `;
    return { methods: rows.map(mapMethod) };
  });

export const savePayMethod = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(8),
      id: z.string().min(2).max(40),
      label: z.string().min(2).max(60),
      network: z.string().max(40).optional(),
      details: z.string().max(600),
      active: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
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

export const deletePayMethod = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8), id: z.string().min(2).max(40) }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    await sql`
      update payment_methods
      set active = false, details = ${""}, updated_at = now()
      where id = ${data.id}
    `;
    await logEvent(null, "pay_method_removed");
    return { ok: true as const };
  });

export const submitPaymentProof = createServerFn({ method: "POST" })
  .validator(
    z.object({
      methodId: z.string().min(2).max(40),
      paymentRef: z.string().min(4).max(120),
      note: z.string().max(200).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const s = await settings();
    if (s.locked) throw new Error("The academy is locked. New access is not being issued.");
    const sql = await getSql();
    const methods = await sql<MethodRow>`
      select id, label, network, details, active, sort_order from payment_methods where id = ${data.methodId}
    `;
    const method = methods[0];
    if (!method || !asBool(method.active) || !method.details.trim()) {
      throw new Error("That payment method is not available right now.");
    }
    const ref = data.paymentRef.trim();
    const note = (data.note ?? "").trim();
    await sql`
      insert into payment_requests (payment_ref, note, method, network)
      values (${ref}, ${note}, ${method.label}, ${method.network})
    `;
    await logEvent(null, "payment_proof");
    return { ok: true as const };
  });

export const listPaymentProofs = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    const rows = await sql<RequestRow & { method: string; network: string }>`
      select id, payment_ref, note, status, issued_code, created_at, method, network
      from payment_requests
      order by created_at desc
      limit 50
    `;
    return {
      requests: rows.map((r) => ({
        id: Number(r.id),
        paymentRef: r.payment_ref,
        note: r.note,
        status: r.status,
        issuedCode: r.issued_code,
        createdAt: String(r.created_at ?? ""),
        method: r.method ?? "",
        network: r.network ?? "",
      })),
    };
  });

export const getLiveChapter = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8), slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireSession(data.token);
    const sql = await getSql();
    const rows = await sql<ExampleOverride>`
      select example_key, slug, title, body from content_overrides where slug = ${data.slug}
    `;
    const chapter = liveChapterBySlug(data.slug, rows);
    if (!chapter) throw new Error("Chapter not found.");
    const nav = neighbors(data.slug);
    return { chapter, prev: nav.prev, next: nav.next };
  });

export const listLivePrompts = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    await requireSession(data.token);
    const sql = await getSql();
    const rows = await sql<ExampleOverride>`select example_key, slug, title, body from content_overrides`;
    const prompts = chapters.flatMap((ch) => {
      const live = mergeChapter(ch, rows.filter((r) => r.slug === ch.slug));
      return live.blocks
        .filter((b): b is Extract<typeof b, { kind: "prompt" }> => b.kind === "prompt")
        .map((b, i) => ({
          id: `${ch.slug}-${i}`,
          chapter: ch.id,
          title: b.title,
          text: b.text,
        }));
    });
    return { prompts };
  });

export const listExampleCatalog = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8), slug: z.string().max(80).optional() }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    const rows = await sql<ExampleOverride>`select example_key, slug, title, body from content_overrides`;
    const overridden = new Map(rows.map((r) => [r.example_key, r]));
    const items = catalogFor(data.slug).map((item) => {
      const o = overridden.get(item.key);
      return {
        ...item,
        liveTitle: o?.title || item.title,
        liveBody: o?.body || item.body,
        overridden: Boolean(o),
      };
    });
    return { items, chapters: chapters.map((c) => ({ slug: c.slug, title: c.title, id: c.id })) };
  });

export const saveExampleOverride = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(8),
      key: z.string().min(3).max(80),
      slug: z.string().min(1).max(80),
      title: z.string().max(120),
      body: z.string().min(1).max(8000),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    await sql`
      insert into content_overrides (example_key, slug, title, body, updated_at)
      values (${data.key}, ${data.slug}, ${data.title.trim()}, ${data.body.trim()}, now())
      on conflict (example_key)
      do update set title = excluded.title, body = excluded.body, slug = excluded.slug, updated_at = now()
    `;
    await logEvent(null, "example_updated");
    return { ok: true as const };
  });

export const resetExampleOverride = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8), key: z.string().min(3).max(80) }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    await sql`delete from content_overrides where example_key = ${data.key}`;
    await logEvent(null, "example_reset");
    return { ok: true as const };
  });

type WorkRow = {
  id: number;
  access_code: string;
  slug: string;
  title: string;
  tool: string;
  work_kind: string;
  prompt_text: string;
  notes: string;
  image_data: string;
  example_key: string;
  submitted_at: string;
  rating: number | null;
  review: string;
  reviewed_at: string | null;
};

function mapWork(row: WorkRow, label = "", mask = false) {
  return {
    id: Number(row.id),
    accessCode: mask ? maskCode(row.access_code) : row.access_code,
    label,
    slug: row.slug,
    title: row.title,
    tool: row.tool,
    workKind: row.work_kind,
    promptText: row.prompt_text,
    notes: row.notes,
    imageData: row.image_data,
    exampleKey: row.example_key,
    submittedAt: String(row.submitted_at ?? ""),
    rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
    review: row.review ?? "",
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
  };
}

export const saveChapterWork = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(8),
      slug: z.string().min(1).max(80),
      title: z.string().min(1).max(80),
      tool: z.string().min(1).max(40),
      workKind: z.enum(["image", "video", "prompt", "note"]),
      promptText: z.string().max(6000).optional(),
      notes: z.string().max(800).optional(),
      imageData: z.string().max(400000).optional(),
      exampleKey: z.string().max(80).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireSession(data.token);
    if (session.role !== "student" || !session.accessCode) {
      throw new Error("Only students can save recreations.");
    }
    const sql = await getSql();
    const rows = await sql<{ id: number }>`
      insert into chapter_work (
        access_code, slug, title, tool, work_kind, prompt_text, notes, image_data, example_key
      )
      values (
        ${session.accessCode},
        ${data.slug},
        ${data.title.trim()},
        ${data.tool.trim()},
        ${data.workKind},
        ${(data.promptText ?? "").trim()},
        ${(data.notes ?? "").trim()},
        ${data.imageData ?? ""},
        ${data.exampleKey ?? ""}
      )
      returning id
    `;
    await logEvent(session.accessCode, "chapter_work");
    return { ok: true as const, id: Number(rows[0]?.id ?? 0) };
  });

export const listMyChapterWork = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8), slug: z.string().max(80).optional() }))
  .handler(async ({ data }) => {
    const session = await requireSession(data.token);
    if (!session.accessCode) return { items: [] as ReturnType<typeof mapWork>[] };
    const sql = await getSql();
    const slug = data.slug ?? "";
    const rows = slug
      ? await sql<WorkRow>`
          select id, access_code, slug, title, tool, work_kind, prompt_text, notes, image_data, example_key, submitted_at, rating, review, reviewed_at
          from chapter_work
          where access_code = ${session.accessCode} and slug = ${slug}
          order by submitted_at desc
          limit 40
        `
      : await sql<WorkRow>`
          select id, access_code, slug, title, tool, work_kind, prompt_text, notes, image_data, example_key, submitted_at, rating, review, reviewed_at
          from chapter_work
          where access_code = ${session.accessCode}
          order by submitted_at desc
          limit 40
        `;
    return { items: rows.map((r) => mapWork(r)) };
  });

export const deleteChapterWork = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8), id: z.number().int() }))
  .handler(async ({ data }) => {
    const session = await requireSession(data.token);
    if (!session.accessCode) throw new Error("Only students can remove their recreations.");
    const sql = await getSql();
    await sql`delete from chapter_work where id = ${data.id} and access_code = ${session.accessCode}`;
    return { ok: true as const };
  });

export const listChapterWorkAdmin = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    const rows = await sql<WorkRow & { label: string | null }>`
      select w.id, w.access_code, w.slug, w.title, w.tool, w.work_kind, w.prompt_text, w.notes, w.image_data, w.example_key, w.submitted_at, w.rating, w.review, w.reviewed_at, c.label
      from chapter_work w
      left join access_codes c on c.code = w.access_code
      order by (w.rating is null) desc, w.submitted_at desc
      limit 80
    `;
    return {
      items: rows.map((r) => mapWork(r, r.label ?? "", true)),
      pending: rows.filter((r) => r.rating === null || r.rating === undefined).length,
    };
  });

export const rateChapterWork = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(8),
      id: z.number().int(),
      rating: z.number().int().min(1).max(5),
      review: z.string().max(800).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    const review = (data.review ?? "").trim();
    await sql`
      update chapter_work
      set rating = ${data.rating}, review = ${review}, reviewed_at = now()
      where id = ${data.id}
    `;
    await logEvent(null, "chapter_work_rated");
    return { ok: true as const };
  });

function toSignupRail(row: MethodRow): SignupRail {
  const seed = SIGNUP_RAILS.find((r) => r.id === row.id);
  const details = row.details.trim();
  const category = seed?.category ?? railCategory(row.id, row.network);
  const eth = extractEthAddress(details);
  const qrValue = category === "crypto" ? eth : "";
  const instructions =
    seed?.instructions ??
    (category === "skrill"
      ? [
          "Pay with a Visa or Mastercard (or your Skrill wallet) from anywhere in the world.",
          "Skrill opens their official checkout. The academy Skrill account is aiecosystemco@gmail.com.",
          "After you pay, come back and paste the Skrill transaction id or confirmation, then submit.",
        ]
      : category === "nft"
        ? [
            "Follow the NFT instructions the author listed.",
            "Paste the transaction or token id as your payment reference.",
          ]
        : [
            "Send only on the network shown. Funds sent on the wrong network can be lost.",
            "Paste the transaction hash as your payment reference.",
          ]);
  return {
    id: row.id,
    category,
    label: row.label,
    network: row.network,
    address: qrValue || (category === "skrill" ? details : "") || seed?.address || "",
    qrValue,
    details,
    instructions,
  };
}

export const listSignupRails = createServerFn({ method: "GET" }).handler(async () => {
  const s = await settings();
  const sql = await getSql();
  const rows = await sql<MethodRow>`
    select id, label, network, details, active, sort_order
    from payment_methods
    where active = true and details <> ${""}
    order by sort_order asc, label asc
  `;
  const rails = (rows.length > 0 ? rows.map(toSignupRail) : SIGNUP_RAILS).filter(
    (r) => !isRetiredRail(r.id),
  );
  return {
    rails: rails.length > 0 ? rails : SIGNUP_RAILS,
    batches: [...STUDENT_BATCHES],
    priceNgn: s.priceNgn,
    priceUsd: s.priceUsd,
  };
});

export const submitEnrollment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      studentName: z.string().min(2).max(80),
      phone: z.string().min(8).max(24),
      xHandle: z.string().min(1).max(40),
      batch: z.string().min(1).max(40),
      methodId: z.string().min(2).max(40),
      paymentRef: z.string().min(4).max(120),
      note: z.string().max(200).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const s = await settings();
    if (s.locked) throw new Error("The academy is locked. New access is not being issued.");
    if (isRetiredRail(data.methodId)) throw new Error("That payment method is not available right now.");
    if (!(STUDENT_BATCHES as readonly string[]).includes(data.batch)) {
      throw new Error("Choose a batch.");
    }
    const sql = await getSql();
    const methods = await sql<MethodRow>`
      select id, label, network, details, active, sort_order from payment_methods where id = ${data.methodId}
    `;
    const row = methods[0];
    const seed = SIGNUP_RAILS.find((r) => r.id === data.methodId);
    let method: { label: string; network: string } | null = null;
    if (row && asBool(row.active) && row.details.trim()) {
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
    const existing = await sql<{ id: number; status: string }>`
      select id, status from payment_requests
      where payment_ref = ${ref}
      order by created_at desc
      limit 1
    `;
    if (existing[0] && existing[0].status !== "pending") {
      throw new Error("That payment reference is already on file.");
    }
    if (existing[0]) {
      await sql`
        update payment_requests
        set note = ${note},
            method = ${method.label},
            network = ${method.network},
            student_name = ${name},
            phone = ${phone},
            x_handle = ${handle},
            batch = ${data.batch}
        where id = ${existing[0].id}
      `;
    } else {
      await sql`
        insert into payment_requests (payment_ref, note, method, network, student_name, phone, x_handle, batch, user_id)
        values (${ref}, ${note}, ${method.label}, ${method.network}, ${name}, ${phone}, ${handle}, ${data.batch}, ${""})
      `;
    }
    await logEvent(null, "enrollment");
    return { ok: true as const };
  });

export const listEnrollments = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    const rows = await sql<
      RequestRow & {
        method: string;
        network: string;
        student_name: string;
        phone: string;
        x_handle: string;
        batch: string;
        user_id: string;
        skrill_status: string;
      }
    >`
      select id, payment_ref, note, status, issued_code, created_at, method, network, student_name, phone, x_handle, batch, user_id, skrill_status
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
        issued: Boolean(r.issued_code),
        createdAt: String(r.created_at ?? ""),
        method: r.method ?? "",
        network: r.network ?? "",
        studentName: r.student_name ?? "",
        phone: r.phone ?? "",
        xHandle: r.x_handle ?? "",
        batch: r.batch ?? "",
        userId: r.user_id ?? "",
        skrillStatus: r.skrill_status ?? "",
        attached: Boolean((r.user_id ?? "").trim() && r.issued_code),
      })),
    };
  });

type PracticeToolRow = {
  id: string;
  name: string;
  category: string;
  blurb: string;
  web: string;
  ios: string;
  android: string;
  desktop: string;
  how: string;
  active: boolean;
  sort_order: number;
  updated_at: string | Date;
};

function mappedPracticeTools(rows: PracticeToolRow[]): PracticeTool[] {
  return rows.map(mapPracticeToolRow).filter((t): t is PracticeTool => t !== null);
}

function requireHttps(value: string, label: string) {
  const v = value.trim();
  if (!v) return "";
  if (!/^https:\/\//i.test(v)) throw new Error(`${label} must start with https://`);
  return v;
}

export const listLivePracticeTools = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    await requireSession(data.token);
    const sql = await getSql();
    const rows = await sql<PracticeToolRow>`
      select id, name, category, blurb, web, ios, android, desktop, how, active, sort_order, updated_at
      from practice_tools
      where active = true
      order by sort_order asc, name asc
    `;
    const tools = mappedPracticeTools(rows);
    return { tools: tools.length > 0 ? tools : PRACTICE_TOOLS.filter((t) => t.active !== false) };
  });

export const listPracticeToolsAdmin = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    const rows = await sql<PracticeToolRow>`
      select id, name, category, blurb, web, ios, android, desktop, how, active, sort_order, updated_at
      from practice_tools
      order by sort_order asc, name asc
    `;
    const tools = mappedPracticeTools(rows);
    return { tools: tools.length > 0 ? tools : PRACTICE_TOOLS };
  });

export const savePracticeTool = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(8),
      id: z.string().min(2).max(40),
      name: z.string().min(2).max(60),
      category: z.string().min(2).max(20),
      blurb: z.string().max(200),
      web: z.string().min(8).max(300),
      ios: z.string().max(300).optional(),
      android: z.string().max(300).optional(),
      desktop: z.string().max(300).optional(),
      how: z.string().max(300),
      active: z.boolean(),
      sortOrder: z.number().int().min(0).max(9999).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    if (!isToolCategory(data.category)) throw new Error("Pick a valid tool category.");
    const web = requireHttps(data.web, "Website");
    if (!web) throw new Error("Website is required.");
    const ios = requireHttps(data.ios ?? "", "iPhone app link");
    const android = requireHttps(data.android ?? "", "Android app link");
    const desktop = requireHttps(data.desktop ?? "", "Windows / Mac link");
    const sql = await getSql();
    const existing = await sql<{ id: string; sort_order: number }>`
      select id, sort_order from practice_tools where id = ${data.id}
    `;
    const sort = data.sortOrder ?? Number(existing[0]?.sort_order ?? 10);
    if (existing[0]) {
      await sql`
        update practice_tools
        set name = ${data.name.trim()},
            category = ${data.category},
            blurb = ${data.blurb.trim()},
            web = ${web},
            ios = ${ios},
            android = ${android},
            desktop = ${desktop},
            how = ${data.how.trim()},
            active = ${data.active},
            sort_order = ${sort},
            updated_at = now()
        where id = ${data.id}
      `;
    } else {
      await sql`
        insert into practice_tools (id, name, category, blurb, web, ios, android, desktop, how, active, sort_order, updated_at)
        values (
          ${data.id},
          ${data.name.trim()},
          ${data.category},
          ${data.blurb.trim()},
          ${web},
          ${ios},
          ${android},
          ${desktop},
          ${data.how.trim()},
          ${data.active},
          ${sort},
          now()
        )
      `;
    }
    await logEvent(null, "practice_tool_saved");
    return { ok: true as const };
  });

export const createPracticeTool = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(8),
      name: z.string().min(2).max(60),
      category: z.string().min(2).max(20),
      blurb: z.string().max(200),
      web: z.string().min(8).max(300),
      ios: z.string().max(300).optional(),
      android: z.string().max(300).optional(),
      desktop: z.string().max(300).optional(),
      how: z.string().max(300),
      active: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    if (!isToolCategory(data.category)) throw new Error("Pick a valid tool category.");
    const web = requireHttps(data.web, "Website");
    if (!web) throw new Error("Website is required.");
    const ios = requireHttps(data.ios ?? "", "iPhone app link");
    const android = requireHttps(data.android ?? "", "Android app link");
    const desktop = requireHttps(data.desktop ?? "", "Windows / Mac link");
    const sql = await getSql();
    let id = slugForTool(data.name);
    const clash = await sql<{ id: string }>`select id from practice_tools where id = ${id}`;
    if (clash[0]) id = `${id}-${Date.now().toString(36).slice(-4)}`;
    const max = await sql<{ m: number }>`select coalesce(max(sort_order), 0) as m from practice_tools`;
    const sort = Number(max[0]?.m ?? 0) + 10;
    await sql`
      insert into practice_tools (id, name, category, blurb, web, ios, android, desktop, how, active, sort_order, updated_at)
      values (
        ${id},
        ${data.name.trim()},
        ${data.category},
        ${data.blurb.trim()},
        ${web},
        ${ios},
        ${android},
        ${desktop},
        ${data.how.trim()},
        ${data.active},
        ${sort},
        now()
      )
    `;
    await logEvent(null, "practice_tool_created");
    return { ok: true as const, id };
  });

function validContactEmail(value: string) {
  const v = value.trim();
  if (!v) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.length > 120) {
    throw new Error("Enter a valid email.");
  }
  return v;
}

export const getSharePortal = createServerFn({ method: "GET" }).handler(async () => {
  const s = await settings();
  return { contactEmail: s.contactEmail };
});

export const submitReplacementRequest = createServerFn({ method: "POST" })
  .validator(
    z.object({
      incidentToken: z.string().max(40).optional(),
      studentName: z.string().min(2).max(80),
      studentEmail: z.string().min(5).max(120),
      note: z.string().max(400).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const email = validContactEmail(data.studentEmail);
    const name = data.studentName.trim();
    const note = (data.note ?? "").trim();
    const token = (data.incidentToken ?? "").trim();
    const sql = await getSql();
    await sql`
      insert into replacement_requests (incident_token, student_name, student_email, note)
      values (${token}, ${name}, ${email}, ${note})
    `;
    await logEvent(null, "replacement_request");
    return { ok: true as const };
  });

export const saveSecuritySettings = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(8),
      contactEmail: z.string().max(120),
      shareGuard: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const email = data.contactEmail.trim() ? validContactEmail(data.contactEmail) : "";
    const sql = await getSql();
    await sql`
      update academy_settings
      set contact_email = ${email}, share_guard = ${data.shareGuard}, updated_at = now()
      where id = 1
    `;
    await logEvent(null, "security_settings");
    return { ok: true as const, contactEmail: email, shareGuard: data.shareGuard };
  });

export const listShareInbox = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const s = await settings();
    const sql = await getSql();
    const incidents = await sql<{
      id: number;
      access_code: string;
      public_token: string;
      reason: string;
      created_at: string | Date;
      replacement_code: string;
      status: string;
      label: string | null;
    }>`
      select i.id, i.access_code, i.public_token, i.reason, i.created_at, i.replacement_code, i.status, c.label
      from share_incidents i
      left join access_codes c on c.code = i.access_code
      order by i.created_at desc
      limit 80
    `;
    const requests = await sql<{
      id: number;
      incident_token: string;
      student_name: string;
      student_email: string;
      note: string;
      status: string;
      created_at: string | Date;
    }>`
      select id, incident_token, student_name, student_email, note, status, created_at
      from replacement_requests
      order by created_at desc
      limit 80
    `;
    return {
      contactEmail: s.contactEmail,
      shareGuard: s.shareGuard,
      incidents: incidents.map((i) => ({
        id: Number(i.id),
        code: i.access_code,
        ref: i.public_token,
        reason: i.reason,
        createdAt: String(i.created_at ?? ""),
        replacementCode: i.replacement_code ?? "",
        status: i.status,
        label: i.label ?? "",
      })),
      requests: requests.map((r) => ({
        id: Number(r.id),
        ref: r.incident_token,
        studentName: r.student_name,
        studentEmail: r.student_email,
        note: r.note,
        status: r.status,
        createdAt: String(r.created_at ?? ""),
      })),
    };
  });

export const issueReplacementCode = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8), incidentId: z.number().int() }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      access_code: string;
      replacement_code: string;
      status: string;
      label: string | null;
    }>`
      select i.id, i.access_code, i.replacement_code, i.status, c.label
      from share_incidents i
      left join access_codes c on c.code = i.access_code
      where i.id = ${data.incidentId}
    `;
    const row = rows[0];
    if (!row) throw new Error("That incident was not found.");
    if (row.replacement_code) {
      return { ok: true as const, code: row.replacement_code, already: true };
    }
    let code = generateAccessCode();
    for (let n = 0; n < 8; n += 1) {
      const exists = await sql<{ code: string }>`select code from access_codes where code = ${code}`;
      if (!exists[0]) break;
      code = generateAccessCode();
    }
    const label = (row.label ?? "").trim() || "replacement";
    await sql`insert into access_codes (code, paid, label) values (${code}, ${true}, ${label})`;
    await sql`
      update share_incidents
      set replacement_code = ${code}, status = ${"replaced"}
      where id = ${row.id}
    `;
    await sql`
      update access_codes
      set replaced_by = ${code}
      where code = ${row.access_code}
    `;
    await sql`
      update replacement_requests
      set status = ${"replaced"}
      where incident_token in (
        select public_token from share_incidents where id = ${row.id}
      ) and status = ${"pending"}
    `;
    await logEvent(code, "replacement_issued");
    return { ok: true as const, code, already: false };
  });

export const keepCodeRemoved = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8), incidentId: z.number().int() }))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sql = await getSql();
    await sql`
      update share_incidents set status = ${"dismissed"} where id = ${data.incidentId}
    `;
    await logEvent(null, "share_dismissed");
    return { ok: true as const };
  });

