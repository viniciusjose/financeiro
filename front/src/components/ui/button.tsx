import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-base font-normal transition-[color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary-press hover:shadow-md hover:shadow-primary/25 active:translate-y-px active:bg-primary-press active:shadow-sm active:shadow-primary/10 motion-reduce:active:translate-y-0",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border border-primary bg-canvas text-primary hover:bg-canvas-soft",
        secondary: "bg-brand-dark text-on-primary hover:bg-brand-dark/90",
        ghost: "text-ink hover:bg-canvas-soft",
        "ghost-destructive": "text-destructive hover:bg-destructive/10",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-10 px-4 py-2 [&_svg]:size-4",
        sm: "min-h-8 gap-1.5 px-2.5 py-1 text-[13px] [&_svg]:size-3.5",
        lg: "min-h-11 px-6 py-2.5 [&_svg]:size-4",
        icon: "size-10 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
