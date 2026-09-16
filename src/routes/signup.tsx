import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AcademyMark } from "@/components/academy-mark";
import { JoinWhatsApp } from "@/components/whatsapp-join";
import { EmailAuthForm, ProviderButtons } from "@/components/auth-panel";
import { Input } from "@/components/ui/input";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { BOOK } from "@/lib/book-public";
import { writeOnboardDraft } from "@/lib/onboard-draft";
import { STUDENT_BATCHES } from "@/lib/signup-rails";

export const Route = createFileRoute("/signup")({ component: Signup });

function Signup() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [referral, setReferral] = useState("");
  const [batch, setBatch] = useState<(typeof STUDENT_BATCHES)[number]>("Cohort 1");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (ready && !isPending && user) return <Navigate to="/home" />;

  function persist() {
    if (displayName.trim().length < 2) {
      toast.error("Add the name that becomes your referral code.");
      return false;
    }
    writeOnboardDraft({ role: "student", displayName: displayName.trim(), referral: referral.trim(), batch });
    return true;
  }

  return (
    <main className="relative min-h-dvh overflow-x-clip bg-bg">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(800px 400px at 50% -10%, rgba(184,154,98,0.18), transparent 60%)",
        }}
      />
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-start px-5 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] md:justify-center lg:max-w-6xl lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
        <div className="mb-8 text-center lg:mb-0 lg:text-left">
          <div className="mb-6 flex justify-center text-brass lg:justify-start">
            <AcademyMark size={72} />
          </div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-brass sm:tracking-[0.28em]">{BOOK.series}</p>
          <h1 className="font-display text-3xl tracking-tight lg:text-5xl">Create an account</h1>
          <p className="mt-2 text-sm text-muted lg:max-w-sm lg:text-base">
            Then pay with Skrill — from a phone or a computer. The author opens class on this account after confirming.
          </p>
        </div>
        <div className="w-full lg:max-w-md lg:justify-self-end">
        <div className="space-y-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-muted">Full name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Full name"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-muted">Batch</label>
            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value as (typeof STUDENT_BATCHES)[number])}
              className="flex h-12 w-full rounded-md bg-raised px-4 text-base text-fg shadow-[var(--shadow-border)] outline-none"
            >
              {STUDENT_BATCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-muted">
              Referred by (optional)
            </label>
            <Input
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              placeholder="Their name / referral code"
            />
          </div>
          <ProviderButtons
            callbackURL="/home"
            onBefore={() => persist()}
          />
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[11px] uppercase tracking-wider text-faint">or email</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <EmailAuthForm
            mode="signup"
            name={displayName}
            onBefore={() => persist()}
            onSuccess={() => {
              persist();
              navigate({ to: "/home" });
            }}
          />
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="inline-flex min-h-11 items-center text-brass underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
        <JoinWhatsApp className="mt-6" />
        </div>
      </div>
    </main>
  );
}
