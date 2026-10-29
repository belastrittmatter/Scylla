import { TaskService } from "@/services/task/task-service";
import { CreateTaskSchema } from "@/services/api-schemas";
import { resolveUserId } from "@/services/api-utils";
import type { TaskPriority, TaskStatus } from "@/services/task/task-types";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");
    if (!teamId) {
      return Response.json(
        { error: "teamId parameter is required" },
        { status: 400 },
      );
    }

    const projectId = url.searchParams.get("projectId") || undefined;
    const statusParam = url.searchParams.get("status");
    const priorityParam = url.searchParams.get("priority");
    const assigneeId = url.searchParams.get("assigneeId") || undefined;
    const overdue = url.searchParams.get("overdue") === "true";

    const status = statusParam
      ? (statusParam.split(",") as TaskStatus[])
      : undefined;
    const priority = priorityParam
      ? (priorityParam.split(",") as TaskPriority[])
      : undefined;

    const tasks = await TaskService.listTasks({
      teamId,
      projectId,
      status: status && status.length === 1 ? status[0] : status,
      priority: priority && priority.length === 1 ? priority[0] : priority,
      assigneeId,
      overdue,
    });

    return Response.json(tasks, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to list tasks" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const parseResult = CreateTaskSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const data = parseResult.data;
    const creatorId = await resolveUserId(req, data.creatorId);
    if (!creatorId) {
      return Response.json(
        { error: "creatorId is required when unauthenticated" },
        { status: 400 },
      );
    }

    const dueDate = data.dueDate ? new Date(data.dueDate) : undefined;

    const newTask = await TaskService.createTask({
      title: data.title,
      description: data.description,
      status: data.status ?? "todo",
      priority: data.priority ?? "medium",
      teamId: data.teamId,
      projectId: data.projectId,
      creatorId,
      assigneeId: data.assigneeId,
      dueDate,
      estimatedMinutes: data.estimatedMinutes,
    });

    return Response.json(newTask, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create task";
    if (message.includes("not found")) {
      return Response.json({ error: message }, { status: 404 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
