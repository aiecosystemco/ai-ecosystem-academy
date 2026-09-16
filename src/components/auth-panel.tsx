import { useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, rememberBearerToken, signIn } from "@/lib/auth/client";
import { AUTHOR_EMAIL } from "@/lib/signup-rails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function ProviderButtons({
  callbackURL = "/home",
  onBefore,
}: {
  callbackURL?: string;
  onBefore?: () => boolean | void;
}) {
  if (!authEnabled) {
    return <p className="text-sm text-muted">Sign-in is disabled.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {GROK_PROVIDERS.map((p) => (
        <Button
          key={p.providerId}
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            if (onBefore && onBefore() === false) return;
            void signIn(p.providerId, { callbackURL }).catch((err) => {
              toast.error(err instanceof Error ? err.message : "Could not open sign-in.");
            });
          }}
        >
          Continue with {p.label}
        </Button>
      ))}
    </div>
  );
}

export function EmailAuthForm({
  mode,
  name,
  onSuccess,
  onBefore,
}: {
  mode: "signin" | "signup";
  name?: string;
  onSuccess: () => void;
  onBefore?: () => boolean | void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!authEnabled) return;
    if (onBefore && onBefore() === false) return;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Enter the email on this account.");
      return;
    }
    if (mode === "signup" && trimmed === AUTHOR_EMAIL) {
      toast.error("This Gmail is the book author's account. Sign in instead.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password needs at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await authClient.signUp.email({
          email: trimmed,
          password,
          name: (name ?? "").trim() || trimmed.split("@")[0] || "Member",
        });
        if (error) throw new Error(error.message ?? "Could not create the account.");
        rememberBearerToken(data?.token);
      } else {
        const { data, error } = await authClient.signIn.email({
          email: trimmed,
          password,
        });
        if (error) throw new Error(error.message ?? "Could not sign in.");
        rememberBearerToken(data?.token);
      }
      const session = await authClient.getSession();
      if (session.error || !session.data?.user) {
        throw new Error("Signed in, but this device could not open the session. Try again.");
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
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
      <label className="block text-xs uppercase tracking-wider text-muted">Password</label>
      <Input
        type="password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
        minLength={8}
        required
      />
      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
