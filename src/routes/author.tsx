import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { CampusShell } from "@/components/campus-shell";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  assignTutor,
  decideCampusEnrollment,
  issueCampusCodes,
  issueRecoveryLink,
  listAuthorCampus,
  listCampusEnrollments,
  openClassSession,
  promoteToTutor,
  removeCampusPayMethod,
  replaceStudentCode,
  saveCampusPayMethod,
  updateAuthorEmail,
  updateAuthorKey,
} from "@/lib/campus-api";
import { railSlug, visiblePayMethods } from "@/lib/signup-rails";
import { isPhoneReplaced, seatPayload } from "@/lib/seat-guard";
import { writeSession } from "@/lib/session-client";
import { useCampus } from "@/lib/use-campus";

export const Route = createFileRoute("/author")({ component: AuthorLayout });

function AuthorLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/author" && pathname !== "/author/") return <Outlet />;
  return <AuthorPage />;
}

function AuthorPage() {
  return (
    <CampusShell require="author">
      <AuthorLock />
    </CampusShell>
  );
}

async function copyPrivately(value: string, ok: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(ok);
  } catch {
    toast.success("Copy it from the box below and send it privately.");
  }
}

function hintCode(code: string) {
  if (code.length < 8) return "AEA-****";
  return `${code.slice(0, 3)}-****-${code.slice(-4)}`;
}

