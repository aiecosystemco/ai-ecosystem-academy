import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CampusShell, ClassLed } from "@/components/campus-shell";
import { listClassDays, toggleClassLive } from "@/lib/campus-api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/classes")({ component: ClassesPage });

function ClassesPage() {
  return (
    <CampusShell require="class">
      <ClassList />
    </CampusShell>
  );
}

function ClassList() {
  const [days, setDays] = useState<Awaited<ReturnType<typeof listClassDays>>["days"]>([]);
  const [teach, setTeach] = useState(false);

  async function load() {
    const r = await listClassDays();
    setDays(r.days);
    setTeach(r.canTeach);
  }

  useEffect(() => {
    void load().catch((err) => toast.error(err instanceof Error ? err.message : "Could not load classes."));
  }, []);

  const weeks = [...new Set(days.map((d) => d.week))];

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.24em] text-brass">30-day roadmap</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight">Live classes</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Green light means the class is on. Open a day to enter the chat, hear voice notes, and
        recreate with the tools.
      </p>
      <div className="mt-8 space-y-8">
        {weeks.map((week) => (
          <section key={week}>
            <h2 className="mb-3 font-display text-xl">{week}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {days
                .filter((d) => d.week === week)
                .map((d) => (
                  <div
                    key={d.day}
                    className={cn(
                      "flex items-stretch gap-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] transition-colors hover:bg-raised",
                    )}
                  >
                    <Link
                      to="/class/$day"
                      params={{ day: String(d.day) }}
                      className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-1"
                    >
                      <ClassLed on={d.live} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Day {d.day}</p>
                        <p className="truncate text-xs text-muted">{d.task}</p>
                      </div>
                    </Link>
                    {teach ? (
                      <button
                        type="button"
                        className="min-h-11 shrink-0 rounded-md px-3 text-xs uppercase tracking-wider text-muted hover:bg-raised hover:text-fg"
                        onClick={async () => {
                          try {
                            await toggleClassLive({ data: { day: d.day, live: !d.live } });
                            await load();
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Could not toggle class.");
                          }
                        }}
                      >
                        {d.live ? "End" : "Start"}
                      </button>
                    ) : null}
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
