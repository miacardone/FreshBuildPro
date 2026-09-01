import { notFound } from "next/navigation";
import { store } from "@/lib/store";
import { evaluate } from "@/lib/engine/evaluate";
import type { DeckProject, Evaluation } from "@/lib/engine/types";

/**
 * Load a project and its current evaluation for a tab page. The layout has
 * already handled the unsupported-jurisdiction case, so tabs can assume a
 * covered city.
 */
export async function loadProject(id: string): Promise<{ project: DeckProject; evaluation: Evaluation }> {
  const project = await store.get(id);
  if (!project) notFound();
  return { project, evaluation: evaluate(project) };
}
