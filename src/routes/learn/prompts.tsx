import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, Search } from "lucide-react";
import { toast } from "sonner";
import { ProtectContent } from "@/components/protect";
import { Input } from "@/components/ui/input";
import { listLivePrompts } from "@/lib/academy-api";
import { readSession } from "@/lib/session-client";

export const Route = createFileRoute("/learn/prompts")({ component: PromptLibrary });

type Prompt = { id: string; chapter: number; title: string; text: string };

function PromptLibrary() {
  const [q, setQ] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const hint = readSession()?.codeHint ?? "AEA";

  useEffect(() => {
    const session = readSession();
    if (!session) return;
    void listLivePrompts({ data: { token: session.token } }).then((r) => setPrompts(r.prompts));
  }, []);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return prompts;
    return prompts.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.text.toLowerCase().includes(needle),
    );
  }, [q, prompts]);

  return (
    <ProtectContent hint={hint}>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl tracking-tight">Prompt library</h1>
        <p className="mt-2 text-sm text-muted">
          Every working prompt from the book, ready to test. Copy a prompt, run
          it, compare, then change one variable at a time. Build your own version
          in Studio and send it to the author for a rating.
        </p>
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search prompts"
            className="pl-10"
          />
        </div>
        <div className="mt-6 space-y-4">
          {list.map((p) => (
            <article
              key={p.id}
              data-allow-copy
              className="prompt-copy rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-brass">
                    Chapter {p.chapter}
                  </p>
                  <h2 className="font-display text-lg">{p.title}</h2>
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted hover:text-fg"
                  onClick={async () => {
                    await navigator.clipboard.writeText(p.text);
                    toast.success("Copied.");
                  }}
                >
                  <Copy className="size-3.5" />
                  Copy
                </button>
              </div>
              <p className="font-mono text-[13px] leading-6 text-fg/85">{p.text}</p>
            </article>
          ))}
        </div>
      </div>
    </ProtectContent>
  );
}
