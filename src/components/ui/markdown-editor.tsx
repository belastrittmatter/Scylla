"use client";

import * as React from "react";
import {
  Bold,
  Italic,
  Heading,
  Link as LinkIcon,
  Code,
  List,
  ListChecks,
  Table,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { cn } from "@/lib/utils";

export type MarkdownFormat =
  | "bold"
  | "italic"
  | "heading"
  | "link"
  | "code"
  | "list"
  | "checklist"
  | "table";

const TABLE = "| Column 1 | Column 2 |\n| --- | --- |\n| Cell | Cell |";

/** Pure: apply a formatting action to `value` at the selection [start, end). */
export function applyMarkdownFormat(
  value: string,
  start: number,
  end: number,
  kind: MarkdownFormat,
): { value: string; cursor: number } {
  const before = value.slice(0, start);
  const sel = value.slice(start, end);
  const after = value.slice(end);
  const wrap = (open: string, close: string, fallback: string) => {
    const text = sel || fallback;
    return {
      value: before + open + text + close + after,
      cursor: start + open.length + text.length,
    };
  };
  const prefix = (marker: string) => {
    const lineStart = before.lastIndexOf("\n") + 1;
    return {
      value: value.slice(0, lineStart) + marker + value.slice(lineStart),
      cursor: end + marker.length,
    };
  };
  switch (kind) {
    case "bold":
      return wrap("**", "**", "text");
    case "italic":
      return wrap("_", "_", "text");
    case "code":
      return wrap("`", "`", "code");
    case "link": {
      const text = sel || "text";
      return {
        value: `${before}[${text}](url)${after}`,
        cursor: start + text.length + 3,
      };
    }
    case "heading":
      return prefix("## ");
    case "list":
      return prefix("- ");
    case "checklist":
      return prefix("- [ ] ");
    case "table":
      return {
        value: before + TABLE + after,
        cursor: start + TABLE.length,
      };
  }
}

const TOOLS: { kind: MarkdownFormat; label: string; Icon: typeof Bold }[] = [
  { kind: "bold", label: "Bold", Icon: Bold },
  { kind: "italic", label: "Italic", Icon: Italic },
  { kind: "heading", label: "Heading", Icon: Heading },
  { kind: "link", label: "Link", Icon: LinkIcon },
  { kind: "code", label: "Code", Icon: Code },
  { kind: "list", label: "Bulleted list", Icon: List },
  { kind: "checklist", label: "Checklist", Icon: ListChecks },
  { kind: "table", label: "Table", Icon: Table },
];

export interface MarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  defaultTab?: "write" | "preview";
}

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  rows = 6,
  disabled,
  className,
  defaultTab = "write",
}: MarkdownEditorProps): React.JSX.Element {
  const [tab, setTab] = React.useState<"write" | "preview">(defaultTab);
  const ref = React.useRef<HTMLTextAreaElement>(null);

  function format(kind: MarkdownFormat) {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = applyMarkdownFormat(value, start, end, kind);
    onChange(next.value);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(next.cursor, next.cursor);
    });
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {(["write", "preview"] as const).map((t) => (
            <Button
              key={t}
              type="button"
              size="sm"
              variant={tab === t ? "secondary" : "ghost"}
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
            >
              {t === "write" ? "Write" : "Preview"}
            </Button>
          ))}
        </div>
        <span className="text-muted-foreground text-xs">
          Markdown supported (GFM)
        </span>
      </div>
      {tab === "write" ? (
        <>
          <div className="flex flex-wrap gap-0.5">
            {TOOLS.map(({ kind, label, Icon }) => (
              <Button
                key={kind}
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label={label}
                title={label}
                disabled={disabled}
                onClick={() => format(kind)}
              >
                <Icon />
              </Button>
            ))}
          </div>
          <Textarea
            ref={ref}
            id={id}
            value={value}
            rows={rows}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          />
        </>
      ) : (
        <div className="border-input min-h-16 rounded-lg border px-2.5 py-2">
          <MarkdownViewer content={value} emptyText="Nothing to preview" />
        </div>
      )}
    </div>
  );
}
