import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, BookOpen, Compass } from "lucide-react";
import { toast } from "sonner";
import { CampusShell } from "@/components/campus-shell";
import { Button } from "@/components/ui/button";
import { claimCertificate, getMyGrowth } from "@/lib/campus-api";

export const Route = createFileRoute("/progress")({ component: ProgressPage });

function ProgressPage() {
  return (
    <CampusShell require="class">
      <GrowthBody />
    </CampusShell>
  );
}

function GrowthBody() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getMyGrowth>> | null>(null);

  async function load() {
    setData(await getMyGrowth());
  }

  useEffect(() => {
    void load().catch((err) => toast.error(err instanceof Error ? err.message : "Could not load growth."));
  }, []);

  if (!data) return <div className="h-40 animate-pulse rounded-xl bg-surface" />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-brass">Growth</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">Your grade</h1>
        <p className="mt-2 text-sm text-muted">
          Each finished chapter and each day on the 30-day roadmap raises the grade. Finish all of them
          for the digital certificate.
        </p>
      </div>

      <section className="rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
        <p className="text-xs uppercase tracking-wider text-muted">Grade</p>
        <p className="mt-1 font-display text-5xl tabular-nums text-brass">{data.percent}%</p>
        <p className="mt-2 text-sm text-muted">
          {data.done} of {data.total} tasks complete
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-raised">
          <div className="h-full bg-brass" style={{ width: `${data.percent}%` }} />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-raised p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
              <Compass className="size-3.5" />
              Roadmap
            </p>
            <p className="mt-1 font-display text-2xl tabular-nums">
              {data.roadmapDone} / 30
            </p>
          </div>
          <div className="rounded-lg bg-raised p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
              <BookOpen className="size-3.5" />
              Chapters
            </p>
            <p className="mt-1 font-display text-2xl tabular-nums">
              {data.chapterDone} / 22
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline" className="flex-1">
          <Link to="/learn/roadmap">Open 30-day roadmap</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link to="/learn">Open the book</Link>
        </Button>
      </div>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Digital certificate</h2>
        {data.complete || data.certificate ? (
          <>
            <p className="mt-2 text-sm text-muted">
              You finished the program. The certificate is yours.
            </p>
            <Button
              className="mt-4"
              onClick={async () => {
                try {
                  await claimCertificate();
                  await load();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not open the certificate.");
                }
              }}
            >
              <Award className="size-4" />
              Open certificate
            </Button>
            <Button asChild variant="outline" className="mt-3">
              <Link to="/certificate">View certificate</Link>
            </Button>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Finish every chapter and all 30 days. The certificate opens automatically at 100%.
          </p>
        )}
      </section>
    </div>
  );
}
