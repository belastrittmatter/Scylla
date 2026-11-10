"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { TaskUser } from "@/services/task/task-types";
import { getUserHandle } from "@/components/tasks/task-utils";

interface MarkdownViewerProps {
  content: string;
  className?: string;
  users?: TaskUser[];
  repo?: string;
}

function highlightMentionsAndIssues(
  children: React.ReactNode,
  users?: TaskUser[],
  repo?: string,
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      const parts = child.split(
        /(?<=^|\s)(@[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+|#\d+)/g,
      );
      if (parts.length === 1) return child;
      return parts.map((part, i) => {
        if (part.startsWith("@")) {
          const handle = part.slice(1).toLowerCase();
          const matchedUser = users?.find(
            (u) =>
              getUserHandle(u).toLowerCase() === handle ||
              u.name.toLowerCase().replace(/\s+/g, "") === handle,
          );
          const email = matchedUser?.email || `${handle}@example.com`;
          const title = matchedUser
            ? `@${handle} (${matchedUser.name}) - Click or Ctrl+Click to contact`
            : `@${handle} - Click or Ctrl+Click to contact`;

          return (
            <a
              key={i}
              href={`mailto:${email}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center rounded bg-primary/10 px-1 py-0.2 font-mono text-[11px] font-medium text-primary hover:bg-primary/20 hover:underline transition-colors cursor-pointer"
              title={title}
            >
              {part}
            </a>
          );
        }

        if (part.startsWith("#") && /^\d+$/.test(part.slice(1))) {
          const issueNum = part.slice(1);
          if (repo) {
            return (
              <a
                key={i}
                href={`https://github.com/${repo}/issues/${issueNum}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center rounded bg-neutral-100 px-1 py-0.2 font-mono text-[11px] font-medium text-primary hover:bg-neutral-200 hover:underline dark:bg-neutral-800 transition-colors cursor-pointer"
                title={`View issue #${issueNum} on GitHub (Ctrl+Click to open)`}
              >
                {part}
              </a>
            );
          }
          return (
            <span
              key={i}
              className="font-mono text-[11px] font-medium text-neutral-600 dark:text-neutral-400"
            >
              {part}
            </span>
          );
        }

        return part;
      });
    }
    return child;
  });
}

export function MarkdownViewer({
  content,
  className,
  users,
  repo,
}: MarkdownViewerProps) {
  if (!content || !content.trim()) {
    return (
      <div className={cn("text-xs text-muted-foreground italic", className)}>
        No description provided.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "markdown-content prose-xs text-xs leading-relaxed text-foreground/90 break-words",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-sm font-semibold text-foreground mt-3 mb-1.5 pb-1 border-b border-border first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs font-semibold text-foreground mt-2.5 mb-1 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold text-foreground mt-2 mb-1 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-medium text-foreground mt-1.5 mb-0.5 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-1.5 leading-relaxed text-foreground/90 first:mt-0 last:mb-0">
              {highlightMentionsAndIssues(children, users, repo)}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-4 space-y-0.5 my-1.5">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-4 space-y-0.5 my-1.5">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-border pl-3 my-2 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80 font-medium break-all"
            >
              {children}
            </a>
          ),
          code: ({ className, children, node: _node, ...props }) => {
            const isInline =
              !className &&
              typeof children === "string" &&
              !children.includes("\n");
            if (isInline) {
              return (
                <code
                  className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground border border-border/50"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={cn("font-mono text-xs", className)} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, node: _node, ...props }) => (
            <pre
              className="my-2 overflow-x-auto rounded-md bg-neutral-900 dark:bg-neutral-950 p-2.5 font-mono text-xs text-neutral-100 border border-neutral-800"
              {...props}
            >
              {children}
            </pre>
          ),
          table: ({ children, node: _node, ...props }) => (
            <div className="my-2 w-full overflow-x-auto rounded-md border border-border">
              <table className="w-full border-collapse text-xs" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, node: _node, ...props }) => (
            <thead className="bg-muted/60" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, node: _node, ...props }) => (
            <th
              className="border-b border-border px-2.5 py-1 text-left font-semibold text-foreground"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, node: _node, ...props }) => (
            <td
              className="border-b border-border/50 px-2.5 py-1 text-foreground/90 last:border-b-0"
              {...props}
            >
              {children}
            </td>
          ),
          hr: ({ node: _node, ...props }) => (
            <hr className="my-3 border-border" {...props} />
          ),
          input: ({ type, checked, node: _node, ...props }) => {
            if (type === "checkbox") {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled
                  className="mr-1.5 size-3.5 rounded border-border accent-primary align-middle"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
