import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { CampusShell } from "@/components/campus-shell";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { commentPublic, listPublicFeed, postPublicX, toggleLike } from "@/lib/campus-api";
import { useCampus } from "@/lib/use-campus";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/public")({ component: PublicPage });

function PublicPage() {
  return (
    <CampusShell>
      <PublicFeed />
    </CampusShell>
  );
}

function PublicFeed() {
  const { me } = useCampus();
  const [feed, setFeed] = useState<Awaited<ReturnType<typeof listPublicFeed>> | null>(null);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [day, setDay] = useState("");
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  async function load() {
    setFeed(await listPublicFeed());
  }

  useEffect(() => {
    void load().catch((err) => toast.error(err instanceof Error ? err.message : "Could not load the public page."));
  }, []);

  const xProvider = GROK_PROVIDERS.find((p) => p.idp === "twitter");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-brass">Social</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">Public page</h1>
        <p className="mt-2 text-sm text-muted">
          After class, paste the X post. Everyone here can see it, like it, and comment. Likes and
          comments stay on this page.
        </p>
      </div>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-lg">Sign into X through the academy</h2>
        <p className="mt-1 text-sm text-muted">
          This connects your X identity here. It does not post for you — you post on X, then drop
          the link.
        </p>
        {me?.xLinked ? (
          <p className="mt-3 text-sm text-ok">X is connected on this account.</p>
        ) : xProvider ? (
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => void signIn(xProvider.providerId, { callbackURL: "/public" })}
          >
            Continue with X
          </Button>
        ) : null}
      </section>

      {me?.canEnterClass ? (
        <form
          className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await postPublicX({
                data: {
                  url,
                  caption,
                  day: day ? Number(day) : undefined,
                },
              });
              setUrl("");
              setCaption("");
              toast.success("Posted to the public page.");
              await load();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not post.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="mb-2 block text-xs uppercase tracking-wider text-muted">X post link</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://x.com/you/status/…"
          />
          <label className="mb-2 mt-3 block text-xs uppercase tracking-wider text-muted">
            Caption (optional)
          </label>
          <Textarea rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} />
          <label className="mb-2 mt-3 block text-xs uppercase tracking-wider text-muted">
            Class day (optional)
          </label>
          <Input
            inputMode="numeric"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            placeholder="1–30"
          />
          <Button className="mt-4 w-full" disabled={busy}>
            Drop on the public page
          </Button>
        </form>
      ) : (
        <p className="rounded-xl bg-surface p-4 text-sm text-muted">
          Enter your unique code to drop assignments here. You can still watch the feed.
        </p>
      )}

      {feed?.ads.length ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg">Books from tutors</h2>
          {feed.ads.map((ad) => (
            <article key={ad.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="text-xs uppercase tracking-wider text-faint">{ad.name}</p>
              <p className="mt-1 font-medium">{ad.title}</p>
              <p className="mt-1 text-sm text-muted">{ad.body}</p>
              {ad.link ? (
                <a href={ad.link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-brass">
                  Open
                </a>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      <section className="space-y-4">
        {feed?.posts.length === 0 ? (
          <p className="rounded-xl bg-surface p-4 text-sm text-muted">No public posts yet.</p>
        ) : (
          feed?.posts.map((p) => (
            <article key={p.id} className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
              <p className="text-xs uppercase tracking-wider text-faint">
                {p.name} · {p.role}
                {p.day ? ` · day ${p.day}` : ""}
              </p>
              {p.caption ? <p className="mt-2 text-sm">{p.caption}</p> : null}
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block truncate text-sm text-brass underline-offset-4 hover:underline"
              >
                @{p.handle} on X
              </a>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-md px-3",
                    p.youLiked ? "text-brass" : "text-muted hover:bg-raised",
                  )}
                  onClick={async () => {
                    await toggleLike({ data: { postId: p.id } });
                    await load();
                  }}
                >
                  <Heart className={cn("size-4", p.youLiked ? "fill-current" : "")} />
                  {p.likeCount}
                </button>
                {p.authorLiked ? (
                  <span className="rounded-md bg-brass/15 px-2 py-1 text-[11px] uppercase tracking-wider text-brass">
                    Author liked
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1 text-faint">
                  <MessageCircle className="size-4" />
                  {p.comments.length}
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {p.comments.map((c) => (
                  <li key={c.id} className="text-sm">
                    <span className="text-muted">{c.name}: </span>
                    {c.body}
                  </li>
                ))}
              </ul>
              <form
                className="mt-3 flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const body = (drafts[p.id] ?? "").trim();
                  if (!body) return;
                  await commentPublic({ data: { postId: p.id, body } });
                  setDrafts((d) => ({ ...d, [p.id]: "" }));
                  await load();
                }}
              >
                <Input
                  value={drafts[p.id] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                  placeholder="Comment"
                />
                <Button type="submit" variant="outline">
                  Send
                </Button>
              </form>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
