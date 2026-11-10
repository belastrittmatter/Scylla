"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { sameKey, type EntityAccessors } from "@/components/ui/entity-combobox";

export interface EntityInputComboboxProps<T> extends EntityAccessors<T> {
  /** Already filtered (e.g. server-side search) — no local filtering. */
  query: string;
  /** `reason` is base-ui's change reason, e.g. "input-clear" after a pick. */
  onQueryChange: (q: string, reason: string) => void;
  selected?: T[];
  /** Fired with the picked item (or the item removed, when it was selected). */
  onToggle: (item: T) => void;
  /** Chip content; chips render only when provided. */
  renderChip?: (item: T) => React.ReactNode;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  autoHighlight?: boolean;
}

/** Inline input with a dropdown of externally supplied items; optional chips. */
export function EntityInputCombobox<T>({
  items,
  getKey,
  getLabel,
  renderItem,
  emptyText = "No results",
  query,
  onQueryChange,
  selected = [],
  onToggle,
  renderChip,
  placeholder,
  id,
  disabled,
  autoHighlight,
}: EntityInputComboboxProps<T>) {
  const anchor = useComboboxAnchor();
  return (
    <Combobox
      multiple
      items={items}
      filter={null}
      autoHighlight={autoHighlight}
      value={selected}
      inputValue={query}
      onInputValueChange={(q, d) => onQueryChange(q, d.reason)}
      onValueChange={(next: T[]) => {
        const added = next.find(
          (n) => !selected.some((s) => getKey(s) === getKey(n)),
        );
        const removed = selected.find(
          (s) => !next.some((n) => getKey(n) === getKey(s)),
        );
        const changed = added ?? removed;
        if (changed) onToggle(changed);
      }}
      isItemEqualToValue={sameKey(getKey)}
      itemToStringLabel={getLabel}
      itemToStringValue={getKey}
    >
      <ComboboxChips ref={anchor} className="w-full">
        {renderChip &&
          selected.map((s) => (
            <ComboboxChip key={getKey(s)} showRemove={!disabled}>
              {renderChip(s)}
            </ComboboxChip>
          ))}
        <ComboboxChipsInput
          id={id}
          placeholder={placeholder}
          disabled={disabled}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item: T) => (
            <ComboboxItem key={getKey(item)} value={item}>
              {renderItem?.(item) ?? getLabel(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
