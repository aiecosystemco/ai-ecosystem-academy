import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { CampusShell } from "@/components/campus-shell";
import { JoinWhatsApp } from "@/components/whatsapp-join";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BOOK, GENERATOR_TOOLS } from "@/lib/book-public";
import {
  bindAccessCode,
  completeOnboarding,
  openClassSession,
  requestNewCode,
} from "@/lib/campus-api";
import { isPhoneReplaced, isSharedKick, parseKickRef, rememberKickRef, seatPayload } from "@/lib/seat-guard";
import { writeSession } from "@/lib/session-client";
import { useCampus } from "@/lib/use-campus";
import { clearOnboardDraft, readOnboardDraft } from "@/lib/onboard-draft";
import { STUDENT_BATCHES } from "@/lib/signup-rails";

export const Route = createFileRoute("/home")({ component: HomePage });

function HomePage() {
  return (
    <CampusShell>
      <HomeBody />
    </CampusShell>
  );
}

function HomeBody() {
  const { me, loading, refresh } = useCampus();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [onboardName, setOnboardName] = useState("");
  const [onboardReferral, setOnboardReferral] = useState("");
  const [onboardBatch, setOnboardBatch] = useState<(typeof STUDENT_BATCHES)[number]>("Cohort 1");

  useEffect(() => {
    const draft = readOnboardDraft();
    if (draft) {
      setOnboardName(draft.displayName);
      setOnboardReferral(draft.referral);
      if (STUDENT_BATCHES.includes(draft.batch as (typeof STUDENT_BATCHES)[number])) {
        setOnboardBatch(draft.batch as (typeof STUDENT_BATCHES)[number]);
      }
    }
  }, []);

  useEffect(() => {
    if (!me || me.onboarded) return;
    const draft = readOnboardDraft();
    if (!draft?.displayName) return;
    void completeOnboarding({
      data: {
        role: "student",
        displayName: draft.displayName,
        referral: draft.referral,
        batch: draft.batch,
      },
    })
      .then(() => {
        clearOnboardDraft();
        void refresh();
      })
      .catch(() => undefined);
  }, [me, refresh]);

  useEffect(() => {
    if (me?.role !== "author") return;
    void openClassSession({ data: seatPayload() })
      .then((opened) => writeSession({ token: opened.token, role: opened.role, codeHint: opened.codeHint }))
      .catch((err) => {
        const message = err instanceof Error ? err.message : "";
        if (isPhoneReplaced(message)) navigate({ to: "/phone-replaced" });
      });
  }, [me?.role]);

  if (loading || !me) {
    return <div className="h-40 animate-pulse rounded-xl bg-surface" />;
  }

  async function enterClass(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const result = await bindAccessCode({ data: { secret: code, ...seatPayload() } });
      writeSession({ token: result.token, role: result.role, codeHint: result.codeHint });
      toast.success("Class portal opened.");
      setCode("");
      await refresh();
      navigate({ to: "/classes" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "That code did not work.";
      if (isSharedKick(message)) {
        rememberKickRef(parseKickRef(message));
        navigate({ to: "/shared-code" });
        return;
      }
      if (isPhoneReplaced(message)) {
        navigate({ to: "/phone-replaced" });
        return;
      }
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-brass">Campus</p>
        <h1 className="mt-1 break-words font-display text-3xl tracking-tight">
          Hello{me.name ? `, ${me.name}` : ""}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {me.role === "author"
            ? "You are signed in as the author."
            : me.role === "tutor"
              ? "Tutor desk is ready. Students in your assigned batch appear there."
              : me.canEnterClass
                ? "Your unique code has opened the class."
                : me.payStatus === "pending"
                  ? "Payment is with the author. When they confirm, this class opens on your account."
                  : me.payStatus === "rejected"
                    ? "That enrollment was not confirmed. Pay again or ask the author."
                    : "Free mode: about the book only. Enter your unique code to open the class."}
        </p>
      </div>

      <JoinWhatsApp />

      {me.payStatus === "pending" && !me.canEnterClass ? (
        <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-xl">Waiting for confirmation</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your enrollment is with the author. When they confirm payment, class opens on this
            account. You can still paste a unique code if they sent one privately.
          </p>
        </section>
      ) : null}

      {!me.onboarded && me.role !== "author" ? (
        <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-xl">Finish joining</h2>
          <p className="mt-1 text-sm text-muted">The name used as your referral code, and your cohort.</p>
          <Input
            className="mt-4"
            value={onboardName}
            onChange={(e) => setOnboardName(e.target.value)}
            placeholder="Your name"
          />
          <Input
            className="mt-3"
            value={onboardReferral}
            onChange={(e) => setOnboardReferral(e.target.value)}
            placeholder="Referred by (optional)"
          />
          <select
            value={onboardBatch}
            onChange={(e) => setOnboardBatch(e.target.value as (typeof STUDENT_BATCHES)[number])}
            className="mt-3 h-12 w-full rounded-md bg-raised px-4 text-base text-fg shadow-[var(--shadow-border)]"
          >
            {STUDENT_BATCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <Button
            className="mt-4 w-full"
            onClick={async () => {
              try {
                await completeOnboarding({
                  data: {
                    role: "student",
                    displayName: onboardName,
                    referral: onboardReferral,
                    batch: onboardBatch,
                  },
                });
                clearOnboardDraft();
                toast.success("Account ready.");
                await refresh();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not finish joining.");
              }
            }}
          >
            Save
          </Button>
        </section>
      ) : null}

      {me.canEnterClass || me.canReadBook ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {me.canEnterClass ? (
            <Button asChild size="lg">
              <Link to="/classes">Open live classes</Link>
            </Button>
          ) : null}
          {me.canReadBook ? (
            <Button asChild variant="outline" size="lg">
              <Link to="/learn">Open the book</Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      {me.role === "student" && me.canEnterClass ? (
        <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-[11px] uppercase tracking-[0.24em] text-brass">Growth</p>
          <h2 className="mt-1 font-display text-xl">Grade {me.growth?.percent ?? 0}%</h2>
          <p className="mt-2 text-sm text-muted">
            {me.growth?.done ?? 0} of {me.growth?.total ?? 52} tasks finished. The grade rises as you
            complete chapters and the 30-day roadmap.
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-raised">
            <div className="h-full bg-brass" style={{ width: `${me.growth?.percent ?? 0}%` }} />
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/progress">Open progress</Link>
            </Button>
            {me.growth?.complete || me.certified ? (
              <Button asChild className="flex-1">
                <Link to="/certificate">Digital certificate</Link>
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {!me.canReadBook && me.payStatus !== "pending" ? (
        <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-xl">About the book</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {BOOK.title} by {BOOK.author}. A private 30-day academy for prompt engineering and AI
            content. Free mode stops here. The unique code issued after payment is the portal into
            every class, the full book, studio, and tools.
          </p>
          <p className="mt-3 font-display text-2xl">
            ₦{(me.priceNgn ?? 0).toLocaleString()} · US${me.priceUsd ?? BOOK.priceUsd}
          </p>
          <p className="mt-2 text-xs text-faint">
            Practice later on {GENERATOR_TOOLS.slice(0, 6).join(", ")} — website or app from inside
            the class.
          </p>
          <Button asChild className="mt-4 w-full" size="lg">
            <Link to="/request-access">Pay for the book</Link>
          </Button>
        </section>
      ) : null}

      {me.role === "student" && !me.bound ? (
        <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-xl">Unique code portal</h2>
          <p className="mt-1 text-sm text-muted">
            The author sends your unique code after payment. It opens the class for this account only.
          </p>
          <form onSubmit={(e) => void enterClass(e)} className="mt-4">
            <label className="mb-2 block text-xs uppercase tracking-wider text-muted">
              Unique access code
            </label>
            <Input
              autoComplete="off"
              spellCheck={false}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="AEA-XXXX-XXXX"
              className="font-mono uppercase tracking-wide sm:tracking-widest"
            />
            <Button type="submit" className="mt-4 w-full" size="lg" disabled={busy}>
              <KeyRound className="size-4" />
              {busy ? "Opening…" : "Enter class"}
            </Button>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-faint">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
              One person per code. You may use one phone and one computer. A newer device of the
              same kind logs the older one out. If a second person uses it on another account, the
              code is removed.
            </p>
          </form>
          <Button
            variant="ghost"
            className="mt-2 w-full"
            onClick={async () => {
              try {
                await requestNewCode({ data: { note: "Requested from account" } });
                toast.success("Request sent to the author.");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not send.");
              }
            }}
          >
            Request a replacement code
          </Button>
        </section>
      ) : null}

      {me.role === "author" ? (
        <Button asChild variant="outline" size="lg">
          <Link to="/author">Author lock</Link>
        </Button>
      ) : null}
    </div>
  );
}
