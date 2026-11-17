"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type LegalTocItem = { id: string; num: string | null; label: string };

/**
 * Sticky "On this page" list for the legal pages. Server-rendered links work
 * without JS; the observer only adds the ember marker on the section in view.
 */
export function LegalToc({ items }: { items: LegalTocItem[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0 || typeof IntersectionObserver === "undefined") {
      return;
    }

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = items.find((item) => visible.has(item.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-96px 0px -55% 0px" },
    );
    for (const el of targets) observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  return (
    <ol className="border-l border-line text-sm">
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={isActive ? "location" : undefined}
              className={cn(
                "-ml-px flex gap-2.5 border-l py-1.5 pl-4 leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember",
                isActive
                  ? "border-ember text-ink"
                  : "border-transparent text-ink-2 hover:border-ink-3 hover:text-ink",
              )}
            >
              {item.num && (
                <span className="w-5 shrink-0 font-code text-xs leading-5 tabular-nums">
                  {item.num}
                </span>
              )}
              <span className="min-w-0 text-pretty">{item.label}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}
