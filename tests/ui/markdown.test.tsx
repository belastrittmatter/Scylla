import { renderToString } from "react-dom/server";
import { describe, expect, it } from "bun:test";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import {
  MarkdownEditor,
  applyMarkdownFormat,
} from "@/components/ui/markdown-editor";

const RICH = [
  "# Title",
  "",
  "**bold** and `inline`",
  "",
  "- [x] done",
  "- [ ] todo",
  "",
  "| a | b |",
  "| - | - |",
  "| 1 | 2 |",
  "",
  "~~gone~~",
  "",
  "> quote text",
  "",
  "[Docs](https://example.com)",
].join("\n");

const view = (content: string | null | undefined, emptyText?: string) =>
  renderToString(<MarkdownViewer content={content} emptyText={emptyText} />);

const noop = () => {};

describe("MarkdownViewer", () => {
  it("renders rich GFM content", () => {
    const html = view(RICH);
    expect(html).toContain("markdown-body");
    expect(html).toContain("Title");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<code");
    expect(html.match(/type="checkbox"/g)?.length).toBe(2);
    expect(html.match(/checked=""/g)?.length).toBe(1);
    expect(html.match(/disabled=""/g)?.length).toBe(2);
    expect(html).toContain("<table");
    expect(html).toContain("<th");
    expect(html).toContain("<del>gone</del>");
    expect(html).toContain("quote text");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toMatch(/rel="[^"]*noopener/);
  });

  it("highlights fenced code", () => {
    const html = view("```ts\nconst x: number = 1;\n```");
    expect(html).toContain("language-ts");
    expect(html).toContain("hljs");
    expect(html).toContain("hljs-keyword");
    expect(view("```\nplain\n```")).toContain("<pre");
  });

  it("does not render raw HTML or javascript: links", () => {
    const html = view("<script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(view("[x](javascript:alert(1))")).not.toContain('href="javascript:');
  });

  it("shows the empty text for blank content", () => {
    for (const c of ["", "   ", null, undefined]) {
      expect(view(c)).toContain("No description provided.");
    }
    expect(view("", "Nothing here")).toContain("Nothing here");
    expect(view("")).not.toContain("markdown-body");
  });
});

describe("MarkdownEditor", () => {
  it("renders the write tab with toolbar", () => {
    const html = renderToString(
      <MarkdownEditor
        id="desc"
        value="hello text"
        onChange={noop}
        placeholder="Say it"
      />,
    );
    expect(html).toContain("<textarea");
    expect(html).toContain('id="desc"');
    expect(html).toContain("hello text");
    expect(html).toContain("Say it");
    expect(html).toContain("Write");
    expect(html).toContain("Preview");
    expect(html).toContain("Markdown supported (GFM)");
    for (const l of [
      "Bold",
      "Italic",
      "Heading",
      "Link",
      "Code",
      "Bulleted list",
      "Checklist",
      "Table",
    ]) {
      expect(html).toContain(`aria-label="${l}"`);
    }
    expect(html).not.toContain('type="submit"');
  });

  it("renders the preview tab", () => {
    const html = renderToString(
      <MarkdownEditor
        value="**b** and a | table |"
        onChange={noop}
        defaultTab="preview"
      />,
    );
    expect(html).toContain("<strong>b</strong>");
    expect(html).not.toContain("<textarea");
    const empty = renderToString(
      <MarkdownEditor value="" onChange={noop} defaultTab="preview" />,
    );
    expect(empty).toContain("Nothing to preview");
  });

  it("disables the textarea", () => {
    const html = renderToString(
      <MarkdownEditor value="" onChange={noop} disabled />,
    );
    expect(html).toMatch(/<textarea[^>]*disabled/);
  });
});

describe("applyMarkdownFormat", () => {
  it("wraps a selection in bold", () => {
    const r = applyMarkdownFormat("a word b", 2, 6, "bold");
    expect(r.value).toBe("a **word** b");
    expect(r.cursor).toBe(8);
  });
  it("inserts a checklist item with no selection", () => {
    const r = applyMarkdownFormat("", 0, 0, "checklist");
    expect(r.value).toBe("- [ ] ");
    expect(r.cursor).toBe(6);
  });
  it("puts the heading at the line start", () => {
    expect(applyMarkdownFormat("one\ntwo", 5, 5, "heading").value).toBe(
      "one\n## two",
    );
  });
  it("wraps a link selection and selects url position", () => {
    const r = applyMarkdownFormat("see x", 4, 5, "link");
    expect(r.value).toBe("see [x](url)");
  });
  it("inserts a table skeleton", () => {
    const r = applyMarkdownFormat("", 0, 0, "table");
    expect(r.value).toContain("| --- |");
    expect(r.cursor).toBeGreaterThan(0);
  });
});

