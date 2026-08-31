import { jsonStore } from "@/lib/store/json-store";
import type { ProjectStore } from "@/lib/store/types";

/**
 * The one place the storage backend is chosen.
 * Swap in a Postgres implementation here when real projects go in.
 */
export const store: ProjectStore = jsonStore;
export type { ProjectStore };
