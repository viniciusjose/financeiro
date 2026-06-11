import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full rounded-sm border border-hairline-input bg-canvas text-[15px] font-light text-ink transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "flex h-10 px-3 py-2",
        trigger:
          "inline-flex h-10 items-center justify-between gap-2 px-3 py-2 text-left hover:bg-canvas-soft data-[placeholder=true]:text-muted-foreground",
        textarea: "flex min-h-16 resize-y px-3 py-2 field-sizing-content",
        group:
          "flex h-10 flex-1 rounded-none border-0 bg-transparent px-3 py-2 shadow-none focus-visible:ring-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        inputVariants({ variant: "default" }),
        "file:border-0 file:bg-transparent file:text-sm file:font-normal file:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input, inputVariants };
