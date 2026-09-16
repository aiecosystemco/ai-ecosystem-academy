import { cn } from "@/lib/utils";

export function AcademyMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <img
      src="/aea-mark.png"
      alt="AI Ecosystem"
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-fg sm:gap-3">
      <AcademyMark size={compact ? 36 : 52} />
      <div className="min-w-0 leading-tight">
        <p className="font-display text-[11px] uppercase tracking-[0.16em] text-brass sm:tracking-[0.22em]">
          Academy
        </p>
        {!compact ? <p className="font-display text-lg tracking-tight">Private class</p> : null}
      </div>
    </div>
  );
}
