import { describe, expect, test } from "bun:test";
import {
  CreateBookingSchema,
  UpdateBookingSchema,
  CreateTeamSchema,
  UpdateTeamSchema,
  AddTeamMemberSchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  ListTasksQuerySchema,
} from "../../src/services/api-schemas";

describe("API Zod Schemas Validation", () => {
  test("CreateTeamSchema validates valid, invalid input, and max lengths", () => {
    const valid = CreateTeamSchema.safeParse({ name: "Engineering" });
    expect(valid.success).toBe(true);

    const invalidEmpty = CreateTeamSchema.safeParse({ name: "" });
    expect(invalidEmpty.success).toBe(false);

    const invalidTooLong = CreateTeamSchema.safeParse({ name: "a".repeat(101) });
    expect(invalidTooLong.success).toBe(false);
  });

  test("UpdateTeamSchema validates partial fields and constraints", () => {
    const valid = UpdateTeamSchema.safeParse({ name: "Platform", description: "Infra team" });
    expect(valid.success).toBe(true);

    const invalid = UpdateTeamSchema.safeParse({ description: "a".repeat(501) });
    expect(invalid.success).toBe(false);
  });

  test("AddTeamMemberSchema validates role enum and accepts email or userId", () => {
    const validUserId = AddTeamMemberSchema.safeParse({ userId: "u1", role: "admin" });
    expect(validUserId.success).toBe(true);

    const validEmail = AddTeamMemberSchema.safeParse({
      email: "colleague@example.com",
      role: "member",
    });
    expect(validEmail.success).toBe(true);

    const invalidRole = AddTeamMemberSchema.safeParse({ userId: "u1", role: "superhero" });
    expect(invalidRole.success).toBe(false);

    const missingBoth = AddTeamMemberSchema.safeParse({ role: "admin" });
    expect(missingBoth.success).toBe(false);

    const invalidEmail = AddTeamMemberSchema.safeParse({ email: "not-an-email" });
    expect(invalidEmail.success).toBe(false);
  });

  test("CreateProjectSchema requires teamId and name, checks constraints", () => {
    const valid = CreateProjectSchema.safeParse({
      teamId: "t1",
      name: "Alpha",
      color: "#ff0000",
    });
    expect(valid.success).toBe(true);

    const invalidName = CreateProjectSchema.safeParse({ name: "Alpha" });
    expect(invalidName.success).toBe(false);

    const invalidColor = CreateProjectSchema.safeParse({
      teamId: "t1",
      name: "Alpha",
      color: "not-a-color",
    });
    expect(invalidColor.success).toBe(false);
  });

  test("UpdateProjectSchema validates partial fields", () => {
    const valid = UpdateProjectSchema.safeParse({ status: "archived" });
    expect(valid.success).toBe(true);

    const invalid = UpdateProjectSchema.safeParse({ status: "unknown_status" });
    expect(invalid.success).toBe(false);
  });

  test("CreateTaskSchema validates enums and strictly validates dueDate", () => {
    const valid = CreateTaskSchema.safeParse({
      teamId: "t1",
      title: "Fix bug",
      status: "in_progress",
      priority: "high",
      dueDate: "2026-11-01T12:00:00.000Z",
    });
    expect(valid.success).toBe(true);

    const invalidStatus = CreateTaskSchema.safeParse({
      teamId: "t1",
      title: "Fix bug",
      status: "invalid_status",
    });
    expect(invalidStatus.success).toBe(false);

    const invalidDate = CreateTaskSchema.safeParse({
      teamId: "t1",
      title: "Fix bug",
      dueDate: "invalid",
    });
    expect(invalidDate.success).toBe(false);
  });

  test("UpdateTaskSchema accepts partial fields and strictly validates dueDate", () => {
    const valid = UpdateTaskSchema.safeParse({
      status: "done",
      description: null,
      dueDate: new Date("2026-12-01T00:00:00.000Z"),
    });
    expect(valid.success).toBe(true);

    const invalidDate = UpdateTaskSchema.safeParse({
      dueDate: "not-a-valid-date",
    });
    expect(invalidDate.success).toBe(false);
  });

  test("ListTasksQuerySchema requires teamId", () => {
    expect(ListTasksQuerySchema.safeParse({ teamId: "t1" }).success).toBe(true);
    expect(ListTasksQuerySchema.safeParse({}).success).toBe(false);
  });

  test("CreateBookingSchema validates payload and accepts optional/nullable projectId", () => {
    const validWithProject = CreateBookingSchema.safeParse({
      title: "Sprint Planning",
      startTime: "2026-11-01T09:00:00.000Z",
      endTime: "2026-11-01T10:00:00.000Z",
      projectId: "proj_123",
    });
    expect(validWithProject.success).toBe(true);
    if (validWithProject.success) {
      expect(validWithProject.data.projectId).toBe("proj_123");
    }

    const validWithNullProject = CreateBookingSchema.safeParse({
      title: "1:1 Sync",
      startTime: "2026-11-01T11:00:00.000Z",
      endTime: "2026-11-01T11:30:00.000Z",
      projectId: null,
    });
    expect(validWithNullProject.success).toBe(true);

    const validWithoutProject = CreateBookingSchema.safeParse({
      title: "Quick Chat",
      startTime: "2026-11-01T14:00:00.000Z",
      endTime: "2026-11-01T14:30:00.000Z",
    });
    expect(validWithoutProject.success).toBe(true);

    const invalidEndBeforeStart = CreateBookingSchema.safeParse({
      title: "Invalid Time Booking",
      startTime: "2026-11-01T10:00:00.000Z",
      endTime: "2026-11-01T09:00:00.000Z",
    });
    expect(invalidEndBeforeStart.success).toBe(false);
  });

  test("UpdateBookingSchema accepts partial fields and optional/nullable projectId", () => {
    const validUpdateProject = UpdateBookingSchema.safeParse({
      projectId: "proj_456",
      title: "Updated Roadmap Review",
    });
    expect(validUpdateProject.success).toBe(true);
    if (validUpdateProject.success) {
      expect(validUpdateProject.data.projectId).toBe("proj_456");
    }

    const validClearProject = UpdateBookingSchema.safeParse({
      projectId: null,
    });
    expect(validClearProject.success).toBe(true);
  });
});
