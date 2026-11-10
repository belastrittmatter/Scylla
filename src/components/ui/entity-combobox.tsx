"use client";

import * as React from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { matchesQuery } from "./entity-combobox-filter";

export interface EntityAccessors<T> {
  items: T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  /** Row content; defaults to the label. */
  renderItem?: (item: T) => React.ReactNode;
  emptyText?: React.ReactNode;
}

/** Sentinel row for the pinned "clear" option. */
const CLEAR = { clear: true } as const;
type Row<T> = T | typeof CLEAR;

export const sameKey =
  <T,>(getKey: (i: T) => string) =>
  (a: T, b: T) =>
    getKey(a) === getKey(b);

export interface EntityComboboxProps<T> extends EntityAccessors<T> {
  selected: T | null;
  /** `null` means the clear option was chosen. */
  onSelect: (item: T | null) => void;
  /** Fields the search box matches against; defaults to the label. */
  searchFields?: (item: T) => ReadonlyArray<string | null | undefined>;
  /** Trigger content when nothing is selected. */
  placeholder: React.ReactNode;
  renderSelected?: (item: T) => React.ReactNode;
  searchPlaceholder?: string;
  /** Pinned first row that selects `null` (e.g. "All projects", "Unassigned"). */
  clearOption?: { label: string; icon?: React.ReactNode };
  /** Rendered under the list; call `close` to dismiss the popover. */
  footer?: (close: () => void) => React.ReactNode;
  /** Trigger button variant. */
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
  contentClassName?: string;
}

/** Single-select popover: trigger button, search box, list, optional footer. */
export function EntityCombobox<T>({
  items,
  getKey,
  getLabel,
  renderItem,
  emptyText = "No results",
  selected,
  onSelect,
  searchFields,
  placeholder,
  renderSelected,
  searchPlaceholder = "Search...",
  clearOption,
  footer,
  variant = "outline",
  className,
  contentClassName,
}: EntityComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const close = () => setOpen(false);
  const fields = searchFields ?? ((i: T) => [getLabel(i)]);
  const rows: Row<T>[] = clearOption ? [CLEAR, ...items] : items;
  const isClear = (r: Row<T>): r is typeof CLEAR => r === CLEAR;

  return (
    <Combobox
      items={rows}
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
      inputValue={query}
      onInputValueChange={setQuery}
      value={selected}
      onValueChange={(v: Row<T> | null) => {
        if (v) onSelect(isClear(v) ? null : v);
        close();
      }}
      filter={(r: Row<T>, q: string) =>
        matchesQuery(isClear(r) ? [clearOption?.label] : fields(r), q)
      }
      isItemEqualToValue={(a: Row<T>, b: Row<T>) =>
        isClear(a) || isClear(b) ? a === b : sameKey(getKey)(a, b)
      }
      itemToStringLabel={(r: Row<T>) =>
        isClear(r) ? (clearOption?.label ?? "") : getLabel(r)
      }
    >
      <ComboboxTrigger
        render={<Button variant={variant} />}
        className={cn("justify-between", className)}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {selected
            ? ((renderSelected ?? renderItem)?.(selected) ?? getLabel(selected))
            : placeholder}
        </span>
      </ComboboxTrigger>
      <ComboboxContent className={cn("w-72 p-1.5", contentClassName)}>
        <ComboboxInput
          showTrigger={false}
          placeholder={searchPlaceholder}
          className="mb-1"
        />
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(r: Row<T>) =>
            isClear(r) ? (
              <ComboboxItem key="__clear" value={CLEAR}>
                {clearOption?.icon}
                <span className={cn(!selected && "text-foreground")}>
                  {clearOption?.label}
                </span>
              </ComboboxItem>
            ) : (
              <ComboboxItem key={getKey(r)} value={r}>
                {renderItem?.(r) ?? getLabel(r)}
              </ComboboxItem>
            )
          }
        </ComboboxList>
        {footer && (
          <div className="border-border mt-1 space-y-0.5 border-t pt-1.5">
            {footer(close)}
          </div>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
