"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useBreadcrumb } from "./breadcrumb-context";

/** Renders page controls into the global ViewHeader, replacing its default breadcrumb. */
export function HeaderSlot({ children }: { children: React.ReactNode }) {
  const { headerSlot } = useBreadcrumb();
  // The slot node only exists after ViewHeader mounts on the client, so SSR renders nothing here.
  return headerSlot ? createPortal(children, headerSlot) : null;
}
