"use client";

import * as React from "react";

/**
 * Strips HTML tags to produce a clean plain-text string,
 * suitable for compact multi-line card previews.
 */
export function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Basic client-side HTML sanitizer allowing only standard safe tags
 * and attributes, ensuring safe rich text display without XSS risks.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Remove dangerous tags and inline javascript event handlers
  let clean = html
    .replace(
      /<(script|style|iframe|object|embed|form|input|button)[\s\S]*?<\/\1>/gi,
      "",
    )
    .replace(/<[^>]+>/g, (tag) => {
      // Remove any on* event handlers (e.g. onclick, onerror)
      return tag.replace(/\s+on\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    })
    .replace(/href=["']javascript:[^"']*["']/gi, 'href="#"');

  // Ensure all anchor tags open safely in a new tab
  clean = clean.replace(/<a\b([^>]*)>/gi, (_match, attrs) => {
    const cleanAttrs = attrs
      .replace(/\btarget=["'][^"']*["']/gi, "")
      .replace(/\brel=["'][^"']*["']/gi, "");
    return `<a target="_blank" rel="noopener noreferrer"${cleanAttrs}>`;
  });

  return clean;
}

interface HtmlDescriptionViewerProps {
  html?: string | null;
  className?: string;
  emptyPlaceholder?: string;
}

export function HtmlDescriptionViewer({
  html,
  className = "",
  emptyPlaceholder = "No agenda or notes provided.",
}: HtmlDescriptionViewerProps) {
  if (!html || !html.trim()) {
    return (
      <p
        className={`text-xs italic text-muted-foreground ${className}`}
      >
        {emptyPlaceholder}
      </p>
    );
  }

  const sanitized = sanitizeHtml(html);

  return (
    <div
      className={`prose prose-xs max-w-none leading-relaxed text-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_b]:font-semibold [&_b]:text-foreground [&_blockquote]:border-l-2 [&_blockquote]:border-line-strong [&_blockquote]:pl-3 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[11px] [&_li]:my-0.5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
