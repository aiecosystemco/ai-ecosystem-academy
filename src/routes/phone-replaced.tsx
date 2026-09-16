import { createFileRoute, Link } from "@tanstack/react-router";
import { MonitorSmartphone } from "lucide-react";
import { AcademyMark } from "@/components/academy-mark";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/phone-replaced")({ component: PhoneReplacedPage });

function PhoneReplacedPage() {
  return (
    <div className="relative grid min-h-dvh place-items-start overflow-x-clip bg-bg px-5 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] md:place-items-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(800px 400px at 50% -10%, rgba(196,92,74,0.16), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-md lg:max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-5 flex justify-center text-danger">
            <AcademyMark size={48} />
          </div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-danger">Device logged out</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">Newest device stays on</h1>
        </div>
        <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="flex items-start gap-2 text-sm leading-relaxed">
            <MonitorSmartphone className="mt-0.5 size-4 shrink-0 text-danger" />
            You signed in on another phone or computer of the same kind. This one is logged out of
            campus — class, author lock, and tutor desk. One phone and one computer can stay on at
            the same time. The last device of each kind stays on.
          </p>
          <Button asChild className="mt-6 w-full" size="lg">
            <Link to="/login">Sign in on this device</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
