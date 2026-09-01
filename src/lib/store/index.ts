import { cookieStore } from "@/lib/store/cookie-store";
import type { ProjectStore } from "@/lib/store/types";

/**
 * The one place the storage backend is chosen.
 *
 * This is a demo, so it runs on the cookie-backed store: seeded jobs from code,
 * viewer edits in their own cookie. Swap in a database implementation here the
 * day real contractor data goes in — nothing above this layer changes.
 */
export const store: ProjectStore = cookieStore;
export type { ProjectStore };
