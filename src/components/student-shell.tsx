import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Compass,
  Home,
  Library,
  LogOut,
  MonitorSmartphone,
  Sparkles,
} from "lucide-react";
import { Wordmark } from "@/components/academy-mark";
import { JoinWhatsApp } from "@/components/whatsapp-join";
import { Button } from "@/components/ui/button";
import { useAcademySession } from "@/lib/use-academy";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const NAV = [
  { to: "/home", label: "Campus", icon: Home },
  { to: "/learn", label: "Curriculum", icon: BookOpen },
  { to: "/learn/tools", label: "Tools", icon: MonitorSmartphone },
  { to: "/learn/prompts", label: "Prompt library", icon: Library },
  { to: "/learn/studio", label: "Studio", icon: Sparkles },
  { to: "/learn/roadmap", label: "30-day roadmap", icon: Compass },
] as const;

export function StudentShell({ children }: { children: ReactNode }) {
  const { session, ready, locked, leave } = useAcademySession({ require: "student" });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-muted">
        Opening the academy…
      </div>
    );
  }

  if (!session) return null;

  const extras = NAV.filter((n) => n.to !== "/learn" && n.to !== "/home");
  const isCurriculum =
    pathname === "/learn" ||
    (pathname.startsWith("/learn/") && !extras.some((n) => pathname.startsWith(n.to)));

  function navClass(to: (typeof NAV)[number]["to"], stacked: boolean) {
    const active = to === "/learn" ? isCurriculum : pathname.startsWith(to);
    return cn(
      "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm",
      stacked && "w-full",
      active ? "bg-raised text-fg" : "text-muted hover:bg-raised hover:text-fg",
    );
  }

  return (
    <div className="min-h-dvh overflow-x-clip bg-bg text-fg lg:flex">
      <a
        href="#book-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brass focus:px-3 focus:py-2 focus:text-brass-fg"
      >
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-bg lg:flex xl:w-64">
        <div className="border-b border-line px-4 py-4">
          <Link to="/learn">
            <Wordmark />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3" aria-label="Book">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className={navClass(item.to, true)}>
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-3">
          {locked ? (
            <span className="rounded-md bg-danger/20 px-2 py-1 text-[11px] uppercase tracking-wider text-danger">
              Locked
            </span>
          ) : (
            <span className="font-mono text-[11px] tracking-wider text-muted">{session.codeHint}</span>
          )}
          <div className="flex items-center gap-1">
            <JoinWhatsApp compact />
            <Button variant="ghost" size="sm" onClick={() => void leave()} aria-label="Leave">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
            <Link to="/learn" className="min-w-0">
              <Wordmark compact />
            </Link>
            <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
              {locked ? (
                <span className="hidden rounded-md bg-danger/20 px-2 py-1 text-[11px] uppercase tracking-wider text-danger sm:inline">
                  Locked
                </span>
              ) : null}
              <JoinWhatsApp compact />
              <span className="hidden font-mono text-[11px] tracking-wider text-muted sm:inline">
                {session.codeHint}
              </span>
              <Button variant="ghost" size="sm" onClick={() => void leave()} aria-label="Leave">
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
          <nav className="scroll-touch mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2" aria-label="Book">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className={navClass(item.to, false)}>
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main
          id="book-main"
          className="mx-auto w-full max-w-6xl px-4 py-8 pb-[max(6rem,env(safe-area-inset-bottom))] lg:px-8 lg:pb-12"
        >
          {session.role === "student" && session.codeHint !== "TUTOR" && session.codeHint !== "AUTHOR" ? (
            <p className="mb-6 rounded-lg bg-raised px-4 py-3 text-sm leading-relaxed text-muted">
              Your unique code is for one person. Do not share it. A new phone or computer logs the
              previous one of that kind out of campus. A second person using it removes the code.
            </p>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
