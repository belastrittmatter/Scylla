import { renderToString } from "react-dom/server";
import { describe, expect, it } from "bun:test";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { applyMarkdownFormat } from "@/components/ui/markdown-format";

const noop = () => {};

const GFM = [
  "# Release notes",
  "",
  "Some **bold** text and `inline` code.",
  "",
  "- [x] done item",
  "- [ ] open item",
  "",
  "| Column A | Column B |",
  "| --- | --- |",
  "| 1 | 2 |",
  "",
  "> quoted words",
  "",
  "[docs](https://example.com/docs)",
].join("\n");

describe("MarkdownViewer", () => {
  const html = renderToString(<MarkdownViewer content={GFM} />);

  it("renders headings, bold, inline code and blockquotes", () => {
    expect(html).toContain("<h1");
    expect(html).toContain("Release notes");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<code");
    expect(html).toContain("<blockquote");
  });

  it("renders task lists as disabled checkboxes", () => {
    const boxes = html.match(/<input[^>]*type="checkbox"[^>]*>/g) ?? [];
    expect(boxes).toHaveLength(2);
    for (const box of boxes) expect(box).toContain("disabled");
  });

  it("renders tables with header cells", () => {
    expect(html).toContain("<table");
    expect(html).toContain("Column A");
    expect(html).toContain("Column B");
  });

  it("opens links in a new tab safely", () => {
    expect(html).toContain('href="https://example.com/docs"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("highlights fenced code with a language", () => {
    const out = renderToString(
      <MarkdownViewer content={"```ts\nconst a: number = 1;\n```"} />,
    );
    expect(out).toContain("hljs");
    expect(out).toContain('class="hljs-');
  });

  it("never renders raw html", () => {
    const out = renderToString(
      <MarkdownViewer content={"hi <script>alert(1)</script>"} />,
    );
    expect(out).not.toContain("<script>");
  });

  it("shows a placeholder for blank content", () => {
    expect(renderToString(<MarkdownViewer content="" />)).toContain(
      "No description provided.",
    );
    expect(renderToString(<MarkdownViewer content={"  \n "} />)).toContain(
      "No description provided.",
    );
  });
});

describe("MarkdownEditor", () => {
  const html = renderToString(
    <MarkdownEditor
      id="task-description"
      value="hello body"
      onChange={noop}
      placeholder="Write here"
    />,
  );

  it("renders tabs, textarea and footer note", () => {
    expect(html).toContain("Edit");
    expect(html).toContain("Preview");
    expect(html).toContain('id="task-description"');
    expect(html).toContain("hello body");
    expect(html).toContain('placeholder="Write here"');
    expect(html).toContain("Markdown supported (GFM)");
  });

  it("renders the seven toolbar buttons", () => {
    for (const label of [
      "Bold",
      "Italic",
      "Code",
      "Link",
      "Bulleted list",
      "Checklist",
      "Table",
    ]) {
      expect(html).toContain(`aria-label="${label}"`);
    }
  });
});

describe("applyMarkdownFormat", () => {
  it("wraps bold and selects inside the markers", () => {
    expect(applyMarkdownFormat("hello", 0, 5, "bold")).toEqual({
      value: "**hello**",
      selectionStart: 2,
      selectionEnd: 7,
    });
  });

  it("wraps italic in underscores", () => {
    expect(applyMarkdownFormat("hello", 0, 5, "italic")).toEqual({
      value: "_hello_",
      selectionStart: 1,
      selectionEnd: 6,
    });
  });

  it("wraps single-line code in backticks", () => {
    expect(applyMarkdownFormat("a b c", 2, 3, "code").value).toBe("a `b` c");
  });

  it("fences multi-line code", () => {
    const r = applyMarkdownFormat("x\ny", 0, 3, "code");
    expect(r.value).toBe("```\nx\ny\n```");
    expect(r.value.slice(r.selectionStart, r.selectionEnd)).toBe("x\ny");
  });

  it("makes a link, defaulting the text", () => {
    expect(applyMarkdownFormat("", 0, 0, "link").value).toBe("[text](url)");
    expect(applyMarkdownFormat("see docs", 4, 8, "link").value).toBe(
      "see [docs](url)",
    );
  });

  it("prefixes every selected line for bullet and checklist", () => {
    expect(applyMarkdownFormat("a\nb", 0, 3, "bullet").value).toBe("- a\n- b");
    expect(applyMarkdownFormat("a\nb", 0, 3, "checklist").value).toBe(
      "- [ ] a\n- [ ] b",
    );
  });

  it("inserts a table, on a new line when not at a line start", () => {
    const table = "| Column | Column |\n| --- | --- |\n|  |  |";
    expect(applyMarkdownFormat("", 0, 0, "table").value).toBe(table);
    expect(applyMarkdownFormat("abc", 3, 3, "table").value).toBe(
      `abc\n${table}`,
    );
  });
});

describe("Markdown edge cases", () => {
  it("does not emit a javascript: link href", () => {
    const out = renderToString(
      <MarkdownViewer content="[x](javascript:alert(1))" />,
    );
    expect(out).not.toContain("javascript:");
  });

  it("does not render raw html tags such as img onerror", () => {
    const out = renderToString(
      <MarkdownViewer content={'<img src=x onerror="alert(1)">'} />,
    );
    expect(out).not.toContain("<img");
  });

  it("selects the link text range and handles a reversed selection", () => {
    const r = applyMarkdownFormat("see docs", 4, 8, "link");
    expect(r.value.slice(r.selectionStart, r.selectionEnd)).toBe("[docs](url)");
    expect(applyMarkdownFormat("hello", 5, 0, "bold").value).toBe("**hello**");
  });

  it("wraps an empty selection and a mid-text selection", () => {
    expect(applyMarkdownFormat("ab", 1, 1, "bold")).toEqual({
      value: "a****b",
      selectionStart: 3,
      selectionEnd: 3,
    });
    expect(applyMarkdownFormat("a b c", 2, 3, "bold").value).toBe("a **b** c");
  });

  it("prefixes whole lines when the selection starts mid-line", () => {
    expect(applyMarkdownFormat("one\ntwo\nthree", 5, 6, "bullet").value).toBe(
      "one\n- two\nthree",
    );
    expect(applyMarkdownFormat("", 0, 0, "bullet").value).toBe("- ");
  });

  it("puts the table at a line start without a leading newline", () => {
    const r = applyMarkdownFormat("a\n", 2, 2, "table");
    expect(r.value.startsWith("a\n| Column")).toBe(true);
    expect(r.value.startsWith("a\n\n")).toBe(false);
  });
});
