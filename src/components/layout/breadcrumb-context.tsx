"use client";

import * as React from "react";
import { createContext, useContext, useState, useCallback } from "react";

interface BreadcrumbContextType {
  customLabels: Record<string, string>;
  setLabel: (segment: string, label: string) => void;
  /** Node ViewHeader renders for page-owned header content (see HeaderSlot). */
  headerSlot: HTMLElement | null;
  setHeaderSlot: (node: HTMLElement | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType>({
  customLabels: {},
  setLabel: () => {},
  headerSlot: null,
  setHeaderSlot: () => {},
});

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);

  const setLabel = useCallback((segment: string, label: string) => {
    setCustomLabels((prev) => {
      if (prev[segment] === label) return prev;
      return { ...prev, [segment]: label };
    });
  }, []);

  return (
    <BreadcrumbContext.Provider
      value={{ customLabels, setLabel, headerSlot, setHeaderSlot }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  return useContext(BreadcrumbContext);
}
