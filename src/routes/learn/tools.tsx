import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ToolCard, usePracticeCatalog } from "@/components/tool-launch";
import { ProtectContent } from "@/components/protect";
import { ACCESSIBLE_TOOL_IDS, TOOL_CATEGORIES, toolsIn, type ToolCategory } from "@/lib/practice-tools";
import { readSession } from "@/lib/session-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/tools")({ component: ToolsPage });

function ToolsPage() {
  const hint = readSession()?.codeHint ?? "AEA";
  const catalog = usePracticeCatalog();
  const [category, setCategory] = useState<ToolCategory>("chat");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as ToolCategory;
    if (TOOL_CATEGORIES.some((c) => c.id === hash)) setCategory(hash);
  }, []);

  const tools = toolsIn(category, catalog);
  const meta = TOOL_CATEGORIES.find((c) => c.id === category);

  return (
    <ProtectContent hint={hint}>
      <div className="mx-auto max-w-4xl">
        <p className="text-[11px] uppercase tracking-[0.24em] text-brass">Practice labs</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Open the tools</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          ChatGPT, Grok, Gemini and Google Flow each have their own image and video
          entries, next to Kling, Runway and the rest. A link opens the website on
          a computer, or the official iPhone / Android app on a phone. Generate
          there, then store the work in Studio.
        </p>

        <section className="mt-8 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-[11px] uppercase tracking-[0.24em] text-brass">Make it accessible</p>
          <h2 className="mt-1 font-display text-2xl tracking-tight">ElevenLabs and plugins</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Voice, captions, and the generators that have a computer website plus a phone app.
            ElevenLabs is the voice studio — website on a PC, official apps on iPhone and Android.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {ACCESSIBLE_TOOL_IDS.map((id) => {
              const tool = catalog.find((t) => t.id === id && t.active !== false);
              return tool ? <ToolCard key={tool.id} tool={tool} /> : null;
            })}
          </div>
        </section>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
          {TOOL_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategory(c.id);
                history.replaceState(null, "", `#${c.id}`);
              }}
              className={cn(
                "min-h-12 shrink-0 rounded-lg px-4 text-sm",
                category === c.id ? "bg-brass text-brass-fg" : "bg-surface text-muted hover:text-fg",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">{meta?.hint}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        <p className="mt-10 text-sm text-muted">
          After you generate,{" "}
          <Link to="/learn/studio" className="text-brass underline-offset-4 hover:underline">
            store the still in Studio
          </Link>{" "}
          so the author can rate it.
        </p>
      </div>
    </ProtectContent>
  );
}
