import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { skrillStatusLabel } from "@/lib/signup-rails";

/** Official Skrill Quick Checkout status_url. Always 200 so Skrill stops retrying. */
async function recordSkrill(request: Request) {
  let tx = "";
  let mb = "";
  let status = "";
  let from = "";
  try {
    const ctype = request.headers.get("content-type") ?? "";
    if (ctype.includes("application/x-www-form-urlencoded") || ctype.includes("multipart/form-data")) {
      const form = await request.formData();
      tx = String(form.get("transaction_id") ?? "").trim().slice(0, 120);
      mb = String(form.get("mb_transaction_id") ?? "").trim().slice(0, 80);
      status = String(form.get("status") ?? "").trim().slice(0, 8);
      from = String(form.get("pay_from_email") ?? "").trim().slice(0, 120);
    } else {
      const url = new URL(request.url);
      tx = (url.searchParams.get("transaction_id") ?? "").trim().slice(0, 120);
      mb = (url.searchParams.get("mb_transaction_id") ?? "").trim().slice(0, 80);
      status = (url.searchParams.get("status") ?? "").trim().slice(0, 8);
      from = (url.searchParams.get("pay_from_email") ?? "").trim().slice(0, 120);
    }
  } catch {
    return new Response("OK", { status: 200 });
  }
  if (!tx && !mb) return new Response("OK", { status: 200 });
  const label = skrillStatusLabel(status);
  const ref = tx || mb;
  const note = [from && `from ${from}`, mb && `Skrill ${mb}`].filter(Boolean).join(" · ");
  try {
    const sql = await getSql();
    const existing = await sql<{ id: number }>`
      select id from payment_requests
      where payment_ref = ${ref} or (skrill_mb_id <> ${""} and skrill_mb_id = ${mb})
      order by created_at desc
      limit 1
    `;
    if (existing[0]) {
      await sql`
        update payment_requests
        set skrill_status = ${label},
            skrill_mb_id = coalesce(nullif(${mb}, ${""}), skrill_mb_id),
            note = case when note = ${""} then ${note} else note end
        where id = ${existing[0].id}
      `;
    } else {
      await sql`
        insert into payment_requests (
          payment_ref, note, method, network, skrill_status, skrill_mb_id
        ) values (
          ${ref}, ${note}, ${"Skrill"}, ${"Card · worldwide"}, ${label}, ${mb}
        )
      `;
    }
  } catch {
    /* still 200 — Skrill retries on non-OK */
  }
  return new Response("OK", { status: 200 });
}

export const Route = createFileRoute("/api/skrill-status")({
  server: {
    handlers: {
      GET: ({ request }) => recordSkrill(request),
      POST: ({ request }) => recordSkrill(request),
    },
  },
});