describe("QA additions: editor buttons and attributes", () => {
  const write = (props: Partial<Parameters<typeof MarkdownEditor>[0]> = {}) =>
    renderToString(<MarkdownEditor value="" onChange={noop} {...props} />);
  const buttons = (html: string) => html.match(/<button[^>]*>/g) ?? [];

  it("every button is type=button (write tab and preview tab)", () => {
    for (const html of [write(), write({ defaultTab: "preview" })]) {
      const bs = buttons(html);
      expect(bs.length).toBeGreaterThanOrEqual(2);
      for (const b of bs) expect(b).toContain('type="button"');
    }
    expect(buttons(write()).length).toBe(10);
  });

  it("marks only the active tab with aria-pressed=true", () => {
    const tabOf = (html: string, label: string) =>
      (html.match(/<button[^>]*>(?:(?!<\/button>).)*<\/button>/g) ?? []).find(
        (b) => b.endsWith(`${label}</button>`),
      ) ?? "";
    const w = write();
    expect(tabOf(w, "Write")).toContain('aria-pressed="true"');
    expect(tabOf(w, "Preview")).toContain('aria-pressed="false"');
    const p = write({ defaultTab: "preview" });
    expect(tabOf(p, "Preview")).toContain('aria-pressed="true"');
    expect(tabOf(p, "Write")).toContain('aria-pressed="false"');
  });

  it("disables all toolbar buttons when disabled, enables otherwise", () => {
    const tools = (html: string) =>
      buttons(html).filter((b) => b.includes("aria-label="));
    expect(tools(write({ disabled: true })).length).toBe(8);
    for (const b of tools(write({ disabled: true })))
      expect(b).toMatch(/ disabled=""/);
    for (const b of tools(write())) expect(b).not.toMatch(/ disabled=""/);
  });

  it("passes rows, defaulting to 6, and not in the preview", () => {
    expect(write()).toMatch(/<textarea[^>]*rows="6"/);
    expect(write({ rows: 3 })).toMatch(/<textarea[^>]*rows="3"/);
    expect(write({ defaultTab: "preview" })).not.toContain("aria-label=");
  });

  it("applies className to the editor wrapper", () => {
    expect(write({ className: "qa-wrap" })).toContain("qa-wrap");
  });
});

describe("QA additions: viewer safety and content", () => {
  it("does not render raw HTML elements or event handlers", () => {
    const html = view('<img src=x onerror="alert(1)"> <a href="x">y</a>');
    expect(html).not.toContain("<img");
    expect(html).not.toMatch(/<a [^>]*href="x"/);
    expect(html).toContain("&lt;img");
  });

  it("empties javascript: links in any case and keeps the text", () => {
    const html = view("[go](JaVaScRiPt:alert(1)) and [d](data:text/html,x)");
    expect(html.toLowerCase()).not.toContain('href="javascript:');
    expect(html.toLowerCase()).not.toContain('href="data:');
    expect(html).toContain("go");
  });

  it("opens every link in a new tab with noopener noreferrer", () => {
    const html = view("[a](https://a.test) [b](https://b.test)");
    const links = html.match(/<a [^>]*>/g) ?? [];
    expect(links.length).toBe(2);
    for (const l of links) {
      expect(l).toContain('target="_blank"');
      expect(l).toContain('rel="noopener noreferrer"');
    }
  });

  it("applies className to the wrapper and the empty state", () => {
    expect(
      renderToString(<MarkdownViewer content="x" className="qa-v" />),
    ).toMatch(/class="[^"]*markdown-body[^"]*qa-v|class="[^"]*qa-v[^"]*"/);
    expect(
      renderToString(<MarkdownViewer content="" className="qa-v" />),
    ).toContain("qa-v");
  });

  it("escapes angle brackets in code blocks and keeps inline code unhighlighted", () => {
    const html = view("```html\n<b>x</b>\n```\n\nuse `a<b`");
    expect(html).not.toContain("<b>x</b>");
    expect(html).toContain("a&lt;b");
  });

  it("renders unknown fence languages without throwing", () => {
    expect(view("```nosuchlang\nfoo\n```")).toContain("foo");
  });
});

describe("QA additions: applyMarkdownFormat", () => {
  it("bold/italic/code with no selection insert placeholders with the cursor inside", () => {
    const b = applyMarkdownFormat("ab", 1, 1, "bold");
    expect(b.value).toBe("a**text**b");
    expect(b.cursor).toBe(7);
    expect(applyMarkdownFormat("", 0, 0, "italic").value).toBe("_text_");
    expect(applyMarkdownFormat("", 0, 0, "code").value).toBe("`code`");
  });

  it("italic and code wrap a selection", () => {
    expect(applyMarkdownFormat("a word", 2, 6, "italic").value).toBe(
      "a _word_",
    );
    expect(applyMarkdownFormat("a word", 2, 6, "code").value).toBe("a `word`");
  });

  it("link with no selection and cursor before url", () => {
    const r = applyMarkdownFormat("", 0, 0, "link");
    expect(r.value).toBe("[text](url)");
    expect(r.cursor).toBe(7);
  });

  it("list and heading prefix the first line from the start", () => {
    expect(applyMarkdownFormat("one", 3, 3, "list").value).toBe("- one");
    expect(applyMarkdownFormat("one", 0, 0, "heading").value).toBe("## one");
    expect(applyMarkdownFormat("a\nb", 3, 3, "checklist").value).toBe(
      "a\n- [ ] b",
    );
  });

  it("table inserts a 2x2 GFM skeleton that the viewer renders as a table", () => {
    const r = applyMarkdownFormat("x", 1, 1, "table");
    expect(r.value.startsWith("x| ")).toBe(true);
    const html = view(applyMarkdownFormat("", 0, 0, "table").value);
    expect(html).toContain("<table");
    expect(html.match(/<th[ >]/g)?.length).toBe(2);
    expect(html.match(/<td[ >]/g)?.length).toBe(2);
  });
});
