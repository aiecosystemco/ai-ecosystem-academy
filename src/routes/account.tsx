import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CampusShell } from "@/components/campus-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient, signOut } from "@/lib/auth/client";
import { compressAvatar } from "@/lib/compress-image";
import { requestNewCode, saveCampusProfile } from "@/lib/campus-api";
import { useCampus } from "@/lib/use-campus";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  return (
    <CampusShell>
      <AccountBody />
    </CampusShell>
  );
}

function AccountBody() {
  const { me, refresh } = useCampus();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [phone, setPhone] = useState(me?.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPhone(me?.phone ?? "");
  }, [me?.phone]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-brass">Account</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">Your place</h1>
        <p className="mt-2 text-sm text-muted">
          Photo, phone, and password. One person per account. A newer phone or computer logs the older one of that kind out.
        </p>
      </div>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Profile photo</h2>
        <p className="mt-1 text-sm text-muted">Shown on campus for students, tutors, and the author.</p>
        <div className="mt-4 flex items-center gap-4">
          {me?.avatar ? (
            <img src={me.avatar} alt="" className="size-20 rounded-full object-cover shadow-[var(--shadow-border)]" />
          ) : (
            <span className="grid size-20 place-items-center rounded-full bg-raised font-display text-2xl text-brass">
              {(me?.name || "A").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setPhotoBusy(true);
                try {
                  const avatar = await compressAvatar(file);
                  await saveCampusProfile({ data: { avatar } });
                  toast.success("Photo saved.");
                  await refresh();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not save that photo.");
                } finally {
                  setPhotoBusy(false);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={photoBusy}
              onClick={() => fileRef.current?.click()}
            >
              {photoBusy ? "Saving…" : "Add photo"}
            </Button>
            {me?.avatar ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await saveCampusProfile({ data: { clearAvatar: true } });
                  toast.success("Photo removed.");
                  await refresh();
                }}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-sm">
          <span className="text-muted">Name · </span>
          {me?.name}
        </p>
        <p className="mt-2 text-sm">
          <span className="text-muted">Email · </span>
          {me?.email || "Signed in with a connected identity"}
        </p>
        <p className="mt-2 text-sm">
          <span className="text-muted">Role · </span>
          {me?.role}
        </p>
        <p className="mt-2 text-sm">
          <span className="text-muted">Class code · </span>
          {me?.codeHint || "Not opened yet"}
        </p>
        <p className="mt-2 font-mono text-sm text-brass">{me?.referralSlug}</p>
      </section>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Phone number</h2>
        <p className="mt-1 text-sm text-muted">WhatsApp or mobile so the author can reach you.</p>
        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const r = await saveCampusProfile({ data: { phone } });
              setPhone(r.phone);
              toast.success("Phone saved.");
              await refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not save phone.");
            }
          }}
        >
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="WhatsApp or mobile"
            autoComplete="tel"
          />
          <Button type="submit">Save phone</Button>
        </form>
      </section>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Change password</h2>
        <p className="mt-1 text-sm text-muted">For email accounts. Google and X keep their own sign-in.</p>
        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const changer = authClient as typeof authClient & {
                changePassword?: (opts: {
                  currentPassword: string;
                  newPassword: string;
                }) => Promise<{ error?: { message?: string } | null }>;
              };
              if (!changer.changePassword) {
                throw new Error("Email password is not available on this sign-in method.");
              }
              const { error } = await changer.changePassword({
                currentPassword: current,
                newPassword: next,
              });
              if (error) throw new Error(error.message ?? "Could not change password.");
              setCurrent("");
              setNext("");
              toast.success("Password updated.");
              await refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not change password.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Current password"
          />
          <Input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="New password (8+ characters)"
            minLength={8}
          />
          <Button type="submit" disabled={busy}>
            Update password
          </Button>
        </form>
      </section>
      {me?.role !== "author" ? (
        <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-xl">Need a new unique code?</h2>
          <p className="mt-1 text-sm text-muted">
            If the old one was shared and removed, send a request. The author sees it on their lock
            and can issue a replacement or keep it removed.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={async () => {
              await requestNewCode({ data: { note: "Requested from account" } });
              toast.success("Request sent to the author.");
            }}
          >
            Request a replacement
          </Button>
        </section>
      ) : null}
      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Sign out</h2>
        <p className="mt-1 text-sm text-muted">
          Ends this session on this phone. Sign in again with Google, X, or email.
        </p>
        <Button
          className="mt-4 w-full sm:w-auto"
          variant="outline"
          onClick={() => void signOut("/login")}
        >
          Sign out
        </Button>
      </section>
    </div>
  );
}
