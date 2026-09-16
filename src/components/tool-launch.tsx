import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listLivePracticeTools } from "@/lib/academy-api";
import {
  FEATURED_TOOL_IDS,
  PRACTICE_TOOLS,
  formatToolDate,
  toolByName,
  type PracticeTool,
} from "@/lib/practice-tools";
import { readSession } from "@/lib/session-client";
import { cn } from "@/lib/utils";

function deviceKind() {
  if (typeof navigator === "undefined") return "computer" as const;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios" as const;
  if (/Android/i.test(ua)) return "android" as const;
  return "computer" as const;
}

export function useDeviceKind() {
  const [kind, setKind] = useState<"ios" | "android" | "computer">("computer");
  useEffect(() => {
    setKind(deviceKind());
  }, []);
  return kind;
}

let catalogCache: PracticeTool[] | null = null;

export function usePracticeCatalog() {
  const [tools, setTools] = useState<PracticeTool[]>(catalogCache ?? PRACTICE_TOOLS);
  useEffect(() => {
    const token = readSession()?.token;
    if (!token) return;
    void listLivePracticeTools({ data: { token } })
      .then((r) => {
        if (r.tools.length) {
          catalogCache = r.tools;
          setTools(r.tools);
        }
      })
      .catch(() => undefined);
  }, []);
  return tools;
}

function openHref(href: string) {
  window.open(href, "_blank", "noopener,noreferrer");
}

export function ToolCard({ tool }: { tool: PracticeTool }) {
  const device = useDeviceKind();
  const mobileHref = device === "ios" ? tool.ios : device === "android" ? tool.android : undefined;
  const preferMobile = Boolean(mobileHref);
  const dated = formatToolDate(tool.updatedAt);

  return (
    <article className="flex flex-col rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-2xl tracking-tight">{tool.name}</p>
        {dated ? (
          <p className="shrink-0 pt-1 text-[11px] uppercase tracking-wider text-faint">{dated}</p>
        ) : null}
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{tool.blurb}</p>
      <p className="mt-3 text-xs leading-relaxed text-faint">{tool.how}</p>
      <div className="mt-5 flex flex-col gap-2">
        {preferMobile ? (
          <Button className="w-full" size="lg" onClick={() => openHref(mobileHref!)}>
            <Smartphone className="size-4" />
            Open {device === "ios" ? "iPhone app" : "Android app"}
          </Button>
        ) : (
          <Button className="w-full" size="lg" onClick={() => openHref(tool.web)}>
            <Monitor className="size-4" />
            Open on computer
          </Button>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {preferMobile ? (
            <Button variant="outline" onClick={() => openHref(tool.web)}>
              <Monitor className="size-4" />
              Website
            </Button>
          ) : null}
          {tool.ios && device !== "ios" ? (
            <Button variant="outline" onClick={() => openHref(tool.ios!)}>
              <Smartphone className="size-4" />
              iPhone app
            </Button>
          ) : null}
          {tool.android && device !== "android" ? (
            <Button variant="outline" onClick={() => openHref(tool.android!)}>
              <Smartphone className="size-4" />
              Android app
            </Button>
          ) : null}
          {tool.desktop ? (
            <Button variant="outline" onClick={() => openHref(tool.desktop!)}>
              <Monitor className="size-4" />
              Windows / Mac
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function OpenNamedTool({ name, className }: { name: string; className?: string }) {
  const catalog = usePracticeCatalog();
  const tool = toolByName(name, catalog);
  if (!tool) return null;
  const device = useDeviceKind();
  const href =
    device === "ios" && tool.ios
      ? tool.ios
      : device === "android" && tool.android
        ? tool.android
        : tool.web;
  const label =
    href === tool.ios ? `Open ${tool.name} on iPhone` : href === tool.android ? `Open ${tool.name} on Android` : `Open ${tool.name}`;

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("w-full", className)}
      onClick={() => openHref(href)}
    >
      <ExternalLink className="size-4" />
      {label}
    </Button>
  );
}

export function PracticeToolsStrip() {
  const catalog = usePracticeCatalog();
  const featured = FEATURED_TOOL_IDS.map((id) => catalog.find((t) => t.id === id && t.active !== false)).filter(
    (t): t is PracticeTool => Boolean(t),
  );

  return (
    <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-brass">Practice labs</p>
      <h2 className="mt-1 font-display text-2xl tracking-tight">Open the generators</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        ChatGPT, Grok, Gemini, Google Flow and the rest — website on a computer,
        official iPhone or Android app on a phone.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {featured.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => openHref(tool.web)}
            className="min-h-14 rounded-lg bg-raised px-3 text-left text-sm font-medium break-words hover:bg-line"
          >
            {tool.name}
          </button>
        ))}
      </div>
      <Link to="/learn/tools" className="mt-4 inline-block text-sm text-brass underline-offset-4 hover:underline">
        All Chat, image, video, automation and agent tools
      </Link>
    </section>
  );
}
