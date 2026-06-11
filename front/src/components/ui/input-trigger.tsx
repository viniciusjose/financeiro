import type * as React from "react";
import { inputVariants } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function InputTrigger({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="input-trigger"
      className={cn(inputVariants({ variant: "trigger" }), className)}
      {...props}
    />
  );
}

export { InputTrigger };
