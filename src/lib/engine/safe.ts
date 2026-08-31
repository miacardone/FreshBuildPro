import type { DeckProject, Evaluation } from "@/lib/engine/types";
import { evaluate } from "@/lib/engine/evaluate";
import { UnsupportedJurisdictionError } from "@/lib/engine/jurisdictions";

export type EvaluationResult =
  | { ok: true; evaluation: Evaluation }
  | { ok: false; unsupported: true; message: string };

/**
 * Evaluate without throwing. An unsupported city is a real answer the UI shows
 * plainly — the engine says it has not learned that city and stops.
 */
export function evaluateSafe(project: DeckProject): EvaluationResult {
  try {
    return { ok: true, evaluation: evaluate(project) };
  } catch (err) {
    if (err instanceof UnsupportedJurisdictionError) {
      return { ok: false, unsupported: true, message: err.message };
    }
    throw err;
  }
}
