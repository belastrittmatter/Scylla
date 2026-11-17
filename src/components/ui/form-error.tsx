import * as React from "react";
import { cn } from "cn";
import { FieldError } from "@/components/ui/field";

/** A form-level error banner (role="alert" via FieldError); renders nothing when empty. */
export function FormError({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <FieldError
      className={cn(
        "bg-destructive/10 rounded-md px-2.5 py-2 text-xs",
        className,
      )}
    >
      {children}
    </FieldError>
  );
}
