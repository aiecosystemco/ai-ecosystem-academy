const KEY = "aea.session";

export type StoredSession = {
  token: string;
  role: "student" | "admin";
  codeHint: string;
};

export function readSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.token || (parsed.role !== "student" && parsed.role !== "admin")) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(session: StoredSession) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}
