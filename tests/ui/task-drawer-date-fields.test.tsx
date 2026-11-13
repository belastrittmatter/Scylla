import { renderToString } from "react-dom/server";
import { describe, expect, it } from "bun:test";
import { TaskDrawerDateFields } from "@/components/tasks/task-drawer-date-fields";
import { TaskDrawerForm } from "@/components/tasks/task-drawer-form";

const RANGE_ERROR = "Start date must be on or before the due date";
const noop = () => {};

function renderDateFields(startDateStr: string, dueDateStr: string): string {
  return renderToString(
    <TaskDrawerDateFields
      startDateStr={startDateStr}
      dueDateStr={dueDateStr}
      onStartDateChange={noop}
      onDueDateChange={noop}
    />,
  );
}

describe("TaskDrawerDateFields", () => {
  it("renders a 'Start date' field next to the 'Deadline Due Date' field", () => {
    const html = renderDateFields("", "");
    expect(html).toContain("Start date");
    expect(html).toContain("Deadline Due Date");
    expect(html).not.toContain(RANGE_ERROR);
  });

  it("uses the 'Pick start date' placeholder for an empty start date", () => {
    const html = renderDateFields("", "");
    expect(html).toContain("Pick start date");
    expect(html).toContain("Pick target deadline");
  });

  it("shows the range error inline when the start day is after the due day", () => {
    const html = renderDateFields("2026-11-12", "2026-11-10");
    expect(html).toContain(RANGE_ERROR);
  });

  it("does not show the range error when the start day is before the due day", () => {
    expect(renderDateFields("2026-11-10", "2026-11-12")).not.toContain(
      RANGE_ERROR,
    );
  });

  it("does not show the range error when start and due are the same day", () => {
    expect(renderDateFields("2026-11-10", "2026-11-10")).not.toContain(
      RANGE_ERROR,
    );
  });

  it("does not show the range error when either date is empty", () => {
    expect(renderDateFields("2026-11-12", "")).not.toContain(RANGE_ERROR);
    expect(renderDateFields("", "2026-11-10")).not.toContain(RANGE_ERROR);
  });
});

describe("TaskDrawerForm start date", () => {
  function renderForm(startDateStr: string, dueDateStr: string): string {
    return renderToString(
      <TaskDrawerForm
        title="Write the report"
        description=""
        status="todo"
        priority="medium"
        assigneeId=""
        startDateStr={startDateStr}
        dueDateStr={dueDateStr}
        estimatedMinutes={60}
        users={[]}
        onTitleChange={noop}
        onDescriptionChange={noop}
        onStatusChange={noop}
        onPriorityChange={noop}
        onAssigneeChange={noop}
        onStartDateChange={noop}
        onDueDateChange={noop}
        onEstimatedMinutesChange={noop}
      />,
    );
  }

  it("renders the 'Start date' picker alongside the due date picker", () => {
    const html = renderForm("", "");
    expect(html).toContain("Start date");
    expect(html).toContain("Deadline Due Date");
  });
});
