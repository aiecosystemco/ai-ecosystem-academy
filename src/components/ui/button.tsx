import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[opacity,transform,background-color,box-shadow] duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-brass text-brass-fg hover:opacity-90",
        ink: "bg-fg text-bg hover:opacity-90",
        ghost: "bg-transparent text-fg hover:bg-raised",
        outline:
          "bg-transparent text-fg shadow-[0_0_0_1px_rgba(243,238,230,0.14)] hover:bg-raised",
        danger: "bg-danger text-fg hover:opacity-90",
        paper: "bg-paper text-ink hover:opacity-90",
        quiet: "bg-raised text-fg hover:opacity-90",
      },
      size: {
        sm: "min-h-11 h-11 px-3 text-sm rounded-md",
        md: "h-11 px-4 text-sm rounded-md min-h-11",
        lg: "h-12 px-5 text-base rounded-lg min-h-12",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
