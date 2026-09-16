import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Ban,
  BookOpen,
  Check,
  Copy,
  Lock,
  LockOpen,
  MonitorSmartphone,
  PenLine,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Wordmark } from "@/components/academy-mark";
import { AuthorOnly } from "@/components/campus-shell";
import { JoinWhatsApp } from "@/components/whatsapp-join";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  adminOverview,
  changeAdminPassword,
  decidePayment,
  issueCodes,
  listEnrollments,
  listPayMethodsAdmin,
  listShareInbox,
  restoreCode,
  revokeCode,
  savePayMethod,
  deletePayMethod,
  saveSecuritySettings,
  setLock,
  setPaidAccess,
} from "@/lib/academy-api";
import { railSlug, visiblePayMethods } from "@/lib/signup-rails";
import { useAcademySession } from "@/lib/use-academy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inner =
    pathname !== "/admin" && pathname !== "/admin/" ? <Outlet /> : <AdminPage />;
  return <AuthorOnly>{inner}</AuthorOnly>;
}

type Overview = Awaited<ReturnType<typeof adminOverview>>;
type PayMethod = Awaited<ReturnType<typeof listPayMethodsAdmin>>["methods"][number];
type Enrollment = Awaited<ReturnType<typeof listEnrollments>>["requests"][number];

