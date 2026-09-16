import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CampusShell } from "@/components/campus-shell";
import { Button } from "@/components/ui/button";
import { listEarnings } from "@/lib/campus-api";
import { REFERRAL_NGN, REFERRAL_USD } from "@/lib/campus-util";

export const Route = createFileRoute("/earnings")({ component: EarningsPage });

function EarningsPage() {
  return (
    <CampusShell>
      <EarningsBody />
    </CampusShell>
  );
}

function EarningsBody() {
  const [data, setData] = useState<Awaited<ReturnType<typeof listEarnings>> | null>(null);

  useEffect(() => {
    void listEarnings()
      .then(setData)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load earnings."));
  }, []);

  async function copySlug() {
    if (!data?.referralSlug) return;
    try {
      await navigator.clipboard.writeText(data.referralSlug);
      toast.success("Referral code copied.");
    } catch {
      toast.error("Copy failed — select the code instead.");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-brass">Referrals</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">Earnings</h1>
        <p className="mt-2 text-sm text-muted">
          Share your name as a referrer. When they pay for the book you earn ₦{REFERRAL_NGN.toLocaleString()}{" "}
          of ₦5,000 (20%, about US${REFERRAL_USD}).
        </p>
      </div>
      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-xs uppercase tracking-wider text-muted">Your referral code</p>
        <p className="mt-2 font-mono text-xl text-brass">{data?.referralSlug || "…"}</p>
        <Button className="mt-4" variant="outline" onClick={() => void copySlug()}>
          Copy referral code
        </Button>
      </section>
      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="font-display text-2xl">
          ₦{(data?.totalNgn ?? 0).toLocaleString()} · US${data?.totalUsd ?? "0.00"}
        </p>
        <p className="mt-1 text-xs text-muted">Lifetime from this academy</p>
      </section>
      <section className="space-y-2">
        {data?.items.length === 0 ? (
          <p className="rounded-xl bg-surface p-4 text-sm text-muted">No earnings yet.</p>
        ) : (
          data?.items.map((item) => (
            <article key={item.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="text-sm font-medium">
                ₦{item.amountNgn.toLocaleString()} · US${item.amountUsd}
              </p>
              <p className="mt-1 text-xs text-muted">{item.note}</p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
