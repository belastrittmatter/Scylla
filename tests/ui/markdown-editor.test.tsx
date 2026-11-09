import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MarkdownViewer } from "../../src/components/ui/markdown-viewer";
import { MarkdownEditor } from "../../src/components/ui/markdown-editor";

describe("Markdown Description Handling & Editing (GFM)", () => {
  test("MarkdownViewer renders rich markdown elements: headings, bold, code, lists, checkboxes", () => {
    const markdownContent = `
# Feature Specification
This is **bold** text and \`inline code\`.

- [x] Completed task
- [ ] Pending task

| Column A | Column B |
| --- | --- |
| Val 1 | Val 2 |

> Important note about deployment

[Official Docs](https://example.com)
    `.trim();

    const html = renderToString(<MarkdownViewer content={markdownContent} />);

    expect(html).toContain("Feature Specification");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("inline code");
    expect(html).toContain("<code");
    expect(html).toContain("Completed task");
    expect(html).toContain("Pending task");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("Column A");
    expect(html).toContain("Column B");
    expect(html).toContain("Important note about deployment");
    expect(html).toContain('href="https://example.com"');
  });

  test("MarkdownViewer displays placeholder when content is empty or blank", () => {
    const htmlEmpty = renderToString(<MarkdownViewer content="" />);
    expect(htmlEmpty).toContain("No description provided");

    const htmlWhitespace = renderToString(<MarkdownViewer content="   " />);
    expect(htmlWhitespace).toContain("No description provided");
  });

  test("MarkdownEditor renders Edit and Preview tabs with formatting controls", () => {
    const html = renderToString(
      <MarkdownEditor
        id="test-desc"
        value="Initial markdown text"
        onChange={() => {}}
      />,
    );

    expect(html).toContain("Edit");
    expect(html).toContain("Preview");
    expect(html).toContain("Initial markdown text");
    expect(html).toContain("Markdown supported (GFM)");
  });
});
