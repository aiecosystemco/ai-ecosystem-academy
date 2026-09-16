import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { ProtectContent } from "@/components/protect";
import { listRoadmap, loadProgress, saveProgress } from "@/lib/academy-api";
import { readSession } from "@/lib/session-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/roadmap")({ component: Roadmap });

type Day = { day: number; week: string; task: string };

function Roadmap() {
  const hint = readSession()?.codeHint ?? "AEA";
  const [done, setDone] = useState<Set<string>>(new Set());
  const [days, setDays] = useState<Day[]>([]);

  useEffect(() => {
    const session = readSession();
    if (!session) return;
    void Promise.all([
      loadProgress({ data: { token: session.token, kind: "roadmap" } }),
      listRoadmap({ data: { token: session.token } }),
    ]).then(([progress, roadmap]) => {
      setDone(new Set(progress.items.filter((i) => i.done).map((i) => i.key)));
      setDays(roadmap.days);
    });
  }, []);

  async function toggle(day: number) {
    const key = String(day);
    const next = !done.has(key);
    setDone((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(key);
      else copy.delete(key);
      return copy;
    });
    const session = readSession();
    if (!session) return;
    await saveProgress({
      data: { token: session.token, kind: "roadmap", itemKey: key, done: next },
    });
  }

  const groups = useMemo(() => {
    const map = new Map<string, Day[]>();
    for (const d of days) {
      const list = map.get(d.week) ?? [];
      list.push(d);
      map.set(d.week, list);
    }
    return [...map.entries()];
  }, [days]);

  const count = done.size;

  return (
    <ProtectContent hint={hint}>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl tracking-tight">30-day creator roadmap</h1>
        <p className="mt-2 text-sm text-muted">
          Turn the book into practice. {count} of 30 days complete. Each day you finish raises your grade.
        </p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-raised">
          <div className="h-full bg-brass" style={{ width: `${(count / 30) * 100}%` }} />
        </div>

        <div className="mt-8 space-y-8">
          {groups.map(([week, weekDays]) => (
            <section key={week}>
              <h2 className="mb-3 font-display text-xl">Week — {week}</h2>
              <ul className="space-y-2">
                {weekDays.map((d) => {
                  const on = done.has(String(d.day));
                  return (
                    <li key={d.day}>
                      <button
                        type="button"
                        onClick={() => void toggle(d.day)}
                        className={cn(
                          "flex w-full min-h-14 items-center gap-3 rounded-lg px-3 text-left shadow-[var(--shadow-border)]",
                          on ? "bg-raised" : "bg-surface",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-md",
                            on ? "bg-ok/20 text-ok" : "bg-raised text-muted",
                          )}
                        >
                          {on ? <Check className="size-4" /> : <span className="font-mono text-xs">{d.day}</span>}
                        </span>
                        <span>
                          <span className="block text-[11px] uppercase tracking-wider text-faint">
                            Day {d.day}
                          </span>
                          <span className={cn("block text-sm", on && "text-muted line-through")}>
                            {d.task}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </ProtectContent>
  );
}
