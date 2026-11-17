export type MarkdownFormat =
  "bold" | "italic" | "code" | "link" | "bullet" | "checklist" | "table";

export interface MarkdownEdit {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

const TABLE = "| Column | Column |\n| --- | --- |\n|  |  |";

function wrap(
  value: string,
  start: number,
  end: number,
  open: string,
  close: string,
  fallback = "",
): MarkdownEdit {
  const inner = value.slice(start, end) || fallback;
  const next = value.slice(0, start) + open + inner + close + value.slice(end);
  const selectionStart = start + open.length;
  return {
    value: next,
    selectionStart,
    selectionEnd: selectionStart + inner.length,
  };
}

function prefixLines(
  value: string,
  start: number,
  end: number,
  prefix: string,
): MarkdownEdit {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const newline = value.indexOf("\n", end);
  const lineEnd = newline === -1 ? value.length : newline;
  const block = value
    .slice(lineStart, lineEnd)
    .split("\n")
    .map((line) => prefix + line)
    .join("\n");
  return {
    value: value.slice(0, lineStart) + block + value.slice(lineEnd),
    selectionStart: lineStart,
    selectionEnd: lineStart + block.length,
  };
}

function insertTable(value: string, start: number, end: number): MarkdownEdit {
  const atLineStart = start === 0 || value[start - 1] === "\n";
  const text = (atLineStart ? "" : "\n") + TABLE;
  return {
    value: value.slice(0, start) + text + value.slice(end),
    selectionStart: start,
    selectionEnd: start + text.length,
  };
}

export function applyMarkdownFormat(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  format: MarkdownFormat,
): MarkdownEdit {
  const s = Math.min(selectionStart, selectionEnd);
  const e = Math.max(selectionStart, selectionEnd);
  switch (format) {
    case "bold":
      return wrap(value, s, e, "**", "**");
    case "italic":
      return wrap(value, s, e, "_", "_");
    case "code":
      return value.slice(s, e).includes("\n")
        ? wrap(value, s, e, "```\n", "\n```")
        : wrap(value, s, e, "`", "`");
    case "link": {
      const edit = wrap(value, s, e, "[", "](url)", "text");
      return {
        ...edit,
        selectionStart: s,
        selectionEnd: edit.selectionEnd + 6,
      };
    }
    case "bullet":
      return prefixLines(value, s, e, "- ");
    case "checklist":
      return prefixLines(value, s, e, "- [ ] ");
    case "table":
      return insertTable(value, s, e);
  }
}
