import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCampusMe, type CampusMe } from "@/lib/campus-api";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { isPhoneReplaced, isSharedKick, seatPayload } from "@/lib/seat-guard";
import { clearSession } from "@/lib/session-client";

type CampusState = {
  me: CampusMe | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  user: ReturnType<typeof useCurrentUserState>["user"];
  isPending: boolean;
};

const CampusContext = createContext<CampusState | null>(null);

function leaveReplaced(message: string) {
  const path = isPhoneReplaced(message) ? "/phone-replaced" : "/shared-code";
  void signOut().finally(() => {
    if (typeof window !== "undefined") window.location.assign(path);
  });
}

async function fetchMe() {
  const pending = getCampusMe({ data: seatPayload() });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Campus is taking too long. Try again.")), 12_000);
  });
  try {
    const next = await Promise.race([pending, timeout]);
    if (!next || typeof next !== "object" || typeof (next as CampusMe).role !== "string") {
      throw new Error("Could not load campus.");
    }
    return next;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function CampusProviderInner({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id ?? null;
  const [me, setMe] = useState<CampusMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isPending) return;
    if (!userId) {
      setMe(null);
      setLoading(false);
      setError(null);
      clearSession();
      return;
    }
    try {
      const next = await fetchMe();
      setMe(next);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load campus.";
      if (isPhoneReplaced(message) || isSharedKick(message)) {
        setMe(null);
        setError(message);
        leaveReplaced(message);
        return;
      }
      setMe(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId, isPending]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;
    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      void refresh();
    };
    const id = window.setInterval(tick, 20_000);
    const onVis = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [userId, refresh]);

  const value = useMemo<CampusState>(
    () => ({
      me,
      loading: isPending || (loading && !me),
      error,
      refresh,
      user,
      isPending,
    }),
    [me, loading, error, refresh, user, isPending],
  );

  return createElement(CampusContext.Provider, { value }, children);
}

/** Nested shells reuse the nearest provider so campus does not remount per page. */
export function CampusProvider({ children }: { children: ReactNode }) {
  const existing = useContext(CampusContext);
  if (existing) return children;
  return createElement(CampusProviderInner, null, children);
}

export function useCampus(): CampusState {
  const ctx = useContext(CampusContext);
  if (!ctx) {
    throw new Error("useCampus must be used inside CampusShell.");
  }
  return ctx;
}