function AdminPage() {
  const { session, ready, leave } = useAcademySession({ require: "admin" });
  const [data, setData] = useState<Overview | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [methods, setMethods] = useState<PayMethod[]>([]);
  const [count, setCount] = useState(1);
  const [label, setLabel] = useState("");
  const [issued, setIssued] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [nextPw, setNextPw] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [shareGuard, setShareGuard] = useState(true);
  const [newRail, setNewRail] = useState({
    kind: "crypto" as "crypto" | "nft",
    label: "",
    network: "",
    details: "",
  });

  const load = useCallback(async () => {
    if (!session) return;
    const next = await adminOverview({ data: { token: session.token } });
    setData(next);
    const [pay, rails, security] = await Promise.all([
      listEnrollments({ data: { token: session.token } }).catch(() => ({ requests: [] as Enrollment[] })),
      listPayMethodsAdmin({ data: { token: session.token } }).catch(() => ({ methods: [] as PayMethod[] })),
      listShareInbox({ data: { token: session.token } }).catch(() => null),
    ]);
    setEnrollments(pay.requests);
    setMethods(rails.methods);
    if (security) {
      setContactEmail(security.contactEmail);
      setShareGuard(security.shareGuard);
    }
  }, [session]);

  useEffect(() => {
    if (session) void load().catch((err) => toast.error(err instanceof Error ? err.message : "Failed."));
  }, [session, load]);

  if (!ready || !session) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-muted">Opening lock room…</div>
    );
  }

  const token = session.token;
  const locked = data?.locked ?? false;

  async function toggleLock() {
    setBusy(true);
    try {
      const r = await setLock({ data: { token, locked: !locked } });
      toast.success(r.locked ? "Academy locked. All student sessions ended." : "Academy unlocked.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePaid() {
    if (!data) return;
    try {
      await setPaidAccess({ data: { token, paidAccess: !data.paidAccess } });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    }
  }

  async function mint() {
    setBusy(true);
    try {
      const r = await issueCodes({ data: { token, count, label } });
      setIssued(r.codes);
      toast.success(`${r.codes.length} unique code${r.codes.length === 1 ? "" : "s"} created.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-3 py-3 sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <Wordmark compact />
            <JoinWhatsApp compact />
          </div>
          <nav className="scroll-touch mt-2 flex gap-2 overflow-x-auto pb-1">
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link to="/admin/examples">
                <PenLine className="size-4" />
                Edit examples
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link to="/admin/tools">
                <MonitorSmartphone className="size-4" />
                Edit tools
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link to="/admin/security">
                <ShieldAlert className="size-4" />
                Code security
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link to="/learn/studio">
                <Sparkles className="size-4" />
                Rate student work
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link to="/learn">
                <BookOpen className="size-4" />
                Read as student
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="shrink-0" onClick={() => void leave()}>
              Leave
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 pb-24">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-brass">Author control</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight">Lock room</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            You control every unique student code. Lock the academy at any time.
            Shared links never open the book. If someone forwards a code, it is
            removed. Each unique code is for one person.
          </p>
        </div>

        <section
          className={cn(
            "rounded-xl p-6",
            locked ? "bg-danger/15 shadow-[0_0_0_1px_rgba(196,92,74,0.4)]" : "bg-surface shadow-[var(--shadow-border)]",
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Academy status</p>
              <p className="mt-1 font-display text-3xl">{locked ? "Locked" : "Open"}</p>
              <p className="mt-2 max-w-md text-sm text-muted">
                {locked
                  ? "Students cannot read. All active student sessions were ended. Unlock when you want the book available again."
                  : "Students with an active unique code can read. Hit lock to shut the book immediately."}
              </p>
            </div>
            <Button
              size="lg"
              variant={locked ? "primary" : "danger"}
              disabled={busy || !data}
              onClick={() => void toggleLock()}
              className="w-full sm:w-auto sm:min-w-44"
            >
              {locked ? <LockOpen className="size-4" /> : <Lock className="size-4" />}
              {locked ? "Unlock academy" : "Lock academy now"}
            </Button>
          </div>
        </section>

        {data ? (
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { k: "Active codes", v: data.stats.active },
              { k: "Revoked", v: data.stats.revoked },
              { k: "Pending payments", v: data.stats.pending },
              { k: "Paid wall", v: data.paidAccess ? "On" : "Off" },
            ].map((s) => (
              <div key={s.k} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <p className="text-[11px] uppercase tracking-wider text-muted">{s.k}</p>
                <p className="mt-1 font-display text-2xl tabular-nums">{s.v}</p>
              </div>
            ))}
          </section>
        ) : null}

        <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl">One person per code</h2>
              <p className="mt-1 text-sm text-muted">
                Official ecosystem email for students whose code was removed. A second
                person on the same code kicks that code out.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/admin/security">Open inbox</Link>
            </Button>
          </div>
          <Input
            className="mt-4"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="Official email"
          />
          <label className="mt-3 flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={shareGuard}
              onChange={(e) => setShareGuard(e.target.checked)}
              className="size-4"
            />
            Remove a code when a second person is detected
          </label>
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await saveSecuritySettings({
                  data: { token, contactEmail, shareGuard },
                });
                toast.success("Security setting saved.");
                await load();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed.");
              }
            }}
          >
            Save security setting
          </Button>
        </section>

        <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl">Paid access wall</h2>
              <p className="mt-1 text-sm text-muted">
                Visitors without a code must request paid access at ₦
                {data?.priceNgn.toLocaleString()} (US${data?.priceUsd}).
              </p>
            </div>
            <Button variant={data?.paidAccess ? "outline" : "primary"} onClick={() => void togglePaid()}>
              {data?.paidAccess ? "Turn wall off" : "Turn wall on"}
            </Button>
          </div>
        </section>

        <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-xl">Issue unique codes</h2>
          <p className="mt-1 text-sm text-muted">
            Give each student one code. If the book is shared, that code can be
            revoked and they must pay for a new one.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Input
              type="number"
              min={1}
              max={25}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(25, Number(e.target.value) || 1)))}
              className="sm:w-28"
            />
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Batch label (optional)"
            />
            <Button onClick={() => void mint()} disabled={busy}>
              <Plus className="size-4" />
              Generate
            </Button>
          </div>
          {issued.length > 0 ? (
            <div className="mt-4 rounded-lg bg-ink p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-brass">New codes — send privately</p>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted hover:text-fg"
                  onClick={async () => {
                    await navigator.clipboard.writeText(issued.join("\n"));
                    toast.success("Codes copied.");
                  }}
                >
                  <Copy className="size-3.5" />
                  Copy all
                </button>
              </div>
              <ul className="space-y-1 font-mono text-sm text-paper">
                {issued.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl">Practice tools</h2>
              <p className="mt-1 text-sm text-muted">
                ChatGPT, Grok, Gemini, Google Flow, and every other generator
                students open from Tools. Create new ones or update links and dates.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/admin/tools">
                <MonitorSmartphone className="size-4" />
                Create and update
              </Link>
            </Button>
          </div>
        </section>

        <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-xl">Payment rails</h2>
          <p className="mt-1 text-sm text-muted">
            Skrill is the only default — students pay by card worldwide to aiecosystemco@gmail.com.
            Add a crypto wallet or NFT rail here if you want extra options. Pasted addresses only;
            nothing is invented for you.
          </p>
          <div className="mt-4 space-y-4">
            {visiblePayMethods(methods).map((m) => (
              <PayMethodEditor
                key={m.id}
                method={m}
                token={token}
                onSaved={() => void load()}
              />
            ))}
          </div>
          <form
            className="mt-4 rounded-lg bg-raised p-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (newRail.label.trim().length < 2 || newRail.details.trim().length < 8) {
                toast.error("Add a label and paste the wallet or NFT details.");
                return;
              }
              const kind = newRail.kind;
              await savePayMethod({
                data: {
                  token,
                  id: railSlug(kind, newRail.label),
                  label: newRail.label.trim(),
                  network: newRail.network.trim() || (kind === "nft" ? "NFT" : "Crypto"),
                  details: newRail.details.trim(),
                  active: true,
                },
              });
              toast.success(kind === "nft" ? "NFT rail added." : "Crypto wallet added.");
              setNewRail({ kind, label: "", network: "", details: "" });
              await load();
            }}
          >
            <h3 className="text-sm font-medium">Add crypto wallet or NFT</h3>
            <div className="mt-3 flex rounded-md bg-surface p-1">
              {(["crypto", "nft"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setNewRail((r) => ({ ...r, kind }))}
                  className={`flex-1 rounded-sm py-2 text-sm capitalize ${
                    newRail.kind === kind ? "bg-raised text-fg" : "text-muted"
                  }`}
                >
                  {kind === "nft" ? "NFT" : "Crypto wallet"}
                </button>
              ))}
            </div>
            <Input
              className="mt-3"
              value={newRail.label}
              onChange={(e) => setNewRail((r) => ({ ...r, label: e.target.value }))}
              placeholder={newRail.kind === "nft" ? "Label — collection name" : "Label — USDT, BTC…"}
            />
            <Input
              className="mt-3"
              value={newRail.network}
              onChange={(e) => setNewRail((r) => ({ ...r, network: e.target.value }))}
              placeholder={newRail.kind === "nft" ? "Network or marketplace" : "Network — ETH, SOL, BTC…"}
            />
            <Textarea
              className="mt-3"
              rows={3}
              value={newRail.details}
              onChange={(e) => setNewRail((r) => ({ ...r, details: e.target.value }))}
              placeholder={
                newRail.kind === "nft"
                  ? "Paste collection / token instructions."
                  : "Paste the wallet address only."
              }
            />
            <Button className="mt-4" type="submit">
              {newRail.kind === "nft" ? "Add NFT rail" : "Add crypto wallet"}
            </Button>
          </form>
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl">Payment requests</h2>
          <div className="space-y-2">
            {enrollments.length === 0 ? (
              <p className="rounded-xl bg-surface p-4 text-sm text-muted">No payment requests yet.</p>
            ) : (
              enrollments.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    {r.studentName ? (
                      <p className="text-sm font-medium">{r.studentName}</p>
                    ) : null}
                    <p className="font-mono text-sm">{r.paymentRef}</p>
                    <p className="mt-1 text-xs text-muted">
                      {[
                        r.phone,
                        r.xHandle ? `@${r.xHandle.replace(/^@+/, "")}` : "",
                        r.batch,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {r.status}
                      {r.skrillStatus ? ` · Skrill ${r.skrillStatus}` : ""}
                      {r.userId ? " · signed-in account" : ""}
                      {r.method ? ` · ${r.method}` : ""}
                      {r.network ? ` · ${r.network}` : ""}
                      {r.note ? ` · ${r.note}` : ""}
                      {r.issued ? " · issued" : ""}
                      {r.attached ? " · class on their account" : ""}
                    </p>
                  </div>
                  {r.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            const res = await decidePayment({ data: { token, id: r.id, approve: true } });
                            if (res.issuedCode) {
                              try {
                                await navigator.clipboard.writeText(res.issuedCode);
                                toast.success(
                                  res.attached
                                    ? "Class opened on their account. Unique code copied as a private backup."
                                    : "Approved. Unique code copied — send it privately.",
                                );
                              } catch {
                                toast.success(
                                  res.attached
                                    ? "Class opened on their account."
                                    : "Approved. Unique code issued — copy it from the list below.",
                                );
                              }
                            }
                            await load();
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Failed.");
                          }
                        }}
                      >
                        <Check className="size-4" />
                        Approve & issue
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await decidePayment({ data: { token, id: r.id, approve: false } });
                          await load();
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl">All access codes</h2>
            <Button variant="ghost" size="sm" onClick={() => void load()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Uses</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {(data?.codes ?? []).map((c) => (
                  <tr key={c.code} className="border-t border-line">
                    <td className="px-4 py-3 font-mono text-[13px]">
                      {c.code}
                      {c.label ? <span className="ml-2 font-sans text-xs text-faint">· {c.label}</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className={c.status === "active" ? "text-ok" : "text-danger"}>
                        {c.revokedReason === "shared" ? "removed · shared" : c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">{c.useCount}</td>
                    <td className="px-4 py-3 text-right">
                      {c.status === "active" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await revokeCode({ data: { token, code: c.code } });
                            toast.success("Code revoked.");
                            await load();
                          }}
                        >
                          <Ban className="size-4" />
                          Revoke
                        </Button>
                      ) : c.revokedReason === "shared" ? (
                        <Button size="sm" variant="ghost" asChild>
                          <Link to="/admin/security">Replacement</Link>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await restoreCode({ data: { token, code: c.code } });
                            await load();
                          }}
                        >
                          Restore
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {data && data.codes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-sm text-muted">
                      No codes yet. Generate the first batch above.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-xl">Change author password</h2>
          <p className="mt-1 text-sm text-muted">
            Use a long password only you know. After changing it, keep it private.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Current password"
            />
            <Input
              type="password"
              value={nextPw}
              onChange={(e) => setNextPw(e.target.value)}
              placeholder="New password (10+ characters)"
            />
          </div>
          <Button
            className="mt-4"
            variant="outline"
            onClick={async () => {
              try {
                await changeAdminPassword({ data: { token, current: currentPw, next: nextPw } });
                setCurrentPw("");
                setNextPw("");
                toast.success("Author password updated.");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed.");
              }
            }}
          >
            Update password
          </Button>
        </section>
      </main>
    </div>
  );
}

function PayMethodEditor({
  method,
  token,
  onSaved,
}: {
  method: PayMethod;
  token: string;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(method.label);
  const [network, setNetwork] = useState(method.network);
  const [details, setDetails] = useState(method.details);
  const [active, setActive] = useState(method.active);

  useEffect(() => {
    setLabel(method.label);
    setNetwork(method.network);
    setDetails(method.details);
    setActive(method.active);
  }, [method]);

  return (
    <div className="rounded-lg bg-raised p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="Network" />
      </div>
      <Textarea
        className="mt-3"
        rows={3}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Wallet address or NFT details"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="inline-flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="size-4"
          />
          Show on paid-access page
        </label>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await savePayMethod({
              data: { token, id: method.id, label, network, details, active },
            });
            toast.success("Payment rail saved.");
            onSaved();
          }}
        >
          Save rail
        </Button>
        {method.id === "skrill" ? null : (
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await deletePayMethod({ data: { token, id: method.id } });
              toast.success("Rail removed from the pay page.");
              onSaved();
            }}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

