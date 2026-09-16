import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Wordmark } from "@/components/academy-mark";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { listExampleCatalog, resetExampleOverride, saveExampleOverride } from "@/lib/academy-api";
import { useAcademySession } from "@/lib/use-academy";

export const Route = createFileRoute("/admin/examples")({ component: ExamplesPage });

type Item = {
  key: string;
  slug: string;
  chapterId: number;
  chapterTitle: string;
  kind: string;
  title: string;
  body: string;
  liveTitle: string;
  liveBody: string;
  overridden: boolean;
};

function ExamplesPage() {
  const { session, ready } = useAcademySession({ require: "admin" });
  const [items, setItems] = useState<Item[]>([]);
  const [chapters, setChapters] = useState<{ slug: string; title: string; id: number }[]>([]);
  const [slug, setSlug] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    const r = await listExampleCatalog({ data: { token: session.token, slug: slug || undefined } });
    setItems(r.items);
    setChapters(r.chapters);
  }, [session, slug]);

  useEffect(() => {
    if (session) void load().catch((err) => toast.error(err instanceof Error ? err.message : "Failed."));
  }, [session, load]);

  const grouped = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of items) {
      const list = map.get(item.slug) ?? [];
      list.push(item);
      map.set(item.slug, list);
    }
    return [...map.entries()];
  }, [items]);

  if (!ready || !session) {
    return <div className="grid min-h-dvh place-items-center bg-bg text-muted">Opening examples…</div>;
  }

  const token = session.token;

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <Wordmark compact />
          <Button variant="ghost" size="sm" className="shrink-0" asChild>
            <Link to="/admin">
              <ArrowLeft className="size-4" />
              Lock room
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 pb-24">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-brass">Author updates</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight">Replace examples</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Swap a story, prompt, or assignment without touching student codes or
            lock functions. Reset restores the original book text.
          </p>
        </div>
        <label className="block max-w-md">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Chapter</span>
          <select
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="flex h-12 w-full rounded-md bg-raised px-4 text-base text-fg shadow-[var(--shadow-border)] outline-none"
          >
            <option value="">All chapters</option>
            {chapters.map((c) => (
              <option key={c.slug} value={c.slug}>
                {String(c.id).padStart(2, "0")} · {c.title}
              </option>
            ))}
          </select>
        </label>

        {grouped.map(([chapterSlug, list]) => (
          <section key={chapterSlug}>
            <h2 className="mb-3 font-display text-xl">{list[0]?.chapterTitle}</h2>
            <div className="space-y-3">
              {list.map((item) => {
                const open = editing === item.key;
                return (
                  <article key={item.key} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-brass">
                          {item.kind}
                          {item.overridden ? " · updated" : ""}
                        </p>
                        <h3 className="font-display text-lg">{item.liveTitle}</h3>
                      </div>
                      <div className="flex gap-2">
                        {item.overridden ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await resetExampleOverride({ data: { token, key: item.key } });
                              toast.success("Restored original example.");
                              setEditing(null);
                              await load();
                            }}
                          >
                            <RotateCcw className="size-4" />
                            Reset
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(open ? null : item.key);
                            setTitle(item.liveTitle);
                            setBody(item.liveBody);
                          }}
                        >
                          {open ? "Close" : "Replace"}
                        </Button>
                      </div>
                    </div>
                    {!open ? (
                      <p className="mt-3 line-clamp-4 font-mono text-[12px] leading-5 text-muted">{item.liveBody}</p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                        <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
                        <Button
                          onClick={async () => {
                            await saveExampleOverride({
                              data: { token, key: item.key, slug: item.slug, title, body },
                            });
                            toast.success("Students will see the new example.");
                            setEditing(null);
                            await load();
                          }}
                        >
                          Publish new example
                        </Button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
