"use client";

import * as React from "react";
import {
  Bold,
  CheckSquare,
  Code,
  Italic,
  Link as LinkIcon,
  List,
  Table,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownViewer } from "./markdown-viewer";
import { applyMarkdownFormat, type MarkdownFormat } from "./markdown-format";

const TOOLBAR: {
  format: MarkdownFormat;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { format: "bold", label: "Bold", Icon: Bold },
  { format: "italic", label: "Italic", Icon: Italic },
  { format: "code", label: "Code", Icon: Code },
  { format: "link", label: "Link", Icon: LinkIcon },
  { format: "bullet", label: "Bulleted list", Icon: List },
  { format: "checklist", label: "Checklist", Icon: CheckSquare },
  { format: "table", label: "Table", Icon: Table },
];

interface MarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  rows = 6,
  disabled,
  className,
}: MarkdownEditorProps) {
  const [tab, setTab] = React.useState<"edit" | "preview">("edit");
  const ref = React.useRef<HTMLTextAreaElement>(null);

  const apply = (format: MarkdownFormat) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = applyMarkdownFormat(value, start, end, format);
    onChange(next.value);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(next.selectionStart, next.selectionEnd);
    });
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v === "preview" ? "preview" : "edit")}
        >
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === "edit" && (
          <div className="flex items-center gap-0.5">
            {TOOLBAR.map(({ format, label, Icon }) => (
              <Button
                key={format}
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={label}
                title={label}
                disabled={disabled}
                onClick={() => apply(format)}
              >
                <Icon className="size-3.5" />
              </Button>
            ))}
          </div>
        )}
      </div>
      {tab === "edit" ? (
        <Textarea
          ref={ref}
          id={id}
          rows={rows}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="resize-none font-mono text-sm"
        />
      ) : (
        <div className="min-h-16 rounded-lg border p-2.5">
          <MarkdownViewer content={value} />
        </div>
      )}
      <p className="text-xs text-muted-foreground">Markdown supported (GFM)</p>
    </div>
  );
}
