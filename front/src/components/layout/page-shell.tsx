import type { ReactNode } from "react";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main className="flex flex-1 flex-col px-3 pt-4 pb-6 sm:px-4 sm:pt-5 sm:pb-8 md:px-5 md:pt-6 md:pb-10">
      <div className={cn("mx-auto flex w-full max-w-5xl flex-col gap-4", className)}>
        <AppBreadcrumb />
        {children}
      </div>
    </main>
  );
}
