import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PageHeadingProps = {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconClassName?: string;
};

export function PageHeading({ title, description, icon: Icon, iconClassName }: PageHeadingProps) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Icon className={cn("size-6 shrink-0", iconClassName)} aria-hidden="true" />
        <h1 className="text-display-md text-ink">{title}</h1>
      </div>
      {description ? (
        <p className="mt-2 max-w-prose text-[15px] font-light text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
