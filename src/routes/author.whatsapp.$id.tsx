import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { CampusShell } from "@/components/campus-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { listWhatsMessages, sendWhatsMessage } from "@/lib/campus-api";
import { whatsappSendHref } from "@/lib/campus-util";

export const Route = createFileRoute("/author/whatsapp/$id")({ component: WhatsDeskPage });

function WhatsDeskPage() {
  const { id } = Route.useParams();
  const channelId = Number(id);
  if (!Number.isInteger(channelId) || channelId < 1) return <Navigate to="/author/whatsapp" />;
  return (
    <CampusShell require="author">
      <WhatsDesk channelId={channelId} />
    </CampusShell>
  );
}

function WhatsDesk({ channelId }: { channelId: number }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof listWhatsMessages>> | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setData(await listWhatsMessages({ data: { channelId } }));
  }, [channelId]);

  useEffect(() => {
    void load().catch((err) => toast.error(err instanceof Error ? err.message : "Could not open this desk."));
  }, [load]);

  if (!data) return <div className="h-40 animate-pulse rounded-xl bg-surface" />;

  const href = whatsappSendHref(data.channel, draft);

  async function send() {
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    try {
      const r = await sendWhatsMessage({ data: { channelId, body: text } });
      if (r.copy) {
        try {
          await navigator.clipboard.writeText(text);
          toast.success("Message copied. WhatsApp opens the group — paste it there.");
        } catch {
          toast.success("WhatsApp opens the group. Paste the message there.");
        }
      }
      const tab = window.open(r.href, "_blank", "noopener,noreferrer");
      if (!tab) {
        const a = document.createElement("a");
        a.href = r.href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.click();
      }
      setDraft("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/author/whatsapp"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        All WhatsApp desks
      </Link>
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-brass">{data.channel.kind}</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">{data.channel.label}</h1>
        <p className="mt-2 break-all text-xs text-muted">{data.channel.url}</p>
      </div>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Write to this group</h2>
        <p className="mt-1 text-sm text-muted">
          {data.channel.phone
            ? "Send opens official WhatsApp with your text ready."
            : "Send copies the message and opens the WhatsApp group so you can paste it there."}
        </p>
        <Textarea
          className="mt-4"
          rows={5}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message for the community…"
          maxLength={1000}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void send()} disabled={busy || !draft.trim()}>
            <ExternalLink className="size-4" />
            {busy ? "Opening…" : "Send in WhatsApp"}
          </Button>
          <Button asChild variant="outline">
            <a href={href} target="_blank" rel="noreferrer">
              Open WhatsApp
            </a>
          </Button>
          {draft.trim() ? (
            <Button
              type="button"
              variant="ghost"
              onClick={async () => {
                await navigator.clipboard.writeText(draft.trim());
                toast.success("Copied.");
              }}
            >
              <Copy className="size-4" />
              Copy
            </Button>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl">From this desk</h2>
        {data.messages.length === 0 ? (
          <p className="rounded-xl bg-surface p-4 text-sm text-muted">No messages written yet.</p>
        ) : (
          <div className="space-y-2">
            {data.messages.map((m) => (
              <article key={m.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
                <p className="mt-2 text-[11px] text-faint">{m.createdAt}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
