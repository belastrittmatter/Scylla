import {
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "./task-types";

/**
 * The one status map (icon, text tone, timeline bar). Shape carries the
 * meaning; colour stays on neutral tokens so status reads without loud hues.
 */
export const TASK_STATUS_STYLE: Record<
  TaskStatus,
  { Icon: typeof Circle; tone: string; bar: string }
> = {
  todo: {
    Icon: Circle,
    tone: "text-muted-foreground",
    bar: "bg-muted border-border text-foreground",
  },
  in_progress: {
    Icon: CircleDot,
    tone: "text-foreground",
    bar: "bg-muted border-foreground/30 text-foreground",
  },
  in_review: {
    Icon: CircleDashed,
    tone: "text-foreground",
    bar: "bg-muted border-foreground/30 text-foreground",
  },
  done: {
    Icon: CircleCheck,
    tone: "text-muted-foreground",
    bar: "bg-background border-dashed border-border text-muted-foreground",
  },
  cancelled: {
    Icon: CircleX,
    tone: "text-muted-foreground",
    bar: "bg-background border-dashed border-border text-muted-foreground line-through",
  },
};

export function getTaskStatusStyle(status: string) {
  return TASK_STATUS_STYLE[status as TaskStatus] ?? TASK_STATUS_STYLE.todo;
}

export function StatusIcon({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  const { Icon, tone } = getTaskStatusStyle(status);
  return (
    <Icon aria-hidden className={cn("size-3.5 shrink-0", tone, className)} />
  );
}
