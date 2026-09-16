import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AcademyMark } from "@/components/academy-mark";
import { JoinWhatsApp } from "@/components/whatsapp-join";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordRecovery } from "@/lib/campus-api";
import { BOOK } from "@/lib/book-public";

export const Route = createFileRoute("/recover")({ component: Recover });

function Recover() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await requestPasswordRecovery({ data: { email } });
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start recovery.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-x-clip bg-bg">
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-start px-5 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] md:justify-center lg:max-w-6xl lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
        <div className="mb-8 text-center lg:mb-0 lg:text-left">
          <div className="mb-6 flex justify-center text-brass lg:justify-start">
            <AcademyMark size={72} />
          </div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-brass sm:tracking-[0.28em]">{BOOK.series}</p>
          <h1 className="font-display text-3xl tracking-tight lg:text-5xl">Password recovery</h1>
          <p className="mt-2 text-sm text-muted lg:max-w-sm lg:text-base">
            Use the email on this account from a phone or a computer. A private recovery link is issued for that address.
          </p>
        </div>
        <div className="w-full lg:max-w-md lg:justify-self-end">
        <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          {sent ? (
            <p className="text-sm leading-relaxed text-muted">
              If that email is on an account, the author will send a private recovery link to it. Check
              that inbox, including spam. The link works once.
            </p>
          ) : (
            <form onSubmit={(e) => void submit(e)} className="space-y-3">
              <label className="block text-xs uppercase tracking-wider text-muted">Email</label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
              />
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy ? "Please wait…" : "Send recovery to this email"}
              </Button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          <Link to="/login" className="inline-flex min-h-11 items-center text-brass underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
        <JoinWhatsApp className="mt-6" />
        </div>
      </div>
    </main>
  );
}
