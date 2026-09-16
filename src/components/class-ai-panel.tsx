import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { VoiceNoteRecorder } from "@/components/voice-note";
import { askClassAi, listClassAi } from "@/lib/campus-api";
import { cn } from "@/lib/utils";

export function ClassAiPanel({ day }: { day: number }) {
  const [items, setItems] = useState<Awaited<ReturnType<typeof listClassAi>>["messages"]>([]);
  const [available, setAvailable] = useState(true);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const next = await listClassAi({ data: { day } });
    setItems(next.messages);
    setAvailable(next.available);
  }, [day]);

  useEffect(() => {
    void load().catch(() => setAvailable(false));
  }, [load]);

  async function ask(text?: string, audio?: string) {
    const prompt = (text ?? "").trim();
    if (!prompt && !audio) return;
    setBusy(true);
    try {
      await askClassAi({ data: { day, text: prompt || undefined, audio } });
      setDraft("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Academy AI could not answer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <div className="mb-3 flex items-center gap-2 text-brass">
        <Sparkles className="size-4" />
        <h2 className="font-display text-lg">Academy AI</h2>
      </div>
      <p className="mb-3 text-xs text-muted">
        Separate from class chat. Type or speak to research, ask questions, and draft prompts. This
        thread is only yours.
      </p>
      {!available ? (
        <p className="text-sm text-muted">Academy AI is not available in this session.</p>
      ) : (
        <>
          <div className="mb-3 max-h-56 space-y-2 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-faint">Ask anything about today's class or a prompt you are writing.</p>
            ) : (
              items.map((m) => (
                <article
                  key={m.id}
                  className={cn("rounded-lg p-3 text-sm leading-relaxed", m.role === "user" ? "bg-raised" : "bg-bg")}
                >
                  <p className="text-[11px] uppercase tracking-wider text-faint">
                    {m.role === "user" ? "You" : "Academy AI"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                </article>
              ))
            )}
          </div>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(draft);
            }}
          >
            <Textarea
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask the academy AI, or research a prompt…"
              disabled={busy}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy || !draft.trim()}>
                {busy ? "Thinking…" : "Ask AI"}
              </Button>
              <VoiceNoteRecorder
                disabled={busy}
                label="Ask by voice"
                onSend={(audio) => ask(undefined, audio)}
              />
            </div>
          </form>
        </>
      )}
    </section>
  );
}
