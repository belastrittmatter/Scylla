import type { TaskScope } from "./task-selectors";
import type { TaskViewMode } from "./task-scope-content";

const VIEWS: readonly TaskViewMode[] = ["list", "board", "timeline"];
const VIEW_STORAGE_KEY = "tasks:view";

export function parseTaskViewMode(
  raw?: string | null,
): TaskViewMode | undefined {
  return VIEWS.find((v) => v === raw);
}

/** URL wins, then the last stored choice, then the scope default. */
export function resolveTaskViewMode(
  scope: TaskScope,
  urlView?: TaskViewMode,
  storedView?: TaskViewMode,
): TaskViewMode {
  return urlView ?? storedView ?? (scope === "team" ? "board" : "list");
}

export function readStoredView(): TaskViewMode | undefined {
  try {
    return parseTaskViewMode(window.localStorage.getItem(VIEW_STORAGE_KEY));
  } catch {
    return undefined; // SSR or storage disabled
  }
}

export function storeView(view: TaskViewMode) {
  try {
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  } catch {
    // storage disabled: the URL still carries the view
  }
}
