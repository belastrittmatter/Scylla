import {
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "./task-types";

const STATUS_ICONS: Record<
  TaskStatus,
  { Icon: typeof Circle; className: string }
> = {
  todo: { Icon: Circle, className: "text-muted-foreground" },
  in_progress: { Icon: CircleDot, className: "text-blue-500" },
  in_review: { Icon: CircleDashed, className: "text-purple-500" },
  done: { Icon: CircleCheck, className: "text-emerald-500" },
  cancelled: { Icon: CircleX, className: "text-muted-foreground" },
};

export function StatusIcon({ status }: { status: TaskStatus }) {
  const { Icon, className } = STATUS_ICONS[status] ?? STATUS_ICONS.todo;
  return <Icon aria-hidden className={cn("size-3.5 shrink-0", className)} />;
}
