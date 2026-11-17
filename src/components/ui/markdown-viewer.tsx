"use client";

import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";

export interface MarkdownViewerProps {
  content: string | null | undefined;
  className?: string;
  /** Shown when content is null, undefined, empty or only whitespace. */
  emptyText?: string;
}

const components: Components = {
  h1: ({ node: _node, className, ...p }) => (
    <h1 className={cn("mt-4 mb-2 text-xl font-semibold", className)} {...p} />
  ),
  h2: ({ node: _node, className, ...p }) => (
    <h2 className={cn("mt-4 mb-2 text-lg font-semibold", className)} {...p} />
  ),
  h3: ({ node: _node, className, ...p }) => (
    <h3
      className={cn("mt-3 mb-1.5 text-base font-semibold", className)}
      {...p}
    />
  ),
  h4: ({ node: _node, className, ...p }) => (
    <h4 className={cn("mt-3 mb-1 text-sm font-semibold", className)} {...p} />
  ),
  p: ({ node: _node, className, ...p }) => (
    <p className={cn("my-2 leading-relaxed", className)} {...p} />
  ),
  ul: ({ node: _node, className, ...p }) => (
    <ul
      className={cn(
        "my-2 list-disc pl-5 [&.contains-task-list]:list-none [&.contains-task-list]:pl-1",
        className,
      )}
      {...p}
    />
  ),
  ol: ({ node: _node, className, ...p }) => (
    <ol className={cn("my-2 list-decimal pl-5", className)} {...p} />
  ),
  li: ({ node: _node, className, ...p }) => (
    <li className={cn("my-0.5", className)} {...p} />
  ),
  blockquote: ({ node: _node, className, ...p }) => (
    <blockquote
      className={cn(
        "border-border text-muted-foreground my-2 border-l-4 pl-3",
        className,
      )}
      {...p}
    />
  ),
  table: ({ node: _node, className, ...p }) => (
    <div className="my-2 overflow-x-auto">
      <table
        className={cn("w-full border-collapse text-sm", className)}
        {...p}
      />
    </div>
  ),
  th: ({ node: _node, className, ...p }) => (
    <th
      className={cn(
        "border-border bg-muted border px-2 py-1 text-left font-medium",
        className,
      )}
      {...p}
    />
  ),
  td: ({ node: _node, className, ...p }) => (
    <td className={cn("border-border border px-2 py-1", className)} {...p} />
  ),
  code: ({ node: _node, className, children, ...p }) => {
    const isBlock = /hljs|language-/.test(className ?? "");
    return (
      <code
        className={cn(
          isBlock
            ? "font-mono text-xs"
            : "bg-muted rounded px-1 py-0.5 font-mono text-[0.85em]",
          className,
        )}
        {...p}
      >
        {children}
      </code>
    );
  },
  pre: ({ node: _node, className, ...p }) => (
    <pre
      className={cn("bg-muted my-2 overflow-x-auto rounded-lg p-3", className)}
      {...p}
    />
  ),
  hr: ({ node: _node, className, ...p }) => (
    <hr className={cn("border-border my-4", className)} {...p} />
  ),
  input: ({ node: _node, className, ...p }) => (
    <input className={cn("mr-1.5 align-middle", className)} {...p} />
  ),
  a: ({ node: _node, className, ...p }) => (
    <a
      className={cn("text-primary underline underline-offset-2", className)}
      target="_blank"
      rel="noopener noreferrer"
      {...p}
    />
  ),
};

export function MarkdownViewer({
  content,
  className,
  emptyText = "No description provided.",
}: MarkdownViewerProps): React.JSX.Element {
  if (!content || content.trim() === "") {
    return (
      <p className={cn("text-muted-foreground text-sm", className)}>
        {emptyText}
      </p>
    );
  }
  return (
    <div className={cn("markdown-body text-sm break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
