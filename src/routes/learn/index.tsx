import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Clock, MonitorSmartphone } from "lucide-react";
import { listCurriculum, type ChapterMeta } from "@/lib/academy-api";
import { BOOK } from "@/lib/book-public";
import { readSession } from "@/lib/session-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/")({ component: Curriculum });

function Curriculum() {
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    const load = () => {
      const session = readSession();
      if (!session) {
        if (tries < 10) {
          tries += 1;
          window.setTimeout(load, 150);
          return;
        }
        if (!cancelled) setLoading(false);
        return;
      }
      void listCurriculum({ data: { token: session.token } })
        .then((r) => {
          if (!cancelled) setChapters(r.chapters);
        })
        .catch(() => {
          if (!cancelled) setChapters([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const done = chapters.filter((c) => c.done).length;
  const total = chapters.length || 1;
  const pct = Math.round((done / total) * 100);
  const next = chapters.find((c) => !c.done) ?? chapters[0];

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.24em] text-brass">{BOOK.series}</p>
      <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
        {BOOK.title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Twenty chapters of the full book — every teaching, prompt, shot list and
        assignment from the Practical Creator Series. Work through it like a
        studio, not a PDF. Copy only the prompt blocks. Send your own prompts
        from Studio for the author to rate.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] sm:col-span-2">
          <p className="text-xs uppercase tracking-wider text-muted">Progress</p>
          <p className="mt-2 font-display text-3xl tabular-nums">
            {done}
            <span className="text-lg text-muted"> / {chapters.length}</span>
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-raised">
            <div className="h-full bg-brass" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {next ? (
          <Link
            to="/learn/$slug"
            params={{ slug: next.slug }}
            className="flex flex-col justify-between rounded-xl bg-brass p-5 text-brass-fg"
          >
            <p className="text-xs uppercase tracking-wider opacity-70">Continue</p>
            <p className="mt-3 font-display text-xl leading-tight">{next.title}</p>
          </Link>
        ) : null}
      </div>

      <Link
        to="/learn/tools"
        className="mt-4 flex min-h-16 items-center justify-between gap-3 rounded-xl bg-surface px-5 py-4 shadow-[var(--shadow-border)]"
      >
        <div>
          <p className="text-xs uppercase tracking-wider text-brass">Practice labs</p>
          <p className="mt-1 font-display text-xl">Open ChatGPT, Grok, Gemini, Google Flow…</p>
          <p className="mt-1 text-sm text-muted">Official website on a computer and phone apps — generate, then store the still.</p>
        </div>
        <MonitorSmartphone className="size-6 shrink-0 text-brass" />
      </Link>

      <div className="mt-10 grid gap-3 lg:grid-cols-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-surface" />
            ))
          : chapters.map((ch) => (
              <Link
                key={ch.slug}
                to="/learn/$slug"
                params={{ slug: ch.slug }}
                className="group flex items-start gap-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] transition-colors hover:bg-raised"
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-10 shrink-0 place-items-center rounded-md font-mono text-xs",
                    ch.done ? "bg-ok/20 text-ok" : "bg-raised text-muted",
                  )}
                >
                  {ch.done ? <Check className="size-4" /> : String(ch.id).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg leading-tight text-fg group-hover:text-brass">
                    {ch.title}
                  </span>
                  <span className="mt-1 block text-sm text-muted">{ch.subtitle}</span>
                </span>
                <span className="hidden items-center gap-1 text-xs text-faint sm:inline-flex">
                  <Clock className="size-3.5" />
                  {ch.minutes} min
                </span>
              </Link>
            ))}
      </div>
    </div>
  );
}
