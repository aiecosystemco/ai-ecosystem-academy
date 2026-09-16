import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, MonitorSmartphone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ChapterWorkshop } from "@/components/chapter-workshop";
import { ProtectContent } from "@/components/protect";
import { Button } from "@/components/ui/button";
import { getLiveChapter, saveProgress } from "@/lib/academy-api";
import { type Chapter, type ContentBlock } from "@/lib/book-public";
import { readSession } from "@/lib/session-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/$slug")({ component: ChapterPage });

function ChapterPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [nav, setNav] = useState<{
    prev: { slug: string; title: string } | null;
    next: { slug: string; title: string } | null;
  }>({ prev: null, next: null });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [preset, setPreset] = useState<{ title: string; prompt: string; exampleKey: string } | null>(null);
  const hint = readSession()?.codeHint ?? "AEA";

  useEffect(() => {
    const session = readSession();
    if (!session) {
      navigate({ to: "/" });
      return;
    }
    setChapter(null);
    setNav({ prev: null, next: null });
    setError(null);
    void getLiveChapter({ data: { token: session.token, slug } })
      .then((r) => {
        setChapter(r.chapter);
        setNav({ prev: r.prev, next: r.next });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load chapter."));
  }, [slug, navigate]);

  async function markDone() {
    const session = readSession();
    if (!session || !chapter) return;
    setDone(true);
    try {
      await saveProgress({
        data: { token: session.token, kind: "chapter", itemKey: chapter.slug, done: true },
      });
      toast.success("Chapter marked complete.");
    } catch {
      toast.error("Could not save progress.");
    }
  }

  if (error) {
    return (
      <div className="rounded-xl bg-surface p-6 text-sm text-muted">
        {error}
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link to="/learn">Back to curriculum</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  }

  return (
    <ProtectContent hint={hint}>
      <article className="mx-auto max-w-3xl lg:max-w-4xl">
        <p className="text-[11px] uppercase tracking-[0.24em] text-brass">
          {chapter.id === 0 ? "Start here" : chapter.id === 21 ? "Close" : `Chapter ${chapter.id}`}
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">{chapter.title}</h1>
        <p className="mt-2 text-muted">{chapter.subtitle}</p>

        <Link
          to="/learn/tools"
          className="mt-6 flex min-h-14 items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
        >
          <span>
            <span className="block text-[11px] uppercase tracking-wider text-brass">Generate this chapter</span>
            <span className="text-sm">Open Chat, image, video, automation and agent tools</span>
          </span>
          <MonitorSmartphone className="size-5 shrink-0 text-brass" />
        </Link>

        <div className="mt-8 space-y-6">
          {chapter.blocks.map((block, i) => (
            <Block
              key={i}
              block={block}
              onRecreate={(title, prompt) => {
                setPreset({ title, prompt, exampleKey: `${chapter.slug}:${i}` });
                requestAnimationFrame(() =>
                  document.getElementById("chapter-workshop")?.scrollIntoView({ behavior: "smooth", block: "start" }),
                );
              }}
            />
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant={done ? "quiet" : "primary"} onClick={() => void markDone()}>
            <Check className="size-4" />
            {done ? "Completed" : "Mark chapter complete"}
          </Button>
          <p className="font-mono text-[11px] tracking-wider text-faint">Licensed · {hint}</p>
        </div>

        <nav className="mt-10 grid gap-3 sm:grid-cols-2">
          {nav.prev ? (
            <Link
              to="/learn/$slug"
              params={{ slug: nav.prev.slug }}
              className="flex min-h-14 items-center gap-2 rounded-lg bg-surface px-4 text-sm shadow-[var(--shadow-border)]"
            >
              <ChevronLeft className="size-4 text-muted" />
              <span className="min-w-0">
                <span className="block text-[11px] uppercase tracking-wider text-faint">Previous</span>
                <span className="block truncate">{nav.prev.title}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {nav.next ? (
            <Link
              to="/learn/$slug"
              params={{ slug: nav.next.slug }}
              className="flex min-h-14 items-center justify-end gap-2 rounded-lg bg-surface px-4 text-right text-sm shadow-[var(--shadow-border)]"
            >
              <span className="min-w-0">
                <span className="block text-[11px] uppercase tracking-wider text-faint">Next</span>
                <span className="block truncate">{nav.next.title}</span>
              </span>
              <ChevronRight className="size-4 text-muted" />
            </Link>
          ) : null}
        </nav>

        <ChapterWorkshop
          slug={chapter.slug}
          preset={preset}
          onPresetUsed={() => setPreset(null)}
        />
      </article>
    </ProtectContent>
  );
}

function Block({
  block,
  onRecreate,
}: {
  block: ContentBlock;
  onRecreate: (title: string, prompt: string) => void;
}) {
  switch (block.kind) {
    case "p":
      return <p className="text-[17px] leading-7 text-fg/90">{block.text}</p>;
    case "h":
      return (
        <h2 className="font-display text-2xl tracking-tight text-fg pt-4">
          {block.text}
        </h2>
      );
    case "learn":
      return (
        <section className="rounded-xl bg-paper p-5 text-ink shadow-[var(--shadow-paper)]">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-brass-fg/70">
            What you will learn
          </h2>
          <ul className="mt-3 space-y-2">
            {block.items.map((item) => (
              <li key={item} className="flex gap-2 text-[15px] leading-6">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brass" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      );
    case "steps":
      return (
        <ol className="space-y-4">
          {block.items.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-raised font-mono text-xs text-brass">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      );
    case "rule":
      return (
        <aside className="rounded-xl bg-raised px-5 py-4 shadow-[0_0_0_1px_rgba(184,154,98,0.35)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brass">
            {block.title}
          </p>
          <p className="mt-2 text-[16px] leading-7">{block.text}</p>
        </aside>
      );
    case "prompt":
      return (
        <PromptCard
          title={block.title}
          text={block.text}
          onRecreate={() => onRecreate(block.title, block.text)}
        />
      );
    case "list":
      return (
        <section>
          {block.title ? <h2 className="mb-3 font-display text-xl">{block.title}</h2> : null}
          <ul className="space-y-2">
            {block.items.map((item) => (
              <li key={item} className="flex gap-3 text-[16px] leading-7 text-fg/90">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brass" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      );
    case "pipeline":
      return (
        <div className="flex flex-wrap gap-2">
          {block.items.map((item, i) => (
            <span key={item} className="inline-flex items-center gap-2">
              <span className="rounded-md bg-raised px-3 py-1.5 text-sm">{item}</span>
              {i < block.items.length - 1 ? <span className="text-faint">→</span> : null}
            </span>
          ))}
        </div>
      );
    case "assignment":
      return (
        <section className="rounded-xl bg-paper p-5 text-ink">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass-fg/70">
            Assignment
          </p>
          <p className="mt-2 text-[16px] leading-7">{block.text}</p>
          <button
            type="button"
            onClick={() => onRecreate("Assignment", block.text)}
            className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brass-fg/80"
          >
            <Sparkles className="size-3.5" />
            Recreate in workshop
          </button>
        </section>
      );
    case "formula":
      return (
        <p className="rounded-lg bg-raised px-4 py-3 font-mono text-sm leading-7 break-words text-brass whitespace-pre-wrap">
          {block.text}
        </p>
      );
    case "dialogue":
      return (
        <div className="space-y-3 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          {block.lines.map((line, i) => (
            <p key={i} className="text-[16px] leading-7">
              <span className="font-medium">{line.speaker}</span>
              <span className="text-muted"> — {line.direction}: </span>
              “{line.line}”
            </p>
          ))}
          <button
            type="button"
            onClick={() =>
              onRecreate(
                "Dialogue",
                block.lines.map((l) => `${l.speaker} — ${l.direction}: "${l.line}"`).join("\n"),
              )
            }
            className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brass"
          >
            <Sparkles className="size-3.5" />
            Recreate in workshop
          </button>
        </div>
      );
    default:
      return null;
  }
}

function PromptCard({
  title,
  text,
  onRecreate,
}: {
  title: string;
  text: string;
  onRecreate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Prompt copied. Test it, then improve it.");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy.");
    }
  }
  return (
    <section
      data-allow-copy
      className="prompt-copy rounded-xl bg-ink p-5 text-paper shadow-[var(--shadow-border)]"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 text-xs font-semibold uppercase tracking-[0.18em] text-brass">{title}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRecreate}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs text-muted hover:text-paper"
          >
            <Sparkles className="size-3.5" />
            Recreate
          </button>
          <button
            type="button"
            onClick={() => void copy()}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs",
              copied ? "text-ok" : "text-muted hover:text-paper",
            )}
          >
            <Copy className="size-3.5" />
            {copied ? "Copied" : "Copy prompt"}
          </button>
        </div>
      </div>
      <p className="font-mono text-[13px] leading-6 break-words whitespace-pre-wrap text-paper/90">{text}</p>
    </section>
  );
}
