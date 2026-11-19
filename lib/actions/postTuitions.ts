const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";

export type Tuition = {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  mode: string;
  fee: string;
  days: string;
  bannerName: string;
  description: string;
  status?: string;
  createdAt?: string;
  /** true when the tuition is only saved in this browser (backend not reachable yet) */
  isLocal?: boolean;
};

type TuitionInput = {
  title: string;
  subject: string;
  classLevel: string;
  mode: string;
  fee: string;
  days: string;
  bannerName: string;
  description: string;
};

/* Local fallback: keeps a just-posted tuition visible in "My Tuitions" even if
   the backend is offline or does not expose a per-tutor filter yet. */
export const LOCAL_KEY = "tuitora:my-tuitions";
export const TUITIONS_CHANGED_EVENT = "tuitora:tuitions-changed";

export const saveLocalTuition = (data: TuitionInput) => {
  if (typeof window === "undefined") return;
  const tuition: Tuition = {
    ...data,
    id: `local-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
    isLocal: true,
  };
  try {
    const existing = readLocalTuitions();
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify([tuition, ...existing]));
    window.dispatchEvent(new Event(TUITIONS_CHANGED_EVENT));
  } catch {
    /* storage unavailable (private mode / quota) — ignore */
  }
};

export const readLocalTuitions = (): Tuition[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Tuition[]) : [];
  } catch {
    return [];
  }
};

export const createTuition = async (data: TuitionInput) => {
  const response = await fetch(`${BASE_URL}/courses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create tuition");
  }
  return response.json();
};

export const getTuitions = async (): Promise<Tuition[]> => {
  const response = await fetch(`${BASE_URL}/courses`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch tuitions");
  }
  const payload = await response.json();
  const list = Array.isArray(payload) ? payload : payload?.data ?? [];

  return list.map((item: Record<string, unknown>, index: number) => ({
    id: String(item._id ?? item.id ?? `tuition-${index}`),
    title: String(item.title ?? "Untitled tuition"),
    subject: String(item.subject ?? ""),
    classLevel: String(item.classLevel ?? ""),
    mode: String(item.mode ?? ""),
    fee: String(item.fee ?? ""),
    days: String(item.days ?? ""),
    bannerName: String(item.bannerName ?? ""),
    description: String(item.description ?? ""),
    status: String(item.status ?? "pending"),
    createdAt: item.createdAt ? String(item.createdAt) : undefined,
  }));
};
