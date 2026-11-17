"use client";

import * as React from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  RemoveFormatting,
  Code,
  Eye,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HtmlDescriptionEditorProps {
  initialValue?: string;
  onSave: (html: string) => Promise<void> | void;
  onCancel: () => void;
  isSaving?: boolean;
}

const TOOLBAR_ITEMS = [
  { icon: Bold, title: "Bold", cmd: "bold" },
  { icon: Italic, title: "Italic", cmd: "italic" },
  { icon: Underline, title: "Underline", cmd: "underline" },
  { divider: true },
  { icon: List, title: "Bullet list", cmd: "insertUnorderedList" },
  { icon: ListOrdered, title: "Numbered list", cmd: "insertOrderedList" },
  { icon: LinkIcon, title: "Insert link", isLink: true },
  { icon: RemoveFormatting, title: "Clear format", cmd: "removeFormat" },
];

export function HtmlDescriptionEditor({
  initialValue = "",
  onSave,
  onCancel,
  isSaving = false,
}: HtmlDescriptionEditorProps) {
  const [content, setContent] = React.useState(initialValue);
  const [activeTab, setActiveTab] = React.useState<"visual" | "html">("visual");
  const visualEditorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (
      visualEditorRef.current &&
      activeTab === "visual" &&
      visualEditorRef.current.innerHTML !== content
    ) {
      visualEditorRef.current.innerHTML = content;
    }
  }, [activeTab, content]);

  const runCommand = (
    command: string,
    value: string | undefined = undefined,
  ) => {
    if (activeTab !== "visual") return;
    visualEditorRef.current?.focus();
    document.execCommand(command, false, value);
    if (visualEditorRef.current) setContent(visualEditorRef.current.innerHTML);
  };

  const handleInsertLink = () => {
    const url = window.prompt("Enter destination URL:", "https://");
    if (url && url.trim() && url !== "https://") {
      runCommand("createLink", url.trim());
    }
  };

  const handleSave = async () => {
    const finalHtml =
      activeTab === "visual" && visualEditorRef.current
        ? visualEditorRef.current.innerHTML
        : content;
    await onSave(finalHtml);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted px-3 py-2">
        <div className="flex items-center gap-1">
          {TOOLBAR_ITEMS.map((item, idx) => {
            if ("divider" in item && item.divider) {
              return (
                <div
                  key={idx}
                  className="mx-1 h-4 w-px bg-border"
                />
              );
            }
            const Icon = item.icon!;
            return (
              <button
                key={item.title}
                type="button"
                title={item.title}
                onClick={() =>
                  item.isLink ? handleInsertLink() : runCommand(item.cmd!)
                }
                disabled={activeTab !== "visual"}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-40"
              >
                <Icon className="size-3.5" />
              </button>
            );
          })}
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center rounded-lg bg-border p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("visual")}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
              activeTab === "visual"
                ? "bg-card text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="size-3" />
            Visual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("html")}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
              activeTab === "html"
                ? "bg-card text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code className="size-3" />
            HTML
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-3">
        {activeTab === "visual" ? (
          <div
            ref={visualEditorRef}
            contentEditable
            onInput={() => setContent(visualEditorRef.current?.innerHTML || "")}
            className="max-h-60 min-h-36 overflow-y-auto rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-ring/50 [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="<p>Agenda notes...</p>"
            className="max-h-60 min-h-36 w-full rounded-lg border border-border bg-background p-3 font-mono text-xs leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-ring/50"
          />
        )}
      </div>

      {/* Actions Footer */}
      <div className="flex items-center justify-between border-t border-border bg-muted px-3 py-2 text-xs">
        <span className="text-[11px] text-muted-foreground">
          Rich HTML formatting synced with Google Calendar
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
            className="h-7 text-xs"
          >
            <X className="mr-1 size-3" />
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-7 gap-1 text-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="size-3" />
                Save notes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
