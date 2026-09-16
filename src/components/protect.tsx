import { useEffect, type ReactNode } from "react";

export function ProtectContent({
  hint,
  children,
}: {
  hint: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const block = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("[data-allow-copy]")) return;
      e.preventDefault();
    };
    const keys = (e: KeyboardEvent) => {
      const combo = e.metaKey || e.ctrlKey;
      if (combo && ["c", "C", "p", "P", "s", "S", "u", "U"].includes(e.key)) {
        const t = e.target as HTMLElement | null;
        if (t?.closest?.("[data-allow-copy]")) return;
        e.preventDefault();
      }
    };
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
      document.removeEventListener("keydown", keys);
    };
  }, []);

  return (
    <div className="relative reader-select-off">
      <div
        className="pointer-events-none absolute inset-x-0 top-8 hidden overflow-hidden sm:block"
        aria-hidden
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-fg/[0.06]">
          Licensed · {hint} · not for share · Licensed · {hint} · not for share · Licensed · {hint}
        </p>
      </div>
      <div className="relative bg-bg">{children}</div>
    </div>
  );
}
