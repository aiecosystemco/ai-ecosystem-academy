import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { CampusShell } from "@/components/campus-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listWhatsChannels, removeWhatsChannel, saveWhatsChannel } from "@/lib/campus-api";

export const Route = createFileRoute("/author/whatsapp")({ component: WhatsLayout });

function WhatsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/author/whatsapp" && pathname !== "/author/whatsapp/") return <Outlet />;
  return <WhatsAppHub />;
}

function WhatsAppHub() {
  return (
    <CampusShell require="author">
      <WhatsAppBody />
    </CampusShell>
  );
}

function WhatsAppBody() {
  const [channels, setChannels] = useState<Awaited<ReturnType<typeof listWhatsChannels>>["channels"]>([]);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const next = await listWhatsChannels();
    setChannels(next.channels);
  }

  useEffect(() => {
    void load().catch((err) => toast.error(err instanceof Error ? err.message : "Could not open WhatsApp."));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-brass">Author</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">WhatsApp desk</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Paste a WhatsApp community group, a click-to-chat number, or any other link. Once it is
          added it activates its own desk so you can write from here and send in WhatsApp.
        </p>
      </div>

      <form
        className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await saveWhatsChannel({ data: { label, url } });
            setLabel("");
            setUrl("");
            toast.success("Link activated.");
            await load();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add that link.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="font-display text-xl">Add a group or link</h2>
        <Input
          className="mt-4"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label — Cohort 1 community, support…"
          required
          minLength={2}
        />
        <Input
          className="mt-3"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://chat.whatsapp.com/… or https://wa.me/…"
          required
        />
        <Button className="mt-4" type="submit" disabled={busy}>
          <Plus className="size-4" />
          Activate desk
        </Button>
      </form>

      <section>
        <h2 className="mb-3 font-display text-xl">Active desks</h2>
        {channels.length === 0 ? (
          <p className="rounded-xl bg-surface p-4 text-sm text-muted">
            No WhatsApp desks yet. Paste a group link above.
          </p>
        ) : (
          <div className="space-y-2">
            {channels.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {c.kind} · {c.url}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm">
                    <Link to="/author/whatsapp/$id" params={{ id: String(c.id) }}>
                      <MessageCircle className="size-4" />
                      Open desk
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await removeWhatsChannel({ data: { id: c.id } });
                      toast.success("Desk removed.");
                      await load();
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
