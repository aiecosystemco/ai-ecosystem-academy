import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AcademyMark } from "@/components/academy-mark";
import { JoinWhatsApp } from "@/components/whatsapp-join";
import { EmailAuthForm, ProviderButtons } from "@/components/auth-panel";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { BOOK } from "@/lib/book-public";
import { AUTHOR_EMAIL } from "@/lib/signup-rails";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const authorEmail = (user?.primaryEmail ?? "").trim().toLowerCase() === AUTHOR_EMAIL;
  if (ready && !isPending && user && authorEmail) return <Navigate to="/home" />;

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
          <h1 className="font-display text-3xl tracking-tight lg:text-5xl">Sign in</h1>
          <p className="mt-2 text-sm text-muted lg:max-w-sm lg:text-base">
            Google, X, or email — on a phone or a computer. The book author signs in with {AUTHOR_EMAIL}.
          </p>
        </div>
        <div className="w-full lg:max-w-md lg:justify-self-end">
        {ready && !isPending && user ? (
          <div className="mb-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <p className="text-sm text-muted">
              This device is signed in as {user.displayName || user.primaryEmail || "another account"}.
            </p>
            <Button className="mt-4 w-full" size="lg" onClick={() => navigate({ to: "/home" })}>
              Continue to campus
            </Button>
            <Button
              className="mt-2 w-full"
              variant="outline"
              size="lg"
              disabled={switching}
              onClick={() => {
                setSwitching(true);
                void signOut("/login").catch(() => setSwitching(false));
              }}
            >
              {switching ? "Signing out…" : "Sign out to use a different account"}
            </Button>
          </div>
        ) : null}
        <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <ProviderButtons callbackURL="/home" />
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[11px] uppercase tracking-wider text-faint">or email</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <EmailAuthForm mode="signin" onSuccess={() => navigate({ to: "/home" })} />
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          <Link to="/recover" className="inline-flex min-h-11 items-center text-brass underline-offset-4 hover:underline">
            Forgot password? Recover with email
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted">
          New here?{" "}
          <Link to="/signup" className="inline-flex min-h-11 items-center text-brass underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-faint">
          <Link to="/" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
            Back to the academy
          </Link>
        </p>
        <JoinWhatsApp className="mt-6" />
        </div>
      </div>
    </main>
  );
}
