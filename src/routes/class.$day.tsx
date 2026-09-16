import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Video } from "lucide-react";
import { toast } from "sonner";
import { CampusShell, ClassLed } from "@/components/campus-shell";
import { PracticeToolsStrip } from "@/components/tool-launch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { VoiceNotePlayer, VoiceNoteRecorder } from "@/components/voice-note";
import { ClassAiPanel } from "@/components/class-ai-panel";
import { listClassMessages, openClassSession, postClassMessage, toggleClassLive } from "@/lib/campus-api";
import { compressImageFile, readClassVideo } from "@/lib/compress-image";
import { isPhoneReplaced, seatPayload } from "@/lib/seat-guard";
import { readSession, writeSession } from "@/lib/session-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/class/$day")({ component: ClassRoom });

function ClassRoom() {
  const { day } = Route.useParams();
  const dayNum = Number(day);
  if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 30) return <Navigate to="/classes" />;

  return (
    <CampusShell require="class">
      <Room day={dayNum} />
    </CampusShell>
  );
}

function Room({ day }: { day: number }) {
  const navigate = useNavigate();
  const [data, setData] = useState<Awaited<ReturnType<typeof listClassMessages>> | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const next = await listClassMessages({ data: { day } });
    setData(next);
  }, [day]);

  useEffect(() => {
    void load().catch((err) => toast.error(err instanceof Error ? err.message : "Could not open class."));
    const id = window.setInterval(() => void load().catch(() => undefined), 4000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages.length]);

  useEffect(() => {
    if (readSession()) return;
    void openClassSession({ data: seatPayload() })
      .then((opened) => writeSession({ token: opened.token, role: opened.role, codeHint: opened.codeHint }))
      .catch((err) => {
        const message = err instanceof Error ? err.message : "";
        if (isPhoneReplaced(message)) navigate({ to: "/phone-replaced" });
      });
  }, []);

  async function send(kind: "text" | "voice" | "resource" | "image" | "video", body?: string, audio?: string) {
    setBusy(true);
    try {
      await postClassMessage({ data: { day, kind, body, audio } });
      setText("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <div className="h-40 animate-pulse rounded-xl bg-surface" />;

  const inClass = (data.roster ?? []).filter((s) => s.online);
  const away = (data.roster ?? []).filter((s) => !s.online);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-brass">{data.week}</p>
            <h1 className="font-display text-3xl tracking-tight">Day {data.day}</h1>
            <p className="mt-1 text-sm text-muted">{data.task}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ClassLed on={data.live} label />
            {data.canTeach ? (
              <Button
                size="sm"
                variant={data.live ? "danger" : "primary"}
                onClick={async () => {
                  await toggleClassLive({ data: { day, live: !data.live } });
                  await load();
                }}
              >
                {data.live ? "End class" : "Start class"}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex max-h-[55dvh] flex-col gap-3 overflow-y-auto overflow-x-hidden rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          {data.messages.length === 0 ? (
            <p className="text-sm text-muted">No messages yet. When class is on, resources appear here immediately.</p>
          ) : (
            data.messages.map((m) => (
              <article
                key={m.id}
                className={cn("rounded-lg p-3", m.mine ? "bg-raised" : "bg-bg")}
              >
                <p className="text-[11px] uppercase tracking-wider text-faint">
                  {m.name} · {m.role}
                  {m.kind === "resource" ? " · resource" : ""}
                  {m.kind === "image" ? " · image" : ""}
                  {m.kind === "video" ? " · video" : ""}
                </p>
                {m.kind === "voice" ? (
                  <VoiceNotePlayer src={m.audio} />
                ) : m.kind === "image" ? (
                  <img
                    src={m.audio}
                    alt={m.body || "Class image"}
                    className="mt-2 max-h-80 w-full rounded-md object-contain"
                  />
                ) : m.kind === "video" ? (
                  <video src={m.audio} controls playsInline className="mt-2 w-full rounded-md" />
                ) : (
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
                )}
              </article>
            ))
          )}
          <div ref={bottom} />
        </div>

        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            void send(data.canTeach && text.startsWith("http") ? "resource" : "text", text);
          }}
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={data.live || data.canTeach ? "Drop a note, a resource, or a prompt…" : "Class is off"}
            disabled={!data.canPost || busy}
            rows={3}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!data.canPost || busy}>
              Send
            </Button>
            <VoiceNoteRecorder
              disabled={!data.canPost || busy}
              onSend={(audio) => send("voice", undefined, audio)}
            />
            {data.canTeach ? (
              <>
                <input
                  ref={imageRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    setBusy(true);
                    try {
                      const dataUrl = await compressImageFile(file);
                      await send("image", text.trim() || "Image material", dataUrl);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not upload that image.");
                      setBusy(false);
                    }
                  }}
                />
                <input
                  ref={videoRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    setBusy(true);
                    try {
                      const dataUrl = await readClassVideo(file);
                      await send("video", text.trim() || "Video material", dataUrl);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not upload that video.");
                      setBusy(false);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => imageRef.current?.click()}
                >
                  <ImagePlus className="size-4" />
                  Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => videoRef.current?.click()}
                >
                  <Video className="size-4" />
                  Video
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!text.trim() || busy}
                  onClick={() => void send("resource", text)}
                >
                  Post as resource
                </Button>
              </>
            ) : null}
            <Button variant="ghost" asChild>
              <Link to="/public">Drop an X link on the public page</Link>
            </Button>
          </div>
        </form>
        <ClassAiPanel day={day} />
      </div>
      <aside className="min-w-0 space-y-6">
        {data.canTeach ? (
          <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-lg">Students now</h2>
            <p className="mt-1 text-xs text-muted">
              {inClass.length} in class · {away.length} offline
            </p>
            <div className="mt-3 space-y-2">
              {inClass.length === 0 ? (
                <p className="text-xs text-faint">No one online yet.</p>
              ) : (
                inClass.map((s) => (
                  <p key={s.codeHint + s.name} className="flex items-center gap-2 text-sm">
                    <span className="size-2 shrink-0 rounded-full bg-ok" />
                    <span className="min-w-0 truncate">{s.name}</span>
                  </p>
                ))
              )}
            </div>
            {away.length > 0 ? (
              <div className="mt-4 space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-faint">Offline</p>
                {away.slice(0, 12).map((s) => (
                  <p key={s.codeHint + s.name} className="truncate text-xs text-muted">
                    {s.name}
                  </p>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
        <h2 className="mb-2 font-display text-lg">Recreate with tools</h2>
        <p className="mb-3 text-xs text-muted">
          Website or app — sign in on that platform from here. No Play Store detour required.
        </p>
        <PracticeToolsStrip />
      </aside>
    </div>
  );
}
