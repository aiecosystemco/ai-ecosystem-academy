import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import { Wordmark } from "@/components/academy-mark";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { createPracticeTool, listPracticeToolsAdmin, savePracticeTool } from "@/lib/academy-api";
import {
  TOOL_CATEGORIES,
  formatToolDate,
  isToolCategory,
  type PracticeTool,
  type ToolCategory,
} from "@/lib/practice-tools";
import { useAcademySession } from "@/lib/use-academy";

export const Route = createFileRoute("/admin/tools")({ component: ToolsEditorPage });

function emptyDraft(category: ToolCategory = "image"): Draft {
  return {
    name: "",
    category,
    blurb: "",
    web: "https://",
    ios: "",
    android: "",
    desktop: "",
    how: "",
    active: true,
  };
}

type Draft = {
  name: string;
  category: ToolCategory;
  blurb: string;
  web: string;
  ios: string;
  android: string;
  desktop: string;
  how: string;
  active: boolean;
  sortOrder?: number;
};

function ToolsEditorPage() {
  const { session, ready } = useAcademySession({ require: "admin" });
  const [tools, setTools] = useState<PracticeTool[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    const r = await listPracticeToolsAdmin({ data: { token: session.token } });
    setTools(r.tools);
  }, [session]);

  useEffect(() => {
    if (session) void load().catch((err) => toast.error(err instanceof Error ? err.message : "Failed."));
  }, [session, load]);

  const grouped = useMemo(() => {
    return TOOL_CATEGORIES.map((c) => ({
      ...c,
      tools: tools.filter((t) => t.category === c.id),
    })).filter((g) => g.tools.length > 0);
  }, [tools]);

  if (!ready || !session) {
    return <div className="grid min-h-dvh place-items-center bg-bg text-muted">Opening tools…</div>;
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-brass">Author updates</p>
            <h1 className="mt-1 font-display text-3xl tracking-tight">Practice tools</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Create and update the Chat, image, video, automation and agent links
              students open from Tools. Dates update when you save. Existing student
              codes and lock functions stay untouched.
            </p>
          </div>
          <Button
            onClick={() => {
              setCreateOpen((v) => !v);
              setEditing(null);
              setDraft(emptyDraft());
            }}
          >
            <Plus className="size-4" />
            {createOpen ? "Close" : "New tool"}
          </Button>
        </div>

        {createOpen ? (
          <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-xl">Create a tool</h2>
            <p className="mt-1 text-sm text-muted">Official website required. Phone apps only if the store page is real.</p>
            <ToolFields draft={draft} onChange={setDraft} />
            <Button
              className="mt-4"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await createPracticeTool({
                    data: {
                      token,
                      name: draft.name,
                      category: draft.category,
                      blurb: draft.blurb,
                      web: draft.web,
                      ios: draft.ios,
                      android: draft.android,
                      desktop: draft.desktop,
                      how: draft.how,
                      active: draft.active,
                    },
                  });
                  toast.success("Tool added. Students will see it on Tools.");
                  setCreateOpen(false);
                  setDraft(emptyDraft());
                  await load();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Create tool
            </Button>
          </section>
        ) : null}

        {grouped.map((group) => (
          <section key={group.id}>
            <h2 className="mb-3 font-display text-xl">{group.label}</h2>
            <div className="space-y-3">
              {group.tools.map((tool) => {
                const open = editing === tool.id;
                return (
                  <article key={tool.id} className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-brass">
                          {tool.active === false ? "Hidden" : "Live"}
                          {tool.updatedAt ? ` · ${formatToolDate(tool.updatedAt)}` : ""}
                        </p>
                        <h3 className="font-display text-2xl tracking-tight">{tool.name}</h3>
                        <p className="mt-1 max-w-xl text-sm text-muted">{tool.blurb}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (open) {
                            setEditing(null);
                            return;
                          }
                          setCreateOpen(false);
                          setEditing(tool.id);
                          setDraft({
                            name: tool.name,
                            category: tool.category,
                            blurb: tool.blurb,
                            web: tool.web,
                            ios: tool.ios ?? "",
                            android: tool.android ?? "",
                            desktop: tool.desktop ?? "",
                            how: tool.how,
                            active: tool.active !== false,
                            sortOrder: tool.sortOrder,
                          });
                        }}
                      >
                        {open ? "Close" : "Update"}
                      </Button>
                    </div>
                    {open ? (
                      <div className="mt-4">
                        <ToolFields draft={draft} onChange={setDraft} showSort />
                        <Button
                          className="mt-4"
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              await savePracticeTool({
                                data: {
                                  token,
                                  id: tool.id,
                                  name: draft.name,
                                  category: draft.category,
                                  blurb: draft.blurb,
                                  web: draft.web,
                                  ios: draft.ios,
                                  android: draft.android,
                                  desktop: draft.desktop,
                                  how: draft.how,
                                  active: draft.active,
                                  sortOrder: draft.sortOrder,
                                },
                              });
                              toast.success("Tool updated.");
                              setEditing(null);
                              await load();
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Failed.");
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          Save changes
                        </Button>
                      </div>
                    ) : null}
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

function ToolFields({
  draft,
  onChange,
  showSort,
}: {
  draft: Draft;
  onChange: (next: Draft) => void;
  showSort?: boolean;
}) {
  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Name</span>
        <Input value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Grok Imagine" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Category</span>
        <select
          value={draft.category}
          onChange={(e) => {
            const value = e.target.value;
            if (isToolCategory(value)) set("category", value);
          }}
          className="flex h-12 w-full rounded-md bg-raised px-4 text-base text-fg shadow-[var(--shadow-border)] outline-none"
        >
          {TOOL_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Short description</span>
        <Input value={draft.blurb} onChange={(e) => set("blurb", e.target.value)} />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Website (computer)</span>
        <Input value={draft.web} onChange={(e) => set("web", e.target.value)} placeholder="https://" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">iPhone app (optional)</span>
        <Input value={draft.ios} onChange={(e) => set("ios", e.target.value)} placeholder="https://apps.apple.com/…" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Android app (optional)</span>
        <Input value={draft.android} onChange={(e) => set("android", e.target.value)} placeholder="https://play.google.com/…" />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Windows / Mac installer (optional)</span>
        <Input value={draft.desktop} onChange={(e) => set("desktop", e.target.value)} />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">How students use it</span>
        <Textarea rows={3} value={draft.how} onChange={(e) => set("how", e.target.value)} />
      </label>
      {showSort ? (
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Sort order</span>
          <Input
            type="number"
            min={0}
            max={9999}
            value={draft.sortOrder ?? 10}
            onChange={(e) => set("sortOrder", Math.max(0, Number(e.target.value) || 0))}
          />
        </label>
      ) : null}
      <label className="inline-flex min-h-12 items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(e) => set("active", e.target.checked)}
          className="size-4"
        />
        Show on the student Tools page
      </label>
    </div>
  );
}
