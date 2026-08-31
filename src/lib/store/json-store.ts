import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { DeckProject, Evaluation } from "@/lib/engine/types";
import type { ProjectStore } from "@/lib/store/types";
import { SEED_PROJECTS } from "@/lib/store/seed";

/**
 * Development store: one JSON file on disk.
 *
 * This is deliberately swappable — everything talks to the ProjectStore
 * interface, so moving to Postgres means writing one more implementation and
 * changing the export in store/index.ts. Nothing above this layer changes.
 *
 * Note: serverless filesystems are read-only, so this falls back to an
 * in-process copy when it cannot write. That is fine for a demo deploy and is
 * the reason a real database goes in before any contractor's data does.
 */

interface Db {
  projects: DeckProject[];
  evaluations: Evaluation[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "projects.json");

let memory: Db | null = null;
let writable = true;

async function load(): Promise<Db> {
  if (memory) return memory;
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    memory = JSON.parse(raw) as Db;
  } catch {
    memory = { projects: [...SEED_PROJECTS], evaluations: [] };
    await save();
  }
  return memory!;
}

async function save(): Promise<void> {
  if (!memory || !writable) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(memory, null, 2), "utf8");
  } catch {
    writable = false; // read-only filesystem — keep serving from memory
  }
}

export const jsonStore: ProjectStore = {
  async list() {
    const db = await load();
    return [...db.projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async get(id) {
    const db = await load();
    return db.projects.find((p) => p.id === id) ?? null;
  },

  async create(input) {
    const db = await load();
    const now = new Date().toISOString();
    const project: DeckProject = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
    db.projects.push(project);
    await save();
    return project;
  },

  async update(id, patch) {
    const db = await load();
    const i = db.projects.findIndex((p) => p.id === id);
    if (i === -1) throw new Error(`No project ${id}`);
    const next = { ...db.projects[i], ...patch, id, updatedAt: new Date().toISOString() };
    db.projects[i] = next;
    await save();
    return next;
  },

  async remove(id) {
    const db = await load();
    db.projects = db.projects.filter((p) => p.id !== id);
    db.evaluations = db.evaluations.filter((e) => e.projectId !== id);
    await save();
  },

  async recordEvaluation(e) {
    const db = await load();
    db.evaluations.push(e);
    // Keep the trail bounded per project — the last 50 runs is plenty of history.
    const forProject = db.evaluations.filter((x) => x.projectId === e.projectId);
    if (forProject.length > 50) {
      const keep = new Set(forProject.slice(-50));
      db.evaluations = db.evaluations.filter((x) => x.projectId !== e.projectId || keep.has(x));
    }
    await save();
  },

  async evaluations(projectId) {
    const db = await load();
    return db.evaluations.filter((e) => e.projectId === projectId).reverse();
  },
};
