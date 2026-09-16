import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CampusShell } from "@/components/campus-shell";
import { Button } from "@/components/ui/button";
import { BOOK } from "@/lib/book-public";
import { claimCertificate, getMyGrowth } from "@/lib/campus-api";

export const Route = createFileRoute("/certificate")({ component: CertificatePage });

function CertificatePage() {
  return (
    <CampusShell require="class">
      <CertificateBody />
    </CampusShell>
  );
}

function CertificateBody() {
  const [cert, setCert] = useState<{ serial: string; name: string; issuedAt: string } | null>(null);
  const [blocked, setBlocked] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const growth = await getMyGrowth();
        if (growth.certificate) {
          setCert(growth.certificate);
          return;
        }
        if (!growth.complete) {
          setBlocked("Finish every chapter and all 30 days first.");
          return;
        }
        setCert(await claimCertificate());
      } catch (err) {
        setBlocked(err instanceof Error ? err.message : "Certificate is not ready.");
      }
    })();
  }, []);

  if (blocked) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="font-display text-3xl tracking-tight">Certificate</h1>
        <p className="text-sm text-muted">{blocked}</p>
        <Button asChild>
          <Link to="/progress">Back to growth</Link>
        </Button>
      </div>
    );
  }

  if (!cert) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;

  const issued = cert.issuedAt ? new Date(cert.issuedAt) : new Date();
  const issuedLabel = Number.isNaN(issued.getTime())
    ? ""
    : issued.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  function saveSvg() {
    const svg = document.getElementById("aea-certificate");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${cert!.serial}.svg`;
    a.click();
    URL.revokeObjectURL(href);
    toast.success("Certificate saved.");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-brass">Completed</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">Digital certificate</h1>
        <p className="mt-2 text-sm text-muted">
          Awarded for finishing Prompt Engineering & AI Content Creation Editing 101.
        </p>
      </div>

      <svg
        id="aea-certificate"
        viewBox="0 0 900 620"
        role="img"
        aria-label="Course certificate"
        className="w-full rounded-xl bg-paper text-ink shadow-[var(--shadow-paper)]"
      >
        <rect x="0" y="0" width="900" height="620" fill="#f4efe4" />
        <rect x="28" y="28" width="844" height="564" fill="none" stroke="#b89a62" strokeWidth="2" />
        <rect x="40" y="40" width="820" height="540" fill="none" stroke="#1a1714" strokeWidth="0.6" />
        <text x="450" y="110" textAnchor="middle" fill="#b89a62" fontFamily="Georgia, serif" fontSize="14" letterSpacing="4">
          AI ECOSYSTEM ACADEMY
        </text>
        <text x="450" y="168" textAnchor="middle" fill="#1a1714" fontFamily="Georgia, serif" fontSize="42">
          Certificate of completion
        </text>
        <text x="450" y="220" textAnchor="middle" fill="#6e675c" fontFamily="system-ui, sans-serif" fontSize="16">
          This certifies that
        </text>
        <text x="450" y="280" textAnchor="middle" fill="#1a1714" fontFamily="Georgia, serif" fontSize="36">
          {cert.name || "Student"}
        </text>
        <text x="450" y="340" textAnchor="middle" fill="#6e675c" fontFamily="system-ui, sans-serif" fontSize="16">
          has completed the 30-day program
        </text>
        <text x="450" y="380" textAnchor="middle" fill="#1a1714" fontFamily="Georgia, serif" fontSize="20">
          {BOOK.title}
        </text>
        <text x="450" y="430" textAnchor="middle" fill="#6e675c" fontFamily="system-ui, sans-serif" fontSize="14">
          {BOOK.author} · {issuedLabel}
        </text>
        <text x="450" y="520" textAnchor="middle" fill="#1a1714" fontFamily="ui-monospace, monospace" fontSize="13">
          {cert.serial}
        </text>
        <text x="450" y="548" textAnchor="middle" fill="#6e675c" fontFamily="system-ui, sans-serif" fontSize="12">
          Unique student certificate · not transferable
        </text>
      </svg>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={saveSvg}>Save certificate</Button>
        <Button asChild variant="outline">
          <Link to="/progress">Back to growth</Link>
        </Button>
      </div>
    </div>
  );
}
