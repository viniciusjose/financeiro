import { Outlet } from "react-router-dom";
import { AppSearch } from "@/components/layout/app-search";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AppLayout() {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline bg-canvas px-3 sm:px-4">
          <div className="flex shrink-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="hidden h-4 sm:block" />
          </div>

          <div className="flex min-w-0 flex-1 justify-center px-1 sm:px-4">
            <div className="w-full max-w-md">
              <AppSearch />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col bg-canvas-soft">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
