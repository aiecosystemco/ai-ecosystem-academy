import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { OpenNamedTool, usePracticeCatalog } from "@/components/tool-launch";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  deleteChapterWork,
  listMyChapterWork,
  saveChapterWork,
} from "@/lib/academy-api";
import { GENERATOR_TOOLS } from "@/lib/book-public";
import { compressImageFile } from "@/lib/compress-image";
import { readSession } from "@/lib/session-client";

type Item = {
  id: number;
  title: string;
  tool: string;
  workKind: string;
  promptText: string;
  notes: string;
  imageData: string;
  rating: number | null;
  review: string;
};

export function ChapterWorkshop({
  slug,
  preset,
  onPresetUsed,
}: {
  slug: string;
  preset: { title: string; prompt: string; exampleKey: string } | null;
  onPresetUsed?: () => void;
}) {
  const session = readSession();
  const isStudent = session?.role === "student";
  const catalog = usePracticeCatalog();
  const toolNames = useMemo(() => {
    const names = catalog.filter((t) => t.active !== false).map((t) => t.name);
    const unique = [...new Set(names)];
    if (!unique.includes("Other")) unique.push("Other");
    return unique.length > 1 ? unique : [...GENERATOR_TOOLS];
  }, [catalog]);
  const [title, setTitle] = useState("");
  const [tool, setTool] = useState<string>("Kling");
  const [kind, setKind] = useState<"image" | "video" | "prompt" | "note">("image");
  const [promptText, setPromptText] = useState("");
  const [notes, setNotes] = useState("");
  const [imageData, setImageData] = useState("");
  const [exampleKey, setExampleKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Item[]>([]);

  const load = useCallback(async () => {
    const stored = readSession();
    if (!stored || stored.role !== "student") return;
    const r = await listMyChapterWork({ data: { token: stored.token, slug } });
    setItems(r.items);
  }, [slug]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  useEffect(() => {
    if (!preset) return;
    setTitle(preset.title);
    setPromptText(preset.prompt);
    setExampleKey(preset.exampleKey);
    onPresetUsed?.();
  }, [preset, onPresetUsed]);

  if (!isStudent) {
    return (
      <section className="mt-12 rounded-xl bg-surface p-5 text-sm text-muted shadow-[var(--shadow-border)]">
        Students recreate the examples here — upload a still, name the tool, store
        the prompt they actually ran. Author ratings appear on their notebook.
        <Button variant="outline" asChild className="mt-4 w-full">
          <Link to="/learn/tools">Open the generators</Link>
        </Button>
      </section>
    );
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const data = await compressImageFile(file);
      setImageData(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read image.");
    }
  }

  async function save() {
    const stored = readSession();
    if (!stored) return;
    if (!title.trim()) {
      toast.error("Name this recreation.");
      return;
    }
    setBusy(true);
    try {
      await saveChapterWork({
        data: {
          token: stored.token,
          slug,
          title: title.trim(),
          tool,
          workKind: kind,
          promptText,
          notes,
          imageData,
          exampleKey,
        },
      });
      toast.success("Saved to your chapter notebook.");
      setNotes("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="chapter-workshop" className="mt-12 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-brass">Chapter workshop</p>
      <h2 className="mt-1 font-display text-2xl">Recreate & store</h2>
      <p className="mt-2 text-sm text-muted">
        Run the example in your own tool. Save the image or clip still, name the
        generator, keep the prompt you used. Compile everything below — the author
        can rate it.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Title</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Greg shot 1 — my version" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Tool used</span>
          <select
            value={tool}
            onChange={(e) => setTool(e.target.value)}
            className="flex h-12 w-full rounded-md bg-raised px-4 text-base text-fg shadow-[var(--shadow-border)] outline-none"
          >
            {toolNames.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div className="mt-2">
            <OpenNamedTool name={tool} />
          </div>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Type</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="flex h-12 w-full rounded-md bg-raised px-4 text-base text-fg shadow-[var(--shadow-border)] outline-none"
          >
            <option value="image">Generated image</option>
            <option value="video">Generated video (still)</option>
            <option value="prompt">Prompt only</option>
            <option value="note">Note / compile</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Still / frame</span>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-muted file:mr-3 file:h-11 file:rounded-md file:border-0 file:bg-raised file:px-3 file:text-fg"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </label>
      </div>

      {imageData ? (
        <img src={imageData} alt="" className="mt-4 max-h-64 w-full rounded-lg object-contain bg-ink" />
      ) : null}

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Prompt you ran</span>
        <Textarea rows={5} value={promptText} onChange={(e) => setPromptText(e.target.value)} />
      </label>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Notes</span>
        <Textarea
          rows={3}
          className="min-h-20"
          placeholder="What broke? What did you change?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <Button className="mt-4" disabled={busy} onClick={() => void save()}>
        <ImagePlus className="size-4" />
        {busy ? "Saving…" : "Save to notebook"}
      </Button>

      <div className="mt-8">
        <h3 className="font-display text-xl">Your compile</h3>
        <p className="mt-1 text-sm text-muted">
          {items.length} stored recreation{items.length === 1 ? "" : "s"} for this chapter.
        </p>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-lg bg-raised p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-faint">
                    {item.tool} · {item.workKind}
                    {item.rating ? ` · ${item.rating}/5` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="grid size-11 place-items-center text-muted hover:text-danger"
                  aria-label="Remove"
                  onClick={async () => {
                    const stored = readSession();
                    if (!stored) return;
                    await deleteChapterWork({ data: { token: stored.token, id: item.id } });
                    await load();
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              {item.imageData ? (
                <img src={item.imageData} alt="" className="mt-3 max-h-48 w-full rounded-md object-contain bg-ink" />
              ) : null}
              {item.promptText ? (
                <p className="mt-3 font-mono text-[12px] leading-5 text-fg/80">{item.promptText}</p>
              ) : null}
              {item.review ? (
                <p className="mt-3 flex gap-2 text-sm text-muted">
                  <Star className="mt-0.5 size-3.5 shrink-0 text-brass" />
                  {item.review}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
