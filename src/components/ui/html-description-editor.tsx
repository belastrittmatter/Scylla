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
    <div className="shadow-xs flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/80 bg-neutral-50/70 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-800/40">
        <div className="flex items-center gap-1">
          {TOOLBAR_ITEMS.map((item, idx) => {
            if ("divider" in item && item.divider) {
              return (
                <div
                  key={idx}
                  className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700"
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
                className="rounded-md p-1.5 text-neutral-700 transition-colors hover:bg-neutral-200 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                <Icon className="size-3.5" />
              </button>
            );
          })}
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center rounded-lg bg-neutral-200/70 p-0.5 dark:bg-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab("visual")}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
              activeTab === "visual"
                ? "shadow-2xs bg-white text-orange-600 dark:bg-neutral-900 dark:text-orange-400"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
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
                ? "shadow-2xs bg-white text-orange-600 dark:bg-neutral-900 dark:text-orange-400"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
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
            className="max-h-60 min-h-36 overflow-y-auto rounded-lg border border-neutral-200/80 bg-neutral-50/30 p-3 text-xs leading-relaxed text-neutral-800 focus:outline-none focus:ring-1 focus:ring-orange-500/50 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-200 [&_a]:text-orange-600 [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="<p>Agenda notes...</p>"
            className="max-h-60 min-h-36 w-full rounded-lg border border-neutral-200/80 bg-neutral-50/30 p-3 font-mono text-xs leading-relaxed text-neutral-800 focus:outline-none focus:ring-1 focus:ring-orange-500/50 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-200"
          />
        )}
      </div>

      {/* Actions Footer */}
      <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/50 px-3 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-800/30">
        <span className="text-[11px] text-neutral-400">
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
            className="shadow-2xs h-7 gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-xs font-semibold text-white hover:from-orange-600 hover:to-amber-600"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="size-3" />
                Save Notes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
