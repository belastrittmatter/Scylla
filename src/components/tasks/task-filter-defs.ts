import { TASK_FORM_PRIORITIES, TASK_FORM_STATUSES } from "./task-types";
import type { DeadlineHorizon, TaskFilters } from "./task-types";

interface Option<V extends string = string> {
  value: V;
  label: string;
}

/** One filter as rendered by the Filter menu (radio submenu) and its chip; "all" = unset. */
export interface TaskFilterDef {
  label: string;
  value: string;
  allLabel: string;
  options: ReadonlyArray<Option>;
  onChange: (value: string) => void;
}

const DEADLINE_OPTIONS: ReadonlyArray<Option<Exclude<DeadlineHorizon, "all">>> =
  [
    { value: "overdue", label: "Overdue" },
    { value: "today", label: "Due today" },
    { value: "upcoming", label: "Upcoming" },
    { value: "no_date", label: "No due date" },
  ];

function def<V extends string>(
  label: string,
  value: V | "all",
  options: ReadonlyArray<Option<V>>,
  onChange: (value: V | "all") => void,
  allLabel = "All",
): TaskFilterDef {
  return {
    label,
    value,
    allLabel,
    options,
    // Menu values are untyped strings; map back through the options.
    onChange: (v) =>
      onChange(options.find((o) => o.value === v)?.value ?? "all"),
  };
}

export function buildTaskFilterDefs({
  filters,
  onFiltersChange,
  hidesClosed,
}: {
  filters: TaskFilters;
  onFiltersChange: (next: TaskFilters) => void;
  /** Closed tasks are hidden unless a status is picked, so the default reads "Open". */
  hidesClosed: boolean;
}): TaskFilterDef[] {
  const set = (patch: Partial<TaskFilters>) =>
    onFiltersChange({ ...filters, ...patch });
  return [
    def(
      "Status",
      filters.status,
      TASK_FORM_STATUSES,
      (status) => set({ status }),
      hidesClosed ? "Open" : "All",
    ),
    def("Priority", filters.priority, TASK_FORM_PRIORITIES, (priority) =>
      set({ priority }),
    ),
    def("Deadline", filters.deadlineHorizon, DEADLINE_OPTIONS, (d) =>
      set({ deadlineHorizon: d }),
    ),
  ];
}
