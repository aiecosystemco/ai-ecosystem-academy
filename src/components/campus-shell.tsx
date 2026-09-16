import { Link, Navigate, useRouterState } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  CircleUser,
  GraduationCap,
  Home,
  Landmark,
  MessageCircle,
  Megaphone,
  Radio,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/academy-mark";
import { JoinWhatsApp } from "@/components/whatsapp-join";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { CampusProvider, useCampus } from "@/lib/use-campus";
import { cn } from "@/lib/utils";

export function CampusShell({
  children,
  require,
}: {
  children: ReactNode;
  require?: "author" | "class" | "tutor";
}) {
  return (
    <CampusProvider>
      <CampusFrame require={require}>{children}</CampusFrame>
    </CampusProvider>
  );
}

function CampusFrame({
  children,
  require,
}: {
  children: ReactNode;
  require?: "author" | "class" | "tutor";
}) {
  const { me, loading, error, refresh, user, isPending } = useCampus();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (isPending || loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-5 text-center">
        <div className="space-y-3">
          <div className="mx-auto h-24 w-64 max-w-full animate-pulse rounded-xl bg-surface" />
          <p className="text-xs text-faint">Opening campus…</p>
        </div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (error && !me) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-5 text-center">
        <div className="max-w-sm space-y-4">
          <p className="text-sm text-muted">{error}</p>
          <button
            type="button"
            className="mx-auto block min-h-11 text-sm text-brass underline-offset-4 hover:underline"
            onClick={() => void refresh()}
          >
            Try again
          </button>
          <JoinWhatsApp />
          <Link to="/home" className="block text-sm text-brass underline-offset-4 hover:underline">
            Back to campus
          </Link>
        </div>
      </div>
    );
  }
  if (require === "author" && me?.role !== "author") return <Navigate to="/home" />;
  if (require === "class" && !me?.canEnterClass) return <Navigate to="/home" />;
  if (require === "tutor" && me?.role !== "tutor" && me?.role !== "author") {
    return <Navigate to="/home" />;
  }

  const nav = [
    { to: "/home", label: "Home", icon: Home, show: true },
    { to: "/classes", label: "Classes", icon: Radio, show: Boolean(me?.canEnterClass) },
    { to: "/progress", label: "Progress", icon: Award, show: Boolean(me?.canEnterClass) },
    { to: "/public", label: "Public", icon: Megaphone, show: true },
    { to: "/earnings", label: "Earnings", icon: Wallet, show: true },
    { to: "/learn", label: "Book", icon: BookOpen, show: Boolean(me?.canReadBook) },
    { to: "/tutor", label: "Tutor desk", icon: GraduationCap, show: me?.role === "tutor" || me?.role === "author" },
    { to: "/author", label: "Author", icon: Landmark, show: me?.role === "author" },
    { to: "/author/whatsapp", label: "WhatsApp", icon: MessageCircle, show: me?.role === "author" },
    { to: "/account", label: "Account", icon: CircleUser, show: true },
  ] as const;

  const links = nav.filter((item) => item.show);

  function navClass(to: string, stacked: boolean) {
    const active =
      to === "/home"
        ? pathname === "/home"
        : pathname === to || (to !== "/author" && pathname.startsWith(`${to}/`));
    return cn(
      "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm",
      stacked && "w-full",
      active ? "bg-raised text-fg" : "text-muted hover:bg-raised hover:text-fg",
    );
  }

  return (
    <div className="min-h-dvh overflow-x-clip bg-bg text-fg lg:flex">
      <a
        href="#campus-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brass focus:px-3 focus:py-2 focus:text-brass-fg"
      >
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-bg lg:flex xl:w-64">
        <div className="border-b border-line px-4 py-4">
          <Link to="/home">
            <Wordmark />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3" aria-label="Campus">
          {links.map((item) => {
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
          <JoinWhatsApp compact />
          <UserButton imageUrl={me?.avatar} />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
            <Link to="/home" className="min-w-0">
              <Wordmark compact />
            </Link>
            <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
              <JoinWhatsApp compact />
              <UserButton imageUrl={me?.avatar} />
            </div>
          </div>
          <nav className="scroll-touch mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2" aria-label="Campus">
            {links.map((item) => {
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
          id="campus-main"
          className="mx-auto max-w-6xl px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function AuthorOnly({ children }: { children: ReactNode }) {
  return (
    <CampusProvider>
      <AuthorOnlyFrame>{children}</AuthorOnlyFrame>
    </CampusProvider>
  );
}

function AuthorOnlyFrame({ children }: { children: ReactNode }) {
  const { me, loading, user, isPending } = useCampus();
  if (isPending || loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-5 text-center">
        <div className="space-y-3">
          <div className="mx-auto h-24 w-64 max-w-full animate-pulse rounded-xl bg-surface" />
          <p className="text-xs text-faint">Opening campus…</p>
        </div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (me?.role !== "author") return <Navigate to="/home" />;
  return <>{children}</>;
}

export function ClassLed({ on, label }: { on: boolean; label?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn("size-3 rounded-full", on ? "led-on" : "led-off")}
        aria-hidden
      />
      {label ? (
        <span className={cn("text-xs uppercase tracking-wider", on ? "text-ok" : "text-danger")}>
          {on ? "Class on" : "Class off"}
        </span>
      ) : (
        <span className="sr-only">{on ? "Class on" : "Class off"}</span>
      )}
    </span>
  );
}
