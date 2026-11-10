"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "./markdown-viewer";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Heading,
  Code,
  Link2,
  List,
  CheckSquare,
  Quote,
  Eye,
  PenLine,
} from "lucide-react";

interface MarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  minHeightClassName?: string;
  className?: string;
  disabled?: boolean;
  defaultTab?: "preview" | "write";
}

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder = "Write description in Markdown (e.g. headings, - [ ] tasks, `code`, tables)...",
  minRows = 8,
  minHeightClassName = "min-h-[220px]",
  className,
  disabled = false,
  defaultTab = "preview",
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">(defaultTab);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (
    prefix: string,
    suffix: string = "",
    placeholderText: string = "",
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let replacement = "";
    let newCursorPos = start + prefix.length;

    if (selectedText) {
      replacement = `${prefix}${selectedText}${suffix}`;
      newCursorPos = start + replacement.length;
    } else {
      replacement = `${prefix}${placeholderText}${suffix}`;
      newCursorPos =
        start + prefix.length + (placeholderText ? placeholderText.length : 0);
    }

    const newValue =
      value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        selectedText ? newCursorPos : start + prefix.length,
        selectedText
          ? newCursorPos
          : start + prefix.length + placeholderText.length,
      );
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        insertFormatting("**", "**", "bold text");
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        insertFormatting("*", "*", "italic text");
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        insertFormatting("[", "](url)", "link text");
      }
    }
  };

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background shadow-2xs transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      {/* Editor Header: Tabs & Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border/70 bg-muted/30 px-2 py-1 gap-1">
        {/* Preview / Edit Mode Switcher */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={activeTab === "preview" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setActiveTab("preview")}
            disabled={disabled}
            className="h-6 px-2 text-xs gap-1 font-medium"
          >
            <Eye className="size-3" />
            <span>Preview</span>
          </Button>

          <Button
            type="button"
            variant={activeTab === "write" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setActiveTab("write")}
            disabled={disabled}
            className="h-6 px-2 text-xs gap-1 font-medium"
          >
            <PenLine className="size-3" />
            <span>Edit</span>
          </Button>
        </div>

        {/* Quick Markdown Toolbar (Only visible in Write mode) */}
        {activeTab === "write" && !disabled && (
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              title="Bold (Cmd+B)"
              onClick={() => insertFormatting("**", "**", "bold text")}
            >
              <Bold className="size-3" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              title="Italic (Cmd+I)"
              onClick={() => insertFormatting("*", "*", "italic text")}
            >
              <Italic className="size-3" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              title="Heading"
              onClick={() => insertFormatting("### ", "", "Heading")}
            >
              <Heading className="size-3" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              title="Code / Inline Code"
              onClick={() => insertFormatting("`", "`", "code")}
            >
              <Code className="size-3" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              title="Link (Cmd+K)"
              onClick={() =>
                insertFormatting("[", "](https://...)", "link title")
              }
            >
              <Link2 className="size-3" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              title="Bullet List"
              onClick={() => insertFormatting("- ", "", "item")}
            >
              <List className="size-3" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              title="Task List"
              onClick={() => insertFormatting("- [ ] ", "", "task")}
            >
              <CheckSquare className="size-3" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              title="Quote"
              onClick={() => insertFormatting("> ", "", "quote")}
            >
              <Quote className="size-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Editor Body */}
      {activeTab === "write" ? (
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={minRows}
          disabled={disabled}
          className={cn(
            "w-full resize-y bg-transparent p-3 text-xs md:text-sm font-mono leading-relaxed placeholder:text-muted-foreground focus:outline-hidden",
            minHeightClassName,
          )}
        />
      ) : (
        <div
          className={cn(
            "p-3 overflow-y-auto max-h-[600px]",
            minHeightClassName,
          )}
        >
          {value.trim() ? (
            <MarkdownViewer content={value} />
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground">
              <p className="italic">No description provided.</p>
              {!disabled && (
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  onClick={() => setActiveTab("write")}
                  className="mt-1 h-auto text-xs text-primary"
                >
                  Click to edit description
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Helper Footer */}
      <div className="flex items-center justify-between border-t border-border/50 bg-muted/15 px-2.5 py-1 text-[10px] text-muted-foreground">
        <span>Markdown supported (GFM)</span>
        <span>{value ? `${value.length} characters` : ""}</span>
      </div>
    </div>
  );
}
