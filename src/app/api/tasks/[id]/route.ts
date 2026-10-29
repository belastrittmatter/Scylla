import { TaskService } from "@/services/task/task-service";
import { UpdateTaskSchema } from "@/services/api-schemas";
import { resolveUserId } from "@/services/api-utils";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(_req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ error: "Task ID is required" }, { status: 400 });
    }

    const task = await TaskService.getTaskById(id);
    if (!task) {
      return Response.json(
        { error: `Task not found for id: ${id}` },
        { status: 404 },
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

    const userId = await resolveUserId(req);
    const updated = await TaskService.updateTask(
      id,
      {
        ...data,
        dueDate,
      },
      userId || undefined,
    );

    return Response.json(updated, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update task";
    if (message.includes("not found")) {
      return Response.json({ error: message }, { status: 404 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ error: "Task ID is required" }, { status: 400 });
    }

    await TaskService.deleteTask(id);
    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to delete task" },
      { status: 500 },
    );
  }
}