function AuthorLock() {
  const { refresh } = useCampus();
  const navigate = useNavigate();
  const [data, setData] = useState<Awaited<ReturnType<typeof listAuthorCampus>> | null>(null);
  const [enrollments, setEnrollments] = useState<
    Awaited<ReturnType<typeof listCampusEnrollments>>["requests"]
  >([]);
  const [email, setEmail] = useState("");
  const [currentKey, setCurrentKey] = useState("");
  const [nextKey, setNextKey] = useState("");
  const [newRail, setNewRail] = useState({
    kind: "crypto" as "crypto" | "nft",
    label: "",
    network: "",
    details: "",
  });
  const [count, setCount] = useState(1);
  const [label, setLabel] = useState("");
  const [issued, setIssued] = useState<string[]>([]);
  const [freshCodes, setFreshCodes] = useState<Record<number, string>>({});
  const [busyIssue, setBusyIssue] = useState(false);
  const [openingLock, setOpeningLock] = useState(false);
  const [attachCode, setAttachCode] = useState<Record<string, string>>({});
  const [promoteBatch, setPromoteBatch] = useState<Record<string, string>>({});
  const [freshRecovery, setFreshRecovery] = useState<Record<number, string>>({});

  async function load() {
    const next = await listAuthorCampus();
    setData(next);
    setEmail(next.contactEmail);
    const pay = await listCampusEnrollments().catch(() => ({ requests: [] as typeof enrollments }));
    setEnrollments(pay.requests);
  }

  useEffect(() => {
    void load().catch((err) => toast.error(err instanceof Error ? err.message : "Could not open author lock."));
    const id = window.setInterval(() => void load().catch(() => undefined), 10000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    void openClassSession({ data: seatPayload() })
      .then((opened) => writeSession({ token: opened.token, role: opened.role, codeHint: opened.codeHint }))
      .catch(() => undefined);
  }, []);

  async function openFullLock() {
    setOpeningLock(true);
    try {
      const opened = await openClassSession({ data: seatPayload() });
      writeSession({ token: opened.token, role: opened.role, codeHint: opened.codeHint });
      navigate({ to: "/admin" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not open the lock room.";
      if (isPhoneReplaced(message)) {
        navigate({ to: "/phone-replaced" });
        return;
      }
      toast.error(message);
    } finally {
      setOpeningLock(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-brass">CEO lock</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight">Author</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Official email is how this academy recognizes you. Issue unique codes, approve payment,
            change anyone's code, make tutors from sign-ups or from students who already have a code,
            and add crypto or NFT rails beside Skrill.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void openFullLock()} disabled={openingLock}>
            {openingLock ? "Opening…" : "Full lock room"}
          </Button>
          <Button asChild variant="outline">
            <Link to="/author/whatsapp">
              <MessageCircle className="size-4" />
              WhatsApp desk
            </Link>
          </Button>
        </div>
      </div>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Issue unique codes</h2>
        <p className="mt-1 text-sm text-muted">
          New codes appear once so you can send them privately. They are not listed again.
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
          <Button
            disabled={busyIssue}
            onClick={async () => {
              setBusyIssue(true);
              try {
                const r = await issueCampusCodes({ data: { count, label } });
                setIssued(r.codes);
                toast.success(`${r.codes.length} unique code${r.codes.length === 1 ? "" : "s"} created.`);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not issue codes.");
              } finally {
                setBusyIssue(false);
              }
            }}
          >
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
                onClick={() => void copyPrivately(issued.join("\n"), "Codes copied — send privately.")}
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

      <section>
        <h2 className="mb-3 font-display text-xl">Payment requests</h2>
        {enrollments.length === 0 ? (
          <p className="rounded-xl bg-surface p-4 text-sm text-muted">No payment requests yet.</p>
        ) : (
          <div className="space-y-2">
            {enrollments.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  {r.studentName ? <p className="text-sm font-medium">{r.studentName}</p> : null}
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
                    {r.hasCode ? " · issued" : ""}
                    {r.attached ? " · class on their account" : ""}
                  </p>
                  {freshCodes[r.id] ? (
                    <p className="mt-2 font-mono text-sm text-brass">{freshCodes[r.id]}</p>
                  ) : null}
                </div>
                {r.status === "pending" ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const res = await decideCampusEnrollment({ data: { id: r.id, approve: true } });
                          if (res.code) {
                            setFreshCodes((m) => ({ ...m, [r.id]: res.code as string }));
                            if (res.attached) {
                              await copyPrivately(
                                res.code,
                                "Class opened on their account. Unique code copied as a private backup.",
                              );
                            } else {
                              await copyPrivately(res.code, "Approved. Unique code copied — send it privately.");
                            }
                          } else {
                            toast.success(res.attached ? "Class opened on their account." : "Approved.");
                          }
                          await load();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Could not approve.");
                        }
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await decideCampusEnrollment({ data: { id: r.id, approve: false } });
                          toast.success("Request rejected.");
                          await load();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Could not reject.");
                        }
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <form
          className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const r = await updateAuthorEmail({ data: { email } });
              toast.success(`Official email is now ${r.email}.`);
              await refresh();
              await load();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not change email.");
            }
          }}
        >
          <h2 className="font-display text-xl">Official email</h2>
          <p className="mt-1 text-sm text-muted">Signing in with this address opens the author lock automatically.</p>
          <Input className="mt-4" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button className="mt-4" type="submit">
            Save email
          </Button>
        </form>
        <form
          className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await updateAuthorKey({ data: { current: currentKey, next: nextKey } });
              setCurrentKey("");
              setNextKey("");
              toast.success("Author key updated.");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not change the key.");
            }
          }}
        >
          <h2 className="font-display text-xl">Private class key</h2>
          <p className="mt-1 text-sm text-muted">The author password that opens every class from this lock.</p>
          <Input
            className="mt-4"
            type="password"
            value={currentKey}
            onChange={(e) => setCurrentKey(e.target.value)}
            placeholder="Current key"
          />
          <Input
            className="mt-3"
            type="password"
            value={nextKey}
            onChange={(e) => setNextKey(e.target.value)}
            placeholder="New key (10+ characters)"
            minLength={10}
          />
          <Button className="mt-4" type="submit">
            Change key
          </Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl">Assign tutors</h2>
        <p className="mb-3 text-sm text-muted">
          After you sign in with the official Gmail, pick people who signed up as tutor, or promote a
          student who already holds a unique code. You can attach an unused unique code to a tutor
          so they can also open the book.
        </p>
        {data?.tutors.length === 0 ? (
          <p className="rounded-xl bg-surface p-4 text-sm text-muted">
            No one has signed up as tutor yet. Promote a student below, or wait for a tutor sign-up.
          </p>
        ) : (
          <div className="space-y-2">
            {data?.tutors.map((t) => (
              <div
                key={t.userId}
                className="flex flex-col gap-2 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="font-mono text-xs text-faint">
                    {t.bound ? t.codeHint : "No unique code yet"}
                  </p>
                </div>
                <select
                  value={t.assignedBatch}
                  onChange={async (e) => {
                    await assignTutor({ data: { userId: t.userId, batch: e.target.value } });
                    toast.success("Tutor assigned.");
                    await load();
                  }}
                  className="h-11 w-full min-h-11 rounded-md bg-raised px-3 text-base text-fg shadow-[var(--shadow-border)] sm:w-auto"
                >
                  <option value="">Unassigned</option>
                  {data.batches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                {!t.bound ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      value={attachCode[t.userId] ?? ""}
                      onChange={(e) => setAttachCode((m) => ({ ...m, [t.userId]: e.target.value }))}
                      className="h-11 w-full min-h-11 rounded-md bg-raised px-3 text-base text-fg shadow-[var(--shadow-border)] sm:w-auto"
                    >
                      <option value="">Unused unique code</option>
                      {(data.unusedCodes ?? []).map((c) => (
                        <option key={c.code} value={c.code}>
                          {(c.label || "Unused") + " · " + hintCode(c.code)}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!attachCode[t.userId]}
                      onClick={async () => {
                        try {
                          await promoteToTutor({
                            data: {
                              userId: t.userId,
                              batch: t.assignedBatch || t.batch,
                              unusedCode: attachCode[t.userId],
                            },
                          });
                          toast.success("Unique code attached. Tutor can open the book.");
                          setAttachCode((m) => ({ ...m, [t.userId]: "" }));
                          await load();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Could not attach.");
                        }
                      }}
                    >
                      Attach code
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
        <h3 className="mt-6 mb-2 text-sm font-medium">Make tutor from students with a unique code</h3>
        {(data?.students ?? []).filter((st) => st.bound).length === 0 ? (
          <p className="rounded-xl bg-surface p-4 text-sm text-muted">
            No students with a unique code yet.
          </p>
        ) : (
          <div className="space-y-2">
            {(data?.students ?? [])
              .filter((st) => st.bound)
              .map((st) => (
                <div
                  key={st.userId}
                  className="flex flex-col gap-2 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{st.name}</p>
                    <p className="font-mono text-xs text-faint">
                      {st.codeHint} · {st.batch || "No batch"}
                    </p>
                  </div>
                  <select
                    value={promoteBatch[st.userId] ?? st.batch}
                    onChange={(e) => setPromoteBatch((m) => ({ ...m, [st.userId]: e.target.value }))}
                    className="h-11 w-full min-h-11 rounded-md bg-raised px-3 text-base text-fg shadow-[var(--shadow-border)] sm:w-auto"
                  >
                    {data?.batches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await promoteToTutor({
                          data: {
                            userId: st.userId,
                            batch: promoteBatch[st.userId] || st.batch || "Cohort 1",
                          },
                        });
                        toast.success("That student is now a tutor.");
                        await load();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Could not promote.");
                      }
                    }}
                  >
                    Make tutor
                  </Button>
                </div>
              ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl">People with unique codes</h2>
        <p className="mb-3 text-sm text-muted">
          Everyone who holds a unique code, split by who is online right now. Tutors never see this list.
          Issuing a replacement shows the new code once so you can send it privately.
        </p>
        {(() => {
          const holders = (data?.students ?? []).filter((st) => st.bound);
          const online = holders.filter((st) => st.online);
          const offline = holders.filter((st) => !st.online);
          if (holders.length === 0) {
            return (
              <p className="rounded-xl bg-surface p-4 text-sm text-muted">No unique codes on student accounts yet.</p>
            );
          }
          function StudentRow(st: (typeof holders)[number]) {
            return (
              <div
                key={st.userId}
                className="flex flex-col gap-2 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span
                      className={`size-2 shrink-0 rounded-full ${st.online ? "bg-ok" : "bg-faint"}`}
                    />
                    {st.name}
                    <span className="text-[11px] uppercase tracking-wider text-faint">
                      {st.inClass ? "In class" : st.online ? "Online" : "Offline"}
                    </span>
                  </p>
                  <p className="font-mono text-xs text-faint">
                    {st.codeHint || "No code"} · {st.batch || "No batch"} · grade {st.grade ?? 0}%
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      const r = await replaceStudentCode({ data: { userId: st.userId } });
                      await copyPrivately(r.code, "New unique code copied — send it privately.");
                      await load();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not replace.");
                    }
                  }}
                >
                  Issue new code
                </Button>
              </div>
            );
          }
          return (
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-medium text-ok">Online · {online.length}</h3>
                <div className="space-y-2">
                  {online.length === 0 ? (
                    <p className="rounded-xl bg-surface p-4 text-sm text-muted">No one online.</p>
                  ) : (
                    online.map((st) => StudentRow(st))
                  )}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted">Offline · {offline.length}</h3>
                <div className="space-y-2">
                  {offline.length === 0 ? (
                    <p className="rounded-xl bg-surface p-4 text-sm text-muted">Everyone with a code is online.</p>
                  ) : (
                    offline.map((st) => StudentRow(st))
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl">Password recovery</h2>
        <p className="mb-3 text-sm text-muted">
          Students request a reset with the email on their account. Copy the private link and send it to that
          email. It works once.
        </p>
        {(data?.recoveries ?? []).filter((r) => !r.used).length === 0 ? (
          <p className="rounded-xl bg-surface p-4 text-sm text-muted">No open recovery requests.</p>
        ) : (
          <div className="space-y-2">
            {(data?.recoveries ?? [])
              .filter((r) => !r.used)
              .map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-2 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{r.email}</p>
                    <p className="text-xs text-muted">Requested {r.createdAt ? String(r.createdAt).slice(0, 16) : ""}</p>
                    {freshRecovery[r.id] ? (
                      <p className="mt-2 break-all font-mono text-xs text-brass">{freshRecovery[r.id]}</p>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const issued = await issueRecoveryLink({ data: { id: r.id } });
                        const origin = window.location.origin;
                        const href = `${origin}/reset-password?token=${issued.token}`;
                        setFreshRecovery((m) => ({ ...m, [r.id]: href }));
                        await copyPrivately(href, "Recovery link copied — send it to that email.");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Could not issue recovery.");
                      }
                    }}
                  >
                    Copy recovery link
                  </Button>
                </div>
              ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl">Replacement inbox</h2>
        {data?.replacements.length === 0 ? (
          <p className="rounded-xl bg-surface p-4 text-sm text-muted">No requests.</p>
        ) : (
          <div className="space-y-2">
            {data?.replacements.map((r) => (
              <div key={r.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <p className="text-sm font-medium">
                  {r.name} · {r.email}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {r.status} · {r.note}
                </p>
                {r.userId && r.status === "pending" ? (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={async () => {
                      const issued = await replaceStudentCode({ data: { userId: r.userId } });
                      await copyPrivately(issued.code, "Replacement copied — send it privately.");
                      await load();
                    }}
                  >
                    Issue replacement
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 font-display text-xl">Payment rails</h2>
        <p className="mb-3 text-sm text-muted">
          Skrill is the default so students can pay by card worldwide. Add a crypto wallet or an NFT
          option if you want extra rails — paste the real address yourself. Do not republish old
          bank or Paga lines.
        </p>
        <div className="space-y-3">
          {visiblePayMethods(data?.methods ?? []).map((m) => (
            <PayEditor key={m.id} method={m} onSaved={() => void load()} />
          ))}
        </div>
        <form
          className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
          onSubmit={async (e) => {
            e.preventDefault();
            if (newRail.label.trim().length < 2 || newRail.details.trim().length < 8) {
              toast.error("Add a label and paste the wallet or NFT details. Nothing is prefilled.");
              return;
            }
            const kind = newRail.kind;
            await saveCampusPayMethod({
              data: {
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
          <div className="mt-3 flex rounded-md bg-raised p-1">
            {(["crypto", "nft"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setNewRail((r) => ({ ...r, kind }))}
                className={`flex-1 rounded-sm py-2 text-sm capitalize ${
                  newRail.kind === kind ? "bg-surface text-fg" : "text-muted"
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
                ? "Paste collection / token instructions. Nothing is filled in for you."
                : "Paste the wallet address only. Nothing is filled in for you."
            }
          />
          <Button className="mt-4" type="submit">
            {newRail.kind === "nft" ? "Add NFT rail" : "Add crypto wallet"}
          </Button>
        </form>
      </section>
    </div>
  );
}

function PayEditor({
  method,
  onSaved,
}: {
  method: { id: string; label: string; network: string; details: string; active: boolean };
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
    <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
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
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="inline-flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4" />
          Show on pay page
        </label>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await saveCampusPayMethod({ data: { id: method.id, label, network, details, active } });
            toast.success("Rail saved.");
            onSaved();
          }}
        >
          Save
        </Button>
        {method.id === "skrill" ? null : (
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await removeCampusPayMethod({ data: { id: method.id } });
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
