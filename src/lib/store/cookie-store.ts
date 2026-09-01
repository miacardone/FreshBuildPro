import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import type { DeckProject, Evaluation } from "@/lib/engine/types";
import type { ProjectStore } from "@/lib/store/types";
import { SEED_PROJECTS } from "@/lib/store/seed";

/**
 * Demo store.
 *
 * This app is a demo, so it has no database — and a serverless filesystem is
 * read-only and per-instance, which means anything written to disk vanishes on
 * the next request that lands elsewhere. That is fine for the seeded jobs, which
 * come from code, but it breaks the two flows a demo actually exercises:
 * creating a project, and taking a solver option.
 *
 * So: the seeded jobs are the base, and anything the viewer creates or changes
 * rides in their own cookie. No database, no cost, works across instances, and
 * two people demoing at once never see each other's edits.
 *
 * Swap this for a real ProjectStore implementation the moment real jobs go in.
 */

const COOKIE = "fbp_demo";
/** Browsers cap a cookie around 4 KB. Stay under it and drop the oldest edits. */
const MAX_BYTES = 3800;

interface DemoState {
  /** Projects the viewer created, plus full copies of any seed they edited. */
  projects: DeckProject[];
  /** Seed ids the viewer deleted. */
  deleted: string[];
}

const EMPTY: DemoState = { projects: [], deleted: [] };

async function read(): Promise<DemoState> {
  try {
    const raw = (await cookies()).get(COOKIE)?.value;
    if (!raw) return EMPTY;
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    return { projects: parsed.projects ?? [], deleted: parsed.deleted ?? [] };
  } catch {
    return EMPTY; // a malformed cookie should never take the page down
  }
}

async function write(state: DemoState): Promise<void> {
  const trimmed: DemoState = { ...state };
  let encoded = Buffer.from(JSON.stringify(trimmed)).toString("base64url");

  // Oldest edits go first if the viewer has been busy.
  while (encoded.length > MAX_BYTES && trimmed.projects.length > 1) {
    trimmed.projects = trimmed.projects.slice(1);
    encoded = Buffer.from(JSON.stringify(trimmed)).toString("base64url");
  }

  try {
    (await cookies()).set(COOKIE, encoded, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch {
    // cookies() can only be set from a server action or route handler. Reads
    // during render are fine; a failed write just means this edit is not kept.
  }
}

/** Seeds, with viewer edits layered over the top. */
async function merged(): Promise<DeckProject[]> {
  const state = await read();
  const overrides = new Map(state.projects.map((p) => [p.id, p]));
  const deleted = new Set(state.deleted);

  const base = SEED_PROJECTS.filter((p) => !deleted.has(p.id)).map((p) => overrides.get(p.id) ?? p);
  const created = state.projects.filter((p) => !SEED_PROJECTS.some((s) => s.id === p.id));

  return [...base, ...created];
}

/** Evaluations are best-effort in this demo — they are not worth a cookie. */
const evaluationLog = new Map<string, Evaluation[]>();

export const cookieStore: ProjectStore = {
  async list() {
    return (await merged()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async get(id) {
    return (await merged()).find((p) => p.id === id) ?? null;
  },

  async create(input) {
    const now = new Date().toISOString();
    const project: DeckProject = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
    const state = await read();
    state.projects.push(project);
    await write(state);
    return project;
  },

  async update(id, patch) {
    const current = (await merged()).find((p) => p.id === id);
    if (!current) throw new Error(`No project ${id}`);

    const next: DeckProject = { ...current, ...patch, id, updatedAt: new Date().toISOString() };
    const state = await read();
    const i = state.projects.findIndex((p) => p.id === id);
    if (i === -1) state.projects.push(next);
    else state.projects[i] = next;
    await write(state);
    return next;
  },

  async remove(id) {
    const state = await read();
    state.projects = state.projects.filter((p) => p.id !== id);
    if (SEED_PROJECTS.some((s) => s.id === id) && !state.deleted.includes(id)) {
      state.deleted.push(id);
    }
    await write(state);
    evaluationLog.delete(id);
  },

  async recordEvaluation(e) {
    const log = evaluationLog.get(e.projectId) ?? [];
    log.push(e);
    evaluationLog.set(e.projectId, log.slice(-20));
  },

  async evaluations(projectId) {
    return [...(evaluationLog.get(projectId) ?? [])].reverse();
  },
};

/** Put the demo back to the seeded book of jobs. */
export async function resetDemo(): Promise<void> {
  try {
    // The cookie was set with an explicit path, so the delete has to match it —
    // delete(name) alone silently misses and the demo never resets.
    (await cookies()).delete({ name: COOKIE, path: "/" });
  } catch {
    /* only callable from a server action */
  }
  evaluationLog.clear();
}
