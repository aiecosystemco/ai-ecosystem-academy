import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CampusShell } from "@/components/campus-shell";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { listTutorDesk, rateStudent, saveBookAd } from "@/lib/campus-api";

export const Route = createFileRoute("/tutor")({ component: TutorPage });

function TutorPage() {
  return (
    <CampusShell require="tutor">
      <TutorDesk />
    </CampusShell>
  );
}

function TutorDesk() {
  const [data, setData] = useState<Awaited<ReturnType<typeof listTutorDesk>> | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    setData(await listTutorDesk());
  }

  useEffect(() => {
    void load().catch((err) => toast.error(err instanceof Error ? err.message : "Could not open tutor desk."));
    const id = window.setInterval(() => void load().catch(() => undefined), 8000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-brass">Tutors</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">Tutor desk</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          You see the students in the batch the author assigned. You cannot see every unique code
          — only a hint for people in your class. Rate them, post in live class, and advertise a
          book.
        </p>
        <p className="mt-2 text-sm text-brass">
          Assigned: {data?.assignedBatch || "Waiting for the author to assign a badge"}
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl">Your students</h2>
        <p className="mb-3 text-sm text-muted">
          {data?.classLive
            ? `Class is on${data.liveDays?.length ? ` · day ${data.liveDays.join(", ")}` : ""}. Active students are in the room.`
            : "Class is off. Online means they are signed in on campus."}
        </p>
        {data?.students.length === 0 ? (
          <p className="rounded-xl bg-surface p-4 text-sm text-muted">
            No students in this class yet.
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {(["active", "offline"] as const).map((bucket) => {
              const list = (data?.students ?? []).filter((st) =>
                bucket === "active" ? st.online : !st.online,
              );
              return (
                <div key={bucket}>
                  <h3 className={`mb-2 text-sm font-medium ${bucket === "active" ? "text-ok" : "text-muted"}`}>
                    {bucket === "active"
                      ? `${data?.classLive ? "In class" : "Online"} · ${list.length}`
                      : `Offline · ${list.length}`}
                  </h3>
                  {list.length === 0 ? (
                    <p className="rounded-xl bg-surface p-4 text-sm text-muted">
                      {bucket === "active" ? "No one is here yet." : "No offline students."}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {list.map((st) => (
                        <article key={st.userId} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="flex items-center gap-2 font-medium">
                              <span className={`size-2 rounded-full ${st.online ? "bg-ok" : "bg-faint"}`} />
                              {st.name}
                            </p>
                            <p className="font-mono text-xs text-faint">{st.codeHint || "No code yet"}</p>
                          </div>
                          <p className="mt-1 text-xs text-muted">
                            {st.batch} · grade {st.grade ?? 0}%
                            {st.complete ? " · program finished" : ""}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                type="button"
                                className={`size-11 rounded-md ${n <= st.score ? "bg-brass text-brass-fg" : "bg-raised text-muted"}`}
                                onClick={async () => {
                                  await rateStudent({
                                    data: {
                                      studentUserId: st.userId,
                                      score: n,
                                      note: notes[st.userId] ?? st.note,
                                    },
                                  });
                                  toast.success("Rated.");
                                  await load();
                                }}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <Input
                              value={notes[st.userId] ?? st.note}
                              onChange={(e) => setNotes((n) => ({ ...n, [st.userId]: e.target.value }))}
                              placeholder="Note"
                            />
                            <Button
                              variant="outline"
                              className="sm:shrink-0"
                              onClick={async () => {
                                await rateStudent({
                                  data: {
                                    studentUserId: st.userId,
                                    score: st.score || 1,
                                    note: notes[st.userId] ?? st.note,
                                  },
                                });
                                toast.success("Saved.");
                                await load();
                              }}
                            >
                              Save note
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Advertise a book</h2>
        <p className="mt-1 text-sm text-muted">Shown on the public page. You still cannot issue student codes.</p>
        <Input className="mt-4" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <Textarea className="mt-3" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="About the book" />
        <Input className="mt-3" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (optional)" />
        <Button
          className="mt-4"
          onClick={async () => {
            try {
              await saveBookAd({ data: { title, body, link } });
              setTitle("");
              setBody("");
              setLink("");
              toast.success("Book listed.");
              await load();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not save.");
            }
          }}
        >
          Publish
        </Button>
        <div className="mt-4 space-y-2">
          {data?.ads.map((ad) => (
            <p key={ad.id} className="text-sm text-muted">
              {ad.title}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
