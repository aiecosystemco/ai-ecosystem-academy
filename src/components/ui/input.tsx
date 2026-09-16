import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-12 w-full rounded-md bg-raised px-4 text-base text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-faint focus-visible:shadow-[0_0_0_2px_var(--color-brass)] disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-md bg-raised px-4 py-3 text-base text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-faint focus-visible:shadow-[0_0_0_2px_var(--color-brass)]",
        className,
      )}
      {...props}
    />
  );
}
