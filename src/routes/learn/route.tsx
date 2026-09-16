import { createFileRoute, Navigate, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StudentShell } from "@/components/student-shell";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getCampusMe, openClassSession } from "@/lib/campus-api";
import { isPhoneReplaced, isSharedKick, parseKickRef, rememberKickRef, seatPayload } from "@/lib/seat-guard";
import { writeSession } from "@/lib/session-client";

export const Route = createFileRoute("/learn")({
  component: LearnLayout,
});

function LearnLayout() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [gate, setGate] = useState<"loading" | "ok" | "home">("loading");

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setGate("home");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const me = await getCampusMe({ data: seatPayload() });
        if (!me.canReadBook) {
          if (!cancelled) setGate("home");
          return;
        }
        const opened = await openClassSession({ data: seatPayload() });
        writeSession({
          token: opened.token,
          role: opened.role,
          codeHint: opened.codeHint,
        });
        if (!cancelled) setGate("ok");
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (isPhoneReplaced(message)) {
          navigate({ to: "/phone-replaced" });
          return;
        }
        if (isSharedKick(message)) {
          rememberKickRef(parseKickRef(message));
          navigate({ to: "/shared-code" });
          return;
        }
        if (!cancelled) setGate("home");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isPending, navigate]);

  if (isPending || gate === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-muted">
        Opening the academy…
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (gate === "home") return <Navigate to="/home" />;
  return (
    <StudentShell>
      <Outlet />
    </StudentShell>
  );
}
