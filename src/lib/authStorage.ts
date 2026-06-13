import type { Platoon, PublicUser } from "@/types/user";

const PLATOONS: Platoon[] = ["A", "B", "C", "D", "E"];

const SESSION_KEY = "tagabia_session";

interface StoredSession {
  user: PublicUser;
  credentials: {
    id: string;
    password: string;
  };
}

function isStoredSession(value: unknown): value is StoredSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as StoredSession;
  return (
    typeof session.user?.id === "string" &&
    typeof session.user?.fullname === "string" &&
    PLATOONS.includes(session.user?.platoon) &&
    typeof session.user?.team === "number" &&
    typeof session.credentials?.id === "string" &&
    typeof session.credentials?.password === "string"
  );
}

export function saveSession(
  user: PublicUser,
  credentials: StoredSession["credentials"],
): void {
  const session: StoredSession = { user, credentials };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): StoredSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isStoredSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
