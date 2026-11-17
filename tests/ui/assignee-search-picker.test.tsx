import { renderToString } from "react-dom/server";
import { describe, expect, it, mock, spyOn } from "bun:test";
import { toast } from "sonner";
import {
  AssigneeGithubBadge,
  AssigneeOption,
  AssigneeSearchPicker,
  GITHUB_NOT_CONNECTED_TOOLTIP,
  isAssigneeBlocked,
} from "@/components/tasks/assignee-search-picker";
import { TaskDrawerForm } from "@/components/tasks/task-drawer-form";
import type { TaskUser } from "@/components/tasks/task-types";

const noop = () => {};
const connected: TaskUser = {
  id: "u1",
  name: "Alice Ng",
  email: "alice@example.com",
  role: "Engineer",
  githubConnected: true,
};
const unconnected: TaskUser = {
  id: "u2",
  name: "Bob Ray",
  email: "bob@example.com",
  role: "Designer",
  githubConnected: false,
};

describe("isAssigneeBlocked", () => {
  it("blocks only an explicit false on a linked project", () => {
    expect(isAssigneeBlocked({ githubConnected: false }, true)).toBe(true);
    expect(isAssigneeBlocked({ githubConnected: false }, false)).toBe(false);
    expect(isAssigneeBlocked({ githubConnected: true }, true)).toBe(false);
    expect(isAssigneeBlocked({}, true)).toBe(false);
  });
});

describe("AssigneeGithubBadge", () => {
  it("shows No GitHub with the tooltip title", () => {
    const html = renderToString(
      <AssigneeGithubBadge user={unconnected} isProjectLinkedToGithub />,
    );
    expect(html).toContain("No GitHub");
    expect(html).toContain(`title="${GITHUB_NOT_CONNECTED_TOOLTIP}"`);
  });
  it("shows GitHub connected", () => {
    const html = renderToString(
      <AssigneeGithubBadge user={connected} isProjectLinkedToGithub />,
    );
    expect(html).toContain("GitHub connected");
  });
  it("renders nothing when not linked or unknown", () => {
    expect(
      renderToString(
        <AssigneeGithubBadge
          user={unconnected}
          isProjectLinkedToGithub={false}
        />,
      ),
    ).toBe("");
    expect(
      renderToString(<AssigneeGithubBadge user={{}} isProjectLinkedToGithub />),
    ).toBe("");
  });
});

describe("AssigneeOption", () => {
  it("marks a blocked member disabled with the tooltip", () => {
    const html = renderToString(
      <AssigneeOption user={unconnected} isProjectLinkedToGithub />,
    );
    for (const s of ["Bob Ray", "bob@example.com", "Designer", "No GitHub"]) {
      expect(html).toContain(s);
    }
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain(GITHUB_NOT_CONNECTED_TOOLTIP);
  });
  it("shows connected members as enabled", () => {
    const html = renderToString(
      <AssigneeOption user={connected} isProjectLinkedToGithub />,
    );
    expect(html).toContain("GitHub connected");
    expect(html).not.toContain('aria-disabled="true"');
  });
  it("shows no badge when not linked", () => {
    const html = renderToString(<AssigneeOption user={unconnected} />);
    expect(html).not.toContain("No GitHub");
    expect(html).not.toContain("GitHub connected");
  });
});

describe("AssigneeSearchPicker", () => {
  const users = [connected, unconnected];
  const render = (assigneeId: string, linked?: boolean) =>
    renderToString(
      <AssigneeSearchPicker
        users={users}
        assigneeId={assigneeId}
        onAssigneeChange={noop}
        isProjectLinkedToGithub={linked}
      />,
    );
  it("shows Unassigned placeholder", () => {
    expect(render("unassigned")).toContain("Unassigned");
  });
  it("shows badge for selected members on a linked project", () => {
    const a = render("u2", true);
    expect(a).toContain("Bob Ray");
    expect(a).toContain("No GitHub");
    expect(render("u1", true)).toContain("GitHub connected");
  });
  it("shows no badge when not linked", () => {
    const html = render("u2", false);
    expect(html).toContain("Bob Ray");
    expect(html).not.toContain("No GitHub");
  });
});

describe("TaskDrawerForm", () => {
  const form = (linked?: boolean) =>
    renderToString(
      <TaskDrawerForm
        title="T"
        description="Write **docs**"
        status="todo"
        priority="medium"
        assigneeId="u2"
        startDateStr=""
        dueDateStr=""
        estimatedMinutes={0}
        users={[connected, unconnected]}
        isProjectLinkedToGithub={linked}
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
  it("uses picker and markdown editor", () => {
    const html = form(true);
    expect(html).toContain("Assignee");
    expect(html).toContain("No GitHub");
    expect(html).toContain("Description / Acceptance Criteria");
    expect(html).toMatch(/<textarea[^>]*id="task-description"/);
    expect(html).toContain("Write **docs**");
    expect(html).toContain("Markdown supported (GFM)");
    expect(html).toContain("Preview");
  });
  it("shows no badge without the prop", () => {
    expect(form()).not.toContain("No GitHub");
  });
});

describe("AssigneeSearchPicker selection", () => {
  type Props = { onSelect: (u: TaskUser | null) => void };
  const pick = (
    linked: boolean,
    onChange: (id: string) => void,
    choice: TaskUser | null,
  ) => {
    const el = AssigneeSearchPicker({
      users: [connected, unconnected],
      assigneeId: "unassigned",
      onAssigneeChange: onChange,
      isProjectLinkedToGithub: linked,
    });
    (el.props as Props).onSelect(choice);
  };

  it("refuses an unconnected member on a linked project with an error toast", () => {
    const err = spyOn(toast, "error").mockImplementation(() => "x");
    const onChange = mock(() => {});
    pick(true, onChange, unconnected);
    expect(onChange).not.toHaveBeenCalled();
    expect(err).toHaveBeenCalledWith(GITHUB_NOT_CONNECTED_TOOLTIP);
    err.mockRestore();
  });
  it("accepts a connected member on a linked project", () => {
    const err = spyOn(toast, "error").mockImplementation(() => "x");
    const onChange = mock(() => {});
    pick(true, onChange, connected);
    expect(onChange).toHaveBeenCalledWith("u1");
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });
  it("accepts an unconnected member when the project is not linked", () => {
    const onChange = mock(() => {});
    pick(false, onChange, unconnected);
    expect(onChange).toHaveBeenCalledWith("u2");
  });
  it("accepts a member with unknown GitHub status on a linked project", () => {
    const onChange = mock(() => {});
    pick(true, onChange, {
      ...connected,
      id: "u3",
      githubConnected: undefined,
    });
    expect(onChange).toHaveBeenCalledWith("u3");
  });
  it("clearing selects the unassigned sentinel even on a linked project", () => {
    const onChange = mock(() => {});
    pick(true, onChange, null);
    expect(onChange).toHaveBeenCalledWith("unassigned");
  });
});

describe("AssigneeOption unknown status", () => {
  it("is not disabled and has no badge when the flag is undefined", () => {
    const html = renderToString(
      <AssigneeOption
        user={{ id: "u3", name: "Cy", email: "c@x.io", role: "QA" }}
        isProjectLinkedToGithub
      />,
    );
    expect(html).not.toContain("aria-disabled");
    expect(html).not.toContain("GitHub");
  });
});
