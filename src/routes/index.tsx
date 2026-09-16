import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import { AcademyMark } from "@/components/academy-mark";
import { JoinWhatsApp } from "@/components/whatsapp-join";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { aboutTheBook } from "@/lib/campus-api";
import { BOOK, GENERATOR_TOOLS } from "@/lib/book-public";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user, isPending } = useCurrentUserState();
  const [price, setPrice] = useState(`${BOOK.priceNgn} · ${BOOK.priceUsd}`);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    void aboutTheBook()
      .then((g) => setPrice(`₦${g.priceNgn.toLocaleString()} · US$${g.priceUsd}`))
      .catch(() => undefined);
  }, []);

  if (ready && !isPending && user) return <Navigate to="/home" />;

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-bg">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(900px 420px at 50% -10%, rgba(184,154,98,0.18), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-lg px-5 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] sm:max-w-2xl lg:grid lg:min-h-dvh lg:max-w-6xl lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16">
        <div>
          <div className="mb-10 text-center lg:mb-0 lg:text-left">
            <div className="mb-6 flex justify-center text-brass lg:justify-start">
              <AcademyMark size={120} />
            </div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-brass sm:tracking-[0.28em]">{BOOK.series}</p>
            <h1 className="font-display text-3xl leading-tight tracking-tight text-fg sm:text-5xl lg:text-6xl">
              Prompt Engineering 101
            </h1>
            <p className="mt-3 text-sm text-muted lg:max-w-md lg:text-base">
              {BOOK.title} by {BOOK.author} ({BOOK.handle}). A private student academy — not a public
              PDF. Works on phone and computer.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="flex-1">
              <Link to="/signup">
                Sign up
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
          <p className="mt-3 text-center text-xs text-faint lg:text-left">
            Opened from Grok? Your Grok identity is already the account. Google and X also work.
          </p>
          <JoinWhatsApp className="mt-4" />
        </div>

        <div className="mt-8 space-y-4 lg:mt-0">
          <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] lg:p-6">
            <div className="mb-3 flex items-center gap-2 text-brass">
              <BookOpen className="size-4" />
              <h2 className="font-display text-xl">About the book</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              A 30-day creator class for prompt engineering, image, video, voice and editing. Free
              mode is this page only. After payment the author issues a unique code that opens every
              class, the full book, studio, and tools — for one person.
            </p>
            <p className="mt-4 font-display text-2xl text-fg">{price}</p>
            <p className="mt-2 text-xs text-faint">
              Practice later on {GENERATOR_TOOLS.slice(0, 6).join(", ")} — website or app from inside
              the class.
            </p>
            <Button asChild className="mt-4 w-full" size="lg">
              <Link to="/request-access">
                Pay for the book
                <Wallet className="size-4" />
              </Link>
            </Button>
          </section>

          <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] lg:p-6">
            <div className="mb-3 flex items-center gap-2 text-brass">
              <Sparkles className="size-4" />
              <h2 className="font-display text-xl">How access works</h2>
            </div>
            <ul className="space-y-2 text-sm leading-relaxed text-muted">
              <li>Sign in, pay with Skrill, then the author confirms and opens class on your account.</li>
              <li>One person per unique code. You may use one phone and one computer. A newer device of the same kind logs the older one out.</li>
              <li>Sharing a code with a second person removes it for everyone.</li>
            </ul>
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-faint">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
              Book pages stay private. This academy never publishes the manuscript.
            </p>
          </section>

          <p className="mt-8 text-center text-xs text-faint lg:mt-4">
            {BOOK.author} · {BOOK.handle} · Not for redistribution
          </p>
        </div>
      </div>
    </div>
  );
}
