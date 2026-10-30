"use client";

import * as React from "react";

export interface HardLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

/**
 * Full-page navigation link for crossing between the marketing landing page
 * and the authenticated dashboard / auth surfaces.
 */
export function HardLink({ href, onClick, children, ...props }: HardLinkProps) {
  return (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) {
          e.preventDefault();
          // NOTE: Must use window.location.replace for all navigation from the landing page into the dashboard because Next.js caches CSS across client-side route transitions, which causes stylesheet conflicts between the landing page and dashboard.
          window.location.replace(href);
        }
      }}
      {...props}
    >
      {children}
    </a>
  );
}
