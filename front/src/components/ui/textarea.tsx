import type * as React from "react";
import { inputVariants } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(inputVariants({ variant: "textarea" }), className)}
      {...props}
    />
  );
}

export { Textarea };
