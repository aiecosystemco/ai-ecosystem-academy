import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AcademyMark } from "@/components/academy-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordWithToken } from "@/lib/campus-api";
import { BOOK } from "@/lib/book-public";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (token.length < 8) {
      toast.error("That recovery link is missing. Ask the author to send a new one.");
      return;
    }
    setBusy(true);
    try {
      await resetPasswordWithToken({ data: { token, password } });
      toast.success("Password saved. Sign in with your email.");
      navigate({ to: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset that password.");
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
          <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-brass">{BOOK.series}</p>
          <h1 className="font-display text-3xl tracking-tight lg:text-5xl">New password</h1>
          <p className="mt-2 text-sm text-muted lg:max-w-sm lg:text-base">Choose a password for the email on this recovery link.</p>
        </div>
        <div className="w-full lg:max-w-md lg:justify-self-end">
        <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <form onSubmit={(e) => void submit(e)} className="space-y-3">
            <label className="block text-xs uppercase tracking-wider text-muted">New password</label>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? "Saving…" : "Save password"}
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          <Link to="/login" className="inline-flex min-h-11 items-center text-brass underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
        </div>
      </div>
    </main>
  );
}
