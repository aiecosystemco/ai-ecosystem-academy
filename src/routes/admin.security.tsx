import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Copy, Mail, ShieldAlert } from "lucide-react";
import { Wordmark } from "@/components/academy-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  issueReplacementCode,
  keepCodeRemoved,
  listShareInbox,
  saveSecuritySettings,
} from "@/lib/academy-api";
import { useAcademySession } from "@/lib/use-academy";

export const Route = createFileRoute("/admin/security")({ component: SecurityPage });

type Inbox = Awaited<ReturnType<typeof listShareInbox>>;

function SecurityPage() {
  const { session, ready } = useAcademySession({ require: "admin" });
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [email, setEmail] = useState("");
  const [guard, setGuard] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    const r = await listShareInbox({ data: { token: session.token } });
    setInbox(r);
    setEmail(r.contactEmail);
    setGuard(r.shareGuard);
  }, [session]);

  useEffect(() => {
    if (session) void load().catch((err) => toast.error(err instanceof Error ? err.message : "Failed."));
  }, [session, load]);

  if (!ready || !session) {
    return <div className="grid min-h-dvh place-items-center bg-bg text-muted">Opening security…</div>;
  }

  const token = session.token;

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <Wordmark compact />
          <Button variant="ghost" size="sm" className="shrink-0" asChild>
            <Link to="/admin">
              <ArrowLeft className="size-4" />
              Lock room
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 pb-24">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-brass">Security</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight">One person per code</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            If a unique code is used by more than one person, it is removed. Drop the
            official ecosystem email here so they can ask you for a new code. You can
            generate a replacement, or leave the old one removed.
          </p>
        </div>

        <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-xl">Official email</h2>
          <p className="mt-1 text-sm text-muted">
            Students whose code was removed write here. This is the AI Ecosystem Academy address.
          </p>
          <Input
            className="mt-4"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="academy@example.com"
          />
          <label className="mt-4 flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={guard}
              onChange={(e) => setGuard(e.target.checked)}
              className="size-4"
            />
            Remove a code when a second person is detected
          </label>
          <Button
            className="mt-4"
            variant="outline"
            onClick={async () => {
              await saveSecuritySettings({ data: { token, contactEmail: email, shareGuard: guard } });
              toast.success("Security setting saved.");
              await load();
            }}
          >
            Save security setting
          </Button>
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl">Removed for sharing</h2>
          <div className="space-y-3">
            {(inbox?.incidents ?? []).length === 0 ? (
              <p className="rounded-xl bg-surface p-4 text-sm text-muted">No shared-code removals yet.</p>
            ) : (
              (inbox?.incidents ?? []).map((i) => (
                <article key={i.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm">{i.code}</p>
                      <p className="mt-1 text-xs text-muted">
                        Ref {i.ref}
                        {i.label ? ` · ${i.label}` : ""}
                        {i.status !== "open" ? ` · ${i.status}` : ""}
                      </p>
                      {i.replacementCode ? (
                        <p className="mt-2 font-mono text-sm text-ok">{i.replacementCode}</p>
                      ) : null}
                    </div>
                    {i.status === "open" ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            const r = await issueReplacementCode({ data: { token, incidentId: i.id } });
                            try {
                              await navigator.clipboard.writeText(r.code);
                              toast.success("New unique code copied — send it privately.");
                            } catch {
                              toast.success("New unique code created. Copy it from this card.");
                            }
                            await load();
                          }}
                        >
                          Issue new code
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await keepCodeRemoved({ data: { token, incidentId: i.id } });
                            await load();
                          }}
                        >
                          Keep removed
                        </Button>
                      </div>
                    ) : i.replacementCode ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await navigator.clipboard.writeText(i.replacementCode);
                          toast.success("Copied.");
                        }}
                      >
                        <Copy className="size-4" />
                        Copy new code
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl">Email loop</h2>
          <div className="space-y-3">
            {(inbox?.requests ?? []).length === 0 ? (
              <p className="rounded-xl bg-surface p-4 text-sm text-muted">No student messages yet.</p>
            ) : (
              (inbox?.requests ?? []).map((r) => (
                <article key={r.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                  <p className="text-sm font-medium">{r.studentName}</p>
                  <p className="mt-1 text-sm text-muted">{r.studentEmail}</p>
                  {r.ref ? <p className="mt-1 font-mono text-xs text-faint">Ref {r.ref}</p> : null}
                  {r.note ? <p className="mt-2 text-sm text-muted">{r.note}</p> : null}
                  <p className="mt-2 text-xs uppercase tracking-wider text-faint">{r.status}</p>
                  {inbox?.contactEmail ? (
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                      <a
                        href={`mailto:${r.studentEmail}?subject=${encodeURIComponent("AI Ecosystem Academy — unique code")}`}
                      >
                        <Mail className="size-4" />
                        Reply
                      </a>
                    </Button>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-faint">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
          A code may be used on one phone and one computer belonging to the same person. A
          second phone or a second computer is treated as another person.
        </p>
      </main>
    </div>
  );
}
