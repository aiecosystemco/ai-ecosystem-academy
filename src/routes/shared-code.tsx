import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AcademyMark } from "@/components/academy-mark";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { getSharePortal, submitReplacementRequest } from "@/lib/academy-api";
import { BOOK } from "@/lib/book-public";
import { readKickRef } from "@/lib/seat-guard";

export const Route = createFileRoute("/shared-code")({ component: SharedCodePage });

function SharedCodePage() {
  const [email, setEmail] = useState("");
  const [ref, setRef] = useState("");
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRef(readKickRef());
    void getSharePortal()
      .then((r) => setEmail(r.contactEmail))
      .catch(() => undefined);
  }, []);

  const mailto = email
    ? `mailto:${email}?subject=${encodeURIComponent("AI Ecosystem Academy — new unique code")}&body=${encodeURIComponent(
        `Ref: ${ref || "(none)"}\n\nMy unique code was removed because it was used by more than one person. Please issue a new code for me only.\n`,
      )}`
    : "";

  return (
    <div className="relative grid min-h-dvh place-items-start overflow-x-clip bg-bg px-5 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] md:place-items-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(800px 400px at 50% -10%, rgba(196,92,74,0.16), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-5 flex justify-center text-danger">
            <AcademyMark size={48} />
          </div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-danger">Access removed</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">One person only</h1>
        </div>

        <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="flex items-start gap-2 text-sm leading-relaxed">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" />
            This unique code was used by more than one person. It has been removed.
          </p>
          {ref ? <p className="mt-3 font-mono text-xs text-muted">Ref {ref}</p> : null}

          {sent ? (
            <p className="mt-5 text-sm text-muted">
              Message sent to {BOOK.author}. Wait for a new unique code by email. Do not share it.
            </p>
          ) : (
            <form
              className="mt-5 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setBusy(true);
                void submitReplacementRequest({
                  data: {
                    incidentToken: ref || undefined,
                    studentName: name,
                    studentEmail: from,
                    note,
                  },
                })
                  .then(() => {
                    setSent(true);
                    toast.success("Request sent to the author.");
                  })
                  .catch((err) => toast.error(err instanceof Error ? err.message : "Could not send."))
                  .finally(() => setBusy(false));
              }}
            >
              <p className="text-sm text-muted">Ask {BOOK.author} for a new unique code. It will be for you only.</p>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
              <Input
                type="email"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="Your email"
                required
              />
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note"
              />
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                <Mail className="size-4" />
                {busy ? "Sending…" : "Email the author"}
              </Button>
              {mailto ? (
                <Button variant="outline" className="w-full" asChild>
                  <a href={mailto}>Open your mail app</a>
                </Button>
              ) : null}
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-faint">
          <Link to="/" className="text-muted underline-offset-4 hover:underline">
            Back
          </Link>
        </p>
      </div>
    </div>
  );
}
