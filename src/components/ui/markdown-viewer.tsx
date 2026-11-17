"use client";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { cn } from "cn";

const PROSE = [
  "text-sm leading-relaxed break-words",
  "[&_h1]:mt-3 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold",
  "[&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold",
  "[&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold",
  "[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li.task-list-item]:list-none [&_li.task-list-item_input]:mr-2",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
  "[&_a]:text-primary [&_a]:underline",
  "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse",
  "[&_th]:border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left",
  "[&_td]:border [&_td]:px-2 [&_td]:py-1",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs",
  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_.hljs-keyword]:text-purple-600 [&_.hljs-built_in]:text-purple-600",
  "[&_.hljs-string]:text-green-700 [&_.hljs-number]:text-orange-600",
  "[&_.hljs-comment]:text-muted-foreground [&_.hljs-comment]:italic",
  "[&_.hljs-title]:text-blue-600 [&_.hljs-type]:text-blue-600 [&_.hljs-attr]:text-blue-600",
  "dark:[&_.hljs-keyword]:text-purple-400 dark:[&_.hljs-string]:text-green-400 dark:[&_.hljs-number]:text-orange-400 dark:[&_.hljs-title]:text-blue-400",
].join(" ");

export function MarkdownViewer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  if (!content.trim()) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        No description provided.
      </p>
    );
  }
  return (
    <div className={cn(PROSE, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
