import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getMe, signOutSession } from "@/lib/academy-api";
import { openClassSession } from "@/lib/campus-api";
import { isPhoneReplaced, isSharedKick, parseKickRef, rememberKickRef, seatPayload } from "@/lib/seat-guard";
import { clearSession, readSession, writeSession, type StoredSession } from "@/lib/session-client";

async function mintFromCampus(): Promise<StoredSession | null> {
  try {
    const opened = await openClassSession({ data: seatPayload() });
    const next: StoredSession = {
      token: opened.token,
      role: opened.role,
      codeHint: opened.codeHint,
    };
    writeSession(next);
    return next;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (isPhoneReplaced(message) || isSharedKick(message)) throw err;
    return null;
  }
}

export function useAcademySession(opts?: { require?: "student" | "admin" | "any" }) {
  const navigate = useNavigate();
  const require = opts?.require ?? "any";
  const [session, setSession] = useState<StoredSession | null>(null);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback(async () => {
    let stored = readSession();
    if (!stored && require !== "any") {
      try {
        stored = await mintFromCampus();
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        setSession(null);
        setReady(true);
        if (isPhoneReplaced(message)) navigate({ to: "/phone-replaced" });
        else if (isSharedKick(message)) {
          rememberKickRef(parseKickRef(message));
          navigate({ to: "/shared-code" });
        } else navigate({ to: "/home" });
        return;
      }
    }
    if (!stored) {
      setSession(null);
      setReady(true);
      if (require !== "any") navigate({ to: "/home" });
      return;
    }
    try {
      const me = await getMe({
        data: { token: stored.token, ...(stored.role === "student" ? seatPayload() : {}) },
      });
      const next = { token: stored.token, role: me.role, codeHint: me.codeHint };
      writeSession(next);
      setSession(next);
      setLocked(me.locked);
      if (require === "admin" && me.role !== "admin") navigate({ to: "/home" });
      if (require === "student" && me.role === "admin") {
        /* admin may visit student view */
      }
      if (require === "student" && me.role !== "student" && me.role !== "admin") {
        navigate({ to: "/home" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Session ended.";
      if (isSharedKick(message)) {
        clearSession();
        setSession(null);
        setError(message);
        rememberKickRef(parseKickRef(message));
        navigate({ to: "/shared-code" });
        return;
      }
      if (isPhoneReplaced(message)) {
        clearSession();
        setSession(null);
        setError(message);
        navigate({ to: "/phone-replaced" });
        return;
      }
      const minted = await mintFromCampus().catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "";
        if (isPhoneReplaced(message)) {
          clearSession();
          navigate({ to: "/phone-replaced" });
        }
        return null;
      });
      if (minted) {
        try {
          const me = await getMe({
            data: { token: minted.token, ...(minted.role === "student" ? seatPayload() : {}) },
          });
          const next = { token: minted.token, role: me.role, codeHint: me.codeHint };
          writeSession(next);
          setSession(next);
          setLocked(me.locked);
          if (require === "admin" && me.role !== "admin") navigate({ to: "/home" });
          return;
        } catch {
          /* fall through */
        }
      }
      clearSession();
      setSession(null);
      setError(message);
      navigate({ to: "/home" });
    } finally {
      setReady(true);
    }
  }, [navigate, require]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const leave = useCallback(async () => {
    const stored = readSession();
    if (stored) {
      try {
        await signOutSession({ data: { token: stored.token } });
      } catch {
        /* ignore */
      }
    }
    clearSession();
    setSession(null);
    navigate({ to: "/home" });
  }, [navigate]);

  return { session, ready, locked, error, refresh: hydrate, leave };
}
