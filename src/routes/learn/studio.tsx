import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Send, Star } from "lucide-react";
import { toast } from "sonner";
import { ChapterWorkshop } from "@/components/chapter-workshop";
import { ProtectContent } from "@/components/protect";
import { PracticeToolsStrip } from "@/components/tool-launch";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  listChapterWorkAdmin,
  listStudioWork,
  loadProgress,
  myStudioWork,
  rateChapterWork,
  rateStudioWork,
  saveProgress,
  submitStudioWork,
} from "@/lib/academy-api";
import {
  BIBLE_FIELDS,
  BIBLE_LABELS,
  FORMULA_PARTS,
  type BibleField,
} from "@/lib/book-public";
import { readSession } from "@/lib/session-client";

export const Route = createFileRoute("/learn/studio")({ component: Studio });

type Bible = Record<BibleField, string>;
const emptyBible = Object.fromEntries(BIBLE_FIELDS.map((k) => [k, ""])) as Bible;

type Submission = {
  id: number;
  accessCode: string;
  label: string;
  workKind: string;
  title: string;
  body: string;
  submittedAt: string;
  rating: number | null;
  review: string;
  reviewedAt: string | null;
};

function Studio() {
  const stored = readSession();
  const hint = stored?.codeHint ?? "AEA";
  const isAuthor = stored?.role === "admin";

  return (
    <ProtectContent hint={hint}>
      <div className="mx-auto max-w-3xl space-y-12">
        <header>
          <h1 className="font-display text-3xl tracking-tight">Studio</h1>
          <p className="mt-2 text-sm text-muted">
            {isAuthor
              ? "Read every prompt a student sends. Rate the work. Leave a note they can see."
              : "Build a character bible, assemble prompts, and store the images and clips you actually generated. Send work to the author when you want it rated."}
          </p>
        </header>
        <PracticeToolsStrip />
        {isAuthor ? <AuthorInbox /> : null}
        {isAuthor ? <RecreationsInbox /> : null}
        {!isAuthor ? <StudentBuilder /> : <AuthorBuilderNote />}
      </div>
    </ProtectContent>
  );
}

function AuthorBuilderNote() {
  return (
    <section className="rounded-xl bg-surface p-5 text-sm text-muted shadow-[var(--shadow-border)]">
      The formula builder is for students. Rate their submissions above. To try the
      exercises yourself, issue a unique student code and open Studio with that code.
    </section>
  );
}

