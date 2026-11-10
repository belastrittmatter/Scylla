import { z } from "zod";
import { TaskService, TaskAccessError } from "@/services/task/task-service";
import { TeamService } from "@/services/team/team-service";
import { UpdateTaskSchema } from "@/services/api-schemas";
import { resolveUserId } from "@/services/api-utils";

const TaskIdSchema = z.string().trim().min(1).max(128);

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

// Non-members get the same 404 as a missing task so ids can't be probed.
function taskAccessErrorResponse(err: unknown): Response | null {
  if (!(err instanceof TaskAccessError)) return null;
  return err.access === "not_member"
    ? Response.json({ error: "Task not found" }, { status: 404 })
    : Response.json({ error: err.message }, { status: 403 });
}

export async function GET(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ error: "Task ID is required" }, { status: 400 });
    }

    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await TaskService.getTaskById(id);
    if (!task) {
      return Response.json(
        { error: `Task not found for id: ${id}` },
        { status: 404 },
      );
    }

    const isMember = await TeamService.isTeamMember(task.teamId, callerId);
    if (!isMember) {
      return Response.json(
        { error: "Forbidden: Not a member of this team" },
        { status: 403 },
      );
    }

    return Response.json(task, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to get task" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ error: "Task ID is required" }, { status: 400 });
    }

    const userId = await resolveUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const parseResult = UpdateTaskSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const data = parseResult.data;
    const dueDate =
      data.dueDate === null
        ? null
        : data.dueDate !== undefined
          ? new Date(data.dueDate)
          : undefined;

    const updated = await TaskService.updateTask(
      id,
      {
        ...data,
        dueDate,
      },
      userId,
    );

    return Response.json(updated, { status: 200 });
  } catch (err) {
    const denied = taskAccessErrorResponse(err);
    if (denied) return denied;
    const message =
      err instanceof Error ? err.message : "Failed to update task";
    if (message.includes("not found")) {
      return Response.json({ error: message }, { status: 404 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteParams) {
  try {
    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsedId = TaskIdSchema.safeParse((await context.params).id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid task ID" }, { status: 400 });
    }
    const id = parsedId.data;

    const deleted = await TaskService.deleteTask(id, callerId);
    if (!deleted) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }
    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    const denied = taskAccessErrorResponse(err);
    if (denied) return denied;
    console.error("[DELETE /api/tasks/:id] failed", err);
    return Response.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
