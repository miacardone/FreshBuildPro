import type { DeckProject, Evaluation } from "@/lib/engine/types";

export interface ProjectStore {
  list(): Promise<DeckProject[]>;
  get(id: string): Promise<DeckProject | null>;
  create(input: Omit<DeckProject, "id" | "createdAt" | "updatedAt">): Promise<DeckProject>;
  update(id: string, patch: Partial<DeckProject>): Promise<DeckProject>;
  remove(id: string): Promise<void>;
  /** Append an evaluation to the audit trail. */
  recordEvaluation(e: Evaluation): Promise<void>;
  /** Evaluations for a project, newest first. */
  evaluations(projectId: string): Promise<Evaluation[]>;
}
