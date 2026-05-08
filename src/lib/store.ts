import { useSyncExternalStore, useRef, useCallback } from "react";
import type {
  AppState,
  User,
  WasteBatch,
  CompostBatch,
  FarmerRequest,
  ActivityItem,
  Role,
  WasteCategory,
  CompostStage,
} from "./types";

const STORAGE_KEY = "ecoloop_state_v1";

const initial: AppState = {
  users: [],
  currentUserId: null,
  wasteBatches: [],
  compostBatches: [],
  farmerRequests: [],
  activity: [],
};

function load(): AppState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    return { ...initial, ...JSON.parse(raw) };
  } catch {
    return initial;
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function setState(updater: (s: AppState) => AppState) {
  state = updater(state);
  emit();
}

export function getState() {
  return state;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useStore<T>(selector: (s: AppState) => T): T {
  const cache = useRef<{ state: AppState; selector: (s: AppState) => T; result: T } | null>(null);
  const getSnapshot = useCallback(() => {
    if (
      !cache.current ||
      cache.current.state !== state ||
      cache.current.selector !== selector
    ) {
      cache.current = { state, selector, result: selector(state) };
    }
    return cache.current.result;
  }, [selector]);
  const getServerSnapshot = useCallback(() => selector(initial), [selector]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ---------- Helpers ----------
const uid = (p: string) =>
  `${p}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

function logActivity(kind: ActivityItem["kind"], message: string) {
  const item: ActivityItem = {
    id: uid("ACT"),
    kind,
    message,
    createdAt: Date.now(),
  };
  setState((s) => ({ ...s, activity: [item, ...s.activity].slice(0, 200) }));
}

function awardXP(userId: string, xp: number, credits: number) {
  setState((s) => ({
    ...s,
    users: s.users.map((u) => {
      if (u.id !== userId) return u;
      const nx = u.xp + xp;
      const nc = u.credits + credits;
      const badges = new Set(u.badges);
      if (nx >= 50) badges.add("Green Starter");
      if (nx >= 200) badges.add("Compost Hero");
      if (nx >= 500) badges.add("Sustainability Titan");
      if (nx >= 1000) badges.add("Zero Waste Champion");
      return { ...u, xp: nx, credits: nc, badges: Array.from(badges) };
    }),
  }));
}

// ---------- Auth ----------
export function loginOrRegister(input: {
  name: string;
  organization: string;
  role: Role;
  location?: string;
  capacity?: number;
}): User {
  const existing = state.users.find(
    (u) =>
      u.name.toLowerCase() === input.name.toLowerCase() &&
      u.organization.toLowerCase() === input.organization.toLowerCase() &&
      u.role === input.role,
  );
  if (existing) {
    setState((s) => ({ ...s, currentUserId: existing.id }));
    return existing;
  }
  const user: User = {
    id: uid("USR"),
    name: input.name,
    organization: input.organization,
    role: input.role,
    location: input.location,
    capacity: input.capacity,
    credits: 0,
    xp: 0,
    badges: [],
    createdAt: Date.now(),
  };
  setState((s) => ({ ...s, users: [...s.users, user], currentUserId: user.id }));
  logActivity("system", `${user.organization} joined as ${user.role}`);
  return user;
}

export function logout() {
  setState((s) => ({ ...s, currentUserId: null }));
}

export function currentUser(s: AppState = state): User | null {
  return s.users.find((u) => u.id === s.currentUserId) ?? null;
}

// ---------- Waste ----------
export function submitWaste(input: {
  category: WasteCategory;
  weightKg: number;
  notes?: string;
  imageDataUrl?: string;
  urgency: WasteBatch["urgency"];
}): WasteBatch {
  const me = currentUser();
  if (!me) throw new Error("Not signed in");
  const batch: WasteBatch = {
    id: uid("WB"),
    contributorId: me.id,
    contributorName: me.organization,
    ...input,
    status: "Pending Pickup",
    createdAt: Date.now(),
  };
  setState((s) => ({ ...s, wasteBatches: [batch, ...s.wasteBatches] }));
  logActivity(
    "waste",
    `${me.organization} submitted ${input.weightKg}kg ${input.category.toLowerCase()} waste`,
  );
  awardXP(me.id, Math.round(input.weightKg), Math.round(input.weightKg * 2));
  // simulate AI later
  setTimeout(() => runAIVerification(batch.id), 1200);
  return batch;
}

export function runAIVerification(batchId: string) {
  setState((s) => ({
    ...s,
    wasteBatches: s.wasteBatches.map((b) => {
      if (b.id !== batchId) return b;
      const contamination = Math.random() * (b.category === "Contaminated" ? 0.8 : 0.2);
      return {
        ...b,
        ai: {
          category: b.category,
          confidence: 0.82 + Math.random() * 0.17,
          contamination,
        },
      };
    }),
  }));
}

export function acceptPickup(batchId: string) {
  const me = currentUser();
  if (!me) return;
  setState((s) => ({
    ...s,
    wasteBatches: s.wasteBatches.map((b) =>
      b.id === batchId ? { ...b, agentId: me.id } : b,
    ),
  }));
  logActivity("pickup", `${me.name} accepted pickup ${batchId}`);
}

export function markPickedUp(batchId: string) {
  const me = currentUser();
  setState((s) => ({
    ...s,
    wasteBatches: s.wasteBatches.map((b) =>
      b.id === batchId
        ? { ...b, status: "Picked Up", pickedUpAt: Date.now(), agentId: me?.id ?? b.agentId }
        : b,
    ),
  }));
  logActivity("pickup", `Pickup Agent ${me?.name ?? ""} collected ${batchId}`);
}

export function markDelivered(batchId: string) {
  const me = currentUser();
  let createdCompost: CompostBatch | null = null;
  setState((s) => {
    const b = s.wasteBatches.find((x) => x.id === batchId);
    if (!b) return s;
    const updatedWaste = s.wasteBatches.map((x) =>
      x.id === batchId ? { ...x, status: "Delivered" as const, deliveredAt: Date.now() } : x,
    );
    if (b.category !== "Contaminated") {
      createdCompost = {
        id: uid("CB"),
        sourceWasteIds: [b.id],
        weightKg: +(b.weightKg * 0.6).toFixed(1),
        stage: "Received",
        quality: 60 + Math.round(Math.random() * 30),
        createdAt: Date.now(),
      };
    }
    return {
      ...s,
      wasteBatches: updatedWaste,
      compostBatches: createdCompost
        ? [createdCompost, ...s.compostBatches]
        : s.compostBatches,
    };
  });
  logActivity("pickup", `Pickup Agent ${me?.name ?? ""} delivered ${batchId} to compost center`);
  if (createdCompost) {
    logActivity("compost", `Compost Batch ${(createdCompost as CompostBatch).id} received at center`);
  }
}

// ---------- Compost ----------
const STAGE_ORDER: CompostStage[] = ["Received", "Processing", "Drying", "Ready", "Distributed"];
export function advanceCompost(batchId: string) {
  const me = currentUser();
  setState((s) => ({
    ...s,
    compostBatches: s.compostBatches.map((b) => {
      if (b.id !== batchId) return b;
      const idx = STAGE_ORDER.indexOf(b.stage);
      const next = STAGE_ORDER[Math.min(idx + 1, STAGE_ORDER.length - 1)];
      return {
        ...b,
        stage: next,
        operatorId: me?.id ?? b.operatorId,
        readyAt: next === "Ready" ? Date.now() : b.readyAt,
      };
    }),
  }));
  const b = state.compostBatches.find((x) => x.id === batchId);
  if (b) logActivity("compost", `Compost Batch ${b.id} entered ${b.stage} stage`);
}

// ---------- Farmer ----------
export function requestCompost(compostBatchId: string, quantityKg: number): FarmerRequest | null {
  const me = currentUser();
  if (!me) return null;
  const batch = state.compostBatches.find((c) => c.id === compostBatchId);
  if (!batch || batch.stage !== "Ready" || batch.weightKg < quantityKg) return null;
  const req: FarmerRequest = {
    id: uid("FR"),
    farmerId: me.id,
    farmerName: me.name,
    compostBatchId,
    quantityKg,
    status: "Approved",
    createdAt: Date.now(),
  };
  setState((s) => ({
    ...s,
    farmerRequests: [req, ...s.farmerRequests],
    compostBatches: s.compostBatches.map((c) => {
      if (c.id !== compostBatchId) return c;
      const remaining = +(c.weightKg - quantityKg).toFixed(1);
      return {
        ...c,
        weightKg: remaining,
        stage: remaining <= 0 ? "Distributed" : c.stage,
      };
    }),
  }));
  logActivity("farmer", `Farmer ${me.name} requested ${quantityKg}kg compost from ${compostBatchId}`);
  awardXP(me.id, 10, 5);
  return req;
}

// ---------- Analytics ----------
export function analytics(s: AppState = state) {
  const totalWasteKg = s.wasteBatches.reduce((a, b) => a + b.weightKg, 0);
  const activePickups = s.wasteBatches.filter(
    (b) => b.status === "Pending Pickup" || b.status === "Picked Up",
  ).length;
  const compostKg = s.compostBatches.reduce((a, b) => a + b.weightKg, 0);
  const distributedKg = s.farmerRequests.reduce((a, r) => a + r.quantityKg, 0);
  const contaminated = s.wasteBatches.filter((b) => b.category === "Contaminated").length;
  const contaminationRate =
    s.wasteBatches.length === 0 ? 0 : (contaminated / s.wasteBatches.length) * 100;
  // 1kg organic waste diverted ≈ 0.7kg CO2 saved
  const carbonKg = +(totalWasteKg * 0.7).toFixed(1);
  const landfillKg = +(totalWasteKg * 0.85).toFixed(1);
  return {
    totalWasteKg: +totalWasteKg.toFixed(1),
    activePickups,
    compostKg: +compostKg.toFixed(1),
    distributedKg: +distributedKg.toFixed(1),
    contaminationRate: +contaminationRate.toFixed(1),
    carbonKg,
    landfillKg,
  };
}

export function leaderboard(s: AppState = state) {
  return [...s.users]
    .filter((u) => u.role === "contributor")
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 10);
}

// ---------- Seed (demo) ----------
export function seedDemo() {
  if (state.users.length > 0) return;
  const demoUsers: Omit<User, "id" | "createdAt" | "credits" | "xp" | "badges">[] = [
    { name: "Admin", organization: "EcoLoop HQ", role: "admin" },
    { name: "Priya", organization: "MIT College Hostel", role: "contributor", location: "Pune", capacity: 200 },
    { name: "Karan", organization: "Hotel Green Park", role: "contributor", location: "Mumbai", capacity: 150 },
    { name: "Ravi", organization: "EcoLoop Logistics", role: "agent" },
    { name: "Anita", organization: "Pune Compost Center", role: "compost" },
    { name: "Suresh", organization: "Suresh Farms", role: "farmer", location: "Nashik" },
  ];
  demoUsers.forEach((u) => loginOrRegister(u));
  setState((s) => ({ ...s, currentUserId: null }));
}