function AuthorInbox() {
  const [items, setItems] = useState<Submission[]>([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<number, { rating: number; review: string }>>({});

  const load = useCallback(async () => {
    const session = readSession();
    if (!session) return;
    const r = await listStudioWork({ data: { token: session.token } });
    setItems(r.submissions);
    setPending(r.pending);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load().catch((err) => {
      toast.error(err instanceof Error ? err.message : "Could not load student work.");
      setLoading(false);
    });
  }, [load]);

  async function saveRating(id: number) {
    const session = readSession();
    if (!session) return;
    const draft = drafts[id];
    if (!draft?.rating) {
      toast.error("Choose a rating from 1 to 5.");
      return;
    }
    try {
      await rateStudioWork({
        data: { token: session.token, id, rating: draft.rating, review: draft.review },
      });
      toast.success("Rating saved. The student can see it in Studio.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save rating.");
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Student prompt work</h2>
          <p className="mt-1 text-sm text-muted">
            {pending} waiting for a rating. Students see your score and note in their Studio.
          </p>
        </div>
      </div>
      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-surface" />
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-surface p-5 text-sm text-muted">
          No student prompt work yet. When a student hits “Send to author” in Studio, it
          appears here.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const draft = drafts[item.id] ?? {
              rating: item.rating ?? 0,
              review: item.review,
            };
            return (
              <article
                key={item.id}
                className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs tracking-wider text-brass">
                      {item.accessCode}
                      {item.label ? ` · ${item.label}` : ""}
                    </p>
                    <h3 className="mt-1 font-display text-lg">{item.title}</h3>
                    <p className="text-[11px] uppercase tracking-wider text-faint">
                      {item.workKind}
                    </p>
                  </div>
                  {item.rating ? (
                    <p className="font-mono text-sm text-brass">{item.rating}/5</p>
                  ) : (
                    <p className="text-xs uppercase tracking-wider text-danger">Unrated</p>
                  )}
                </div>
                <p className="mt-3 font-mono text-[13px] leading-6 text-fg/85">{item.body}</p>
                <div className="mt-4 flex gap-1" role="group" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="grid size-11 place-items-center rounded-md hover:bg-raised"
                      aria-label={`Rate ${n} of 5`}
                      onClick={() =>
                        setDrafts((d) => ({
                          ...d,
                          [item.id]: { ...draft, rating: n },
                        }))
                      }
                    >
                      <Star
                        className={`size-5 ${n <= draft.rating ? "fill-brass text-brass" : "text-faint"}`}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  rows={3}
                  className="mt-3 min-h-24"
                  placeholder="Note for the student — what worked, what to fix."
                  value={draft.review}
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [item.id]: { ...draft, review: e.target.value },
                    }))
                  }
                />
                <Button className="mt-3" size="sm" onClick={() => void saveRating(item.id)}>
                  Save rating
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RecreationsInbox() {
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listChapterWorkAdmin>>["items"]
  >([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<number, { rating: number; review: string }>>({});

  const load = useCallback(async () => {
    const session = readSession();
    if (!session) return;
    const r = await listChapterWorkAdmin({ data: { token: session.token } });
    setItems(r.items);
    setPending(r.pending);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load().catch((err) => {
      toast.error(err instanceof Error ? err.message : "Could not load recreations.");
      setLoading(false);
    });
  }, [load]);

  async function saveRating(id: number) {
    const session = readSession();
    if (!session) return;
    const draft = drafts[id];
    if (!draft?.rating) {
      toast.error("Choose a rating from 1 to 5.");
      return;
    }
    try {
      await rateChapterWork({
        data: { token: session.token, id, rating: draft.rating, review: draft.review },
      });
      toast.success("Recreation rated. The student can see it in their chapter notebook.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save rating.");
    }
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-2xl">Generated recreations</h2>
        <p className="mt-1 text-sm text-muted">
          {pending} waiting. Students upload stills, name the tool, and store the
          prompt they actually ran. Codes stay masked here.
        </p>
      </div>
      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-surface" />
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-surface p-5 text-sm text-muted">
          No recreations yet. When a student saves work in a chapter workshop, it
          appears here.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const draft = drafts[item.id] ?? {
              rating: item.rating ?? 0,
              review: item.review,
            };
            return (
              <article
                key={item.id}
                className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs tracking-wider text-brass">
                      {item.accessCode}
                      {item.label ? ` · ${item.label}` : ""}
                      {" · "}
                      {item.slug}
                    </p>
                    <h3 className="mt-1 font-display text-lg">{item.title}</h3>
                    <p className="text-[11px] uppercase tracking-wider text-faint">
                      {item.tool} · {item.workKind}
                    </p>
                  </div>
                  {item.rating ? (
                    <p className="font-mono text-sm text-brass">{item.rating}/5</p>
                  ) : (
                    <p className="text-xs uppercase tracking-wider text-danger">Unrated</p>
                  )}
                </div>
                {item.imageData ? (
                  <img
                    src={item.imageData}
                    alt=""
                    className="mt-3 max-h-56 w-full rounded-md object-contain bg-ink"
                  />
                ) : null}
                {item.promptText ? (
                  <p className="mt-3 font-mono text-[13px] leading-6 text-fg/85">{item.promptText}</p>
                ) : null}
                {item.notes ? (
                  <p className="mt-2 text-sm text-muted">{item.notes}</p>
                ) : null}
                <div className="mt-4 flex gap-1" role="group" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="grid size-11 place-items-center rounded-md hover:bg-raised"
                      aria-label={`Rate ${n} of 5`}
                      onClick={() =>
                        setDrafts((d) => ({
                          ...d,
                          [item.id]: { ...draft, rating: n },
                        }))
                      }
                    >
                      <Star
                        className={`size-5 ${n <= draft.rating ? "fill-brass text-brass" : "text-faint"}`}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  rows={3}
                  className="mt-3 min-h-24"
                  placeholder="Note for the student — what worked, what to fix."
                  value={draft.review}
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [item.id]: { ...draft, review: e.target.value },
                    }))
                  }
                />
                <Button className="mt-3" size="sm" onClick={() => void saveRating(item.id)}>
                  Save rating
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StudentBuilder() {
  const hint = readSession()?.codeHint ?? "AEA";
  const [bible, setBible] = useState<Bible>(emptyBible);
  const [formula, setFormula] = useState<Record<string, string>>(
    Object.fromEntries(FORMULA_PARTS.map((p) => [p.key, ""])),
  );
  const [practice, setPractice] = useState("");
  const [practiceTitle, setPracticeTitle] = useState("");
  const [mine, setMine] = useState<Submission[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const loadMine = useCallback(async () => {
    const session = readSession();
    if (!session) return;
    const r = await myStudioWork({ data: { token: session.token } });
    setMine(r.submissions);
  }, []);

  useEffect(() => {
    const session = readSession();
    if (!session) return;
    void loadProgress({ data: { token: session.token, kind: "studio" } }).then((r) => {
      const b = r.items.find((i) => i.key === "bible");
      const f = r.items.find((i) => i.key === "formula");
      if (b?.payload) {
        try {
          setBible({ ...emptyBible, ...(JSON.parse(b.payload) as Bible) });
        } catch {
          /* ignore */
        }
      }
      if (f?.payload) {
        try {
          setFormula((prev) => ({ ...prev, ...(JSON.parse(f.payload) as Record<string, string>) }));
        } catch {
          /* ignore */
        }
      }
    });
    void loadMine();
  }, [loadMine]);

  const biblePrompt = useMemo(() => {
    const bits = [
      bible.name,
      bible.age ? `a ${bible.age}-year-old` : "",
      bible.gender,
      bible.appearance,
      bible.hair ? `${bible.hair} hair` : "",
      bible.eyes ? `${bible.eyes} eyes` : "",
      bible.build ? `${bible.build} build` : "",
      bible.wardrobe ? `wearing ${bible.wardrobe}` : "",
      bible.personality ? `${bible.personality} expression` : "",
      bible.visualStyle || "photorealistic cinematic portrait",
      bible.props ? `important prop: ${bible.props}` : "",
      "vertical 9:16",
    ].filter(Boolean);
    return bits.join(", ");
  }, [bible]);

  const formulaPrompt = useMemo(
    () => FORMULA_PARTS.map((p) => formula[p.key]?.trim()).filter(Boolean).join(", "),
    [formula],
  );

  async function persist(key: string, payload: unknown) {
    const session = readSession();
    if (!session) return;
    await saveProgress({
      data: {
        token: session.token,
        kind: "studio",
        itemKey: key,
        done: true,
        payload: JSON.stringify(payload),
      },
    });
    toast.success("Saved to your licensed notebook.");
  }

  async function send(workKind: "bible" | "formula" | "prompt", title: string, body: string, payload?: unknown) {
    const session = readSession();
    if (!session) return;
    if (body.trim().length < 8) {
      toast.error("Write a fuller prompt before sending.");
      return;
    }
    setBusy(workKind);
    try {
      await submitStudioWork({
        data: {
          token: session.token,
          workKind,
          title,
          body: body.trim(),
          payload: payload ? JSON.stringify(payload) : "{}",
        },
      });
      toast.success("Sent to the author for rating.");
      await loadMine();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <FeedbackList items={mine} hint={hint} />

      <section>
        <h2 className="font-display text-2xl">Character bible</h2>
        <p className="mt-1 text-sm text-muted">From Chapter 5. Lock identity before you generate a story.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {BIBLE_FIELDS.map((field) => (
            <label key={field} className="block sm:col-span-1">
              <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">
                {BIBLE_LABELS[field]}
              </span>
              <Input
                value={bible[field]}
                onChange={(e) => setBible((b) => ({ ...b, [field]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <div data-allow-copy className="prompt-copy mt-4 rounded-xl bg-ink p-5 text-paper">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-brass">Generated prompt</p>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted hover:text-paper"
              onClick={async () => {
                await navigator.clipboard.writeText(biblePrompt);
                toast.success("Copied.");
              }}
            >
              <Copy className="size-3.5" />
              Copy
            </button>
          </div>
          <p className="font-mono text-[13px] leading-6">{biblePrompt || "Fill the card to assemble a prompt."}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void persist("bible", bible)}>
            Save bible
          </Button>
          <Button
            disabled={busy === "bible"}
            onClick={() => void send("bible", `${bible.name || "Character"} bible`, biblePrompt, bible)}
          >
            <Send className="size-4" />
            {busy === "bible" ? "Sending…" : "Send to author"}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Eight-part prompt formula</h2>
        <p className="mt-1 font-mono text-xs text-brass">
          SUBJECT + ACTION + ENVIRONMENT + CAMERA + LIGHTING + EMOTION + STYLE + FORMAT
        </p>
        <div className="mt-4 space-y-3">
          {FORMULA_PARTS.map((part) => (
            <label key={part.key} className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">
                {part.label}
              </span>
              <Textarea
                rows={2}
                className="min-h-20"
                placeholder={part.hint}
                value={formula[part.key] ?? ""}
                onChange={(e) => setFormula((f) => ({ ...f, [part.key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <div data-allow-copy className="prompt-copy mt-4 rounded-xl bg-ink p-5 text-paper">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-brass">Assembled prompt</p>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted hover:text-paper"
              onClick={async () => {
                await navigator.clipboard.writeText(formulaPrompt);
                toast.success("Copied.");
              }}
            >
              <Copy className="size-3.5" />
              Copy
            </button>
          </div>
          <p className="font-mono text-[13px] leading-6">
            {formulaPrompt || "Fill each layer. Change one thing at a time when you debug."}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void persist("formula", formula)}>
            Save formula
          </Button>
          <Button
            disabled={busy === "formula"}
            onClick={() => void send("formula", "Eight-part formula", formulaPrompt, formula)}
          >
            <Send className="size-4" />
            {busy === "formula" ? "Sending…" : "Send to author"}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Practice prompt</h2>
        <p className="mt-1 text-sm text-muted">
          Write your own prompt from a chapter assignment. The author rates this too.
        </p>
        <Input
          className="mt-4"
          placeholder="Title — e.g. Greg shot 1, Last Message hook"
          value={practiceTitle}
          onChange={(e) => setPracticeTitle(e.target.value)}
        />
        <Textarea
          className="mt-3"
          rows={6}
          placeholder="Paste or write the full prompt you tested."
          value={practice}
          onChange={(e) => setPractice(e.target.value)}
        />
        <Button
          className="mt-4"
          disabled={busy === "prompt"}
          onClick={() =>
            void send("prompt", practiceTitle.trim() || "Practice prompt", practice)
          }
        >
          <Send className="size-4" />
          {busy === "prompt" ? "Sending…" : "Send to author"}
        </Button>
      </section>

      <ChapterWorkshop slug="studio" preset={null} />
    </>
  );
}

function FeedbackList({ items, hint }: { items: Submission[]; hint: string }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-2xl">Author ratings</h2>
      <p className="mt-1 text-sm text-muted">Licensed · {hint}. Only you and the author see this.</p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-lg">{item.title}</p>
              {item.rating ? (
                <p className="font-mono text-sm text-brass">{item.rating}/5</p>
              ) : (
                <p className="text-xs uppercase tracking-wider text-muted">Waiting</p>
              )}
            </div>
            <p className="mt-2 line-clamp-3 font-mono text-[12px] leading-5 text-muted">{item.body}</p>
            {item.review ? (
              <p className="mt-3 text-sm leading-6 text-fg/90">{item.review}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
