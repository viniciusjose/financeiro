import { ChevronsUpDown, KeyRound, LogOut, Monitor, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChangePasswordDialog } from "@/components/auth/change-password-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { appNavItems } from "@/lib/navigation";
import { toast } from "@/lib/toast";
import { getUserDisplayName, getUserInitials } from "@/lib/user-display";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useTheme } from "@/providers/theme-provider";

const sidebarNavItemClassName =
  "sidebar-nav-item h-10 gap-3 rounded-xl px-3 text-[15px] font-light [&>svg]:size-5 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-2! group-data-[collapsible=icon]:[&_span]:hidden";
const sidebarIconModeMenuClassName = "group-data-[collapsible=icon]:items-center";
const sidebarIconModeGroupClassName = "group-data-[collapsible=icon]:p-1";

function SidebarMobileClose() {
  const { isMobile, setOpenMobile } = useSidebar();

  if (!isMobile) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="ml-auto size-9 shrink-0 text-muted-foreground hover:text-ink"
      onClick={() => setOpenMobile(false)}
      aria-label="Fechar menu"
    >
      <X className="size-5" />
    </Button>
  );
}

function NavMenu() {
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup className={sidebarIconModeGroupClassName}>
      <SidebarGroupContent>
        <SidebarMenu className={cn(sidebarIconModeMenuClassName, "gap-1.5")}>
          {appNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.title}
                className={sidebarNavItemClassName}
              >
                <Link
                  to={item.href}
                  onClick={() => {
                    if (isMobile) {
                      setOpenMobile(false);
                    }
                  }}
                >
                  <item.icon className={item.iconClassName} />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

const userMenuContentClassName =
  "min-w-56 rounded-lg border-hairline bg-canvas p-1.5 text-ink shadow-panel";
const userMenuItemClassName =
  "gap-2 rounded-sm px-2 py-1.5 text-[14px] font-normal focus:bg-canvas-soft focus:text-ink [&_svg]:size-4 [&_svg]:stroke-[1.75]";
const userMenuSeparatorClassName = "my-1 bg-hairline";

function UserMenu() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const displayName = getUserDisplayName(user?.name, user?.email);
  const initials = getUserInitials(user?.name, user?.email);

  const handleLogout = () => {
    logout();
    toast.info("Você saiu da sua conta.");
    navigate("/login", { replace: true });
  };

  return (
    <>
      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      <SidebarMenu className={sidebarIconModeMenuClassName}>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="rounded-md hover:bg-primary/10 hover:text-primary data-[state=open]:bg-primary/10 data-[state=open]:text-primary group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
              >
                <Avatar className="size-8 rounded-lg group-data-[collapsible=icon]:size-8">
                  <AvatarFallback className="rounded-lg bg-primary-subdued text-[13px] font-normal text-primary-deep">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-[15px] font-normal text-sidebar-foreground">
                    {displayName}
                  </span>
                  <span className="truncate text-caption text-muted-foreground">{user?.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={userMenuContentClassName}
              side={isMobile ? "top" : "right"}
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2.5 px-2 py-1.5 text-left">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary-subdued text-[13px] font-normal text-primary-deep">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate text-[14px] font-normal">{displayName}</span>
                    <span className="truncate text-caption text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className={userMenuSeparatorClassName} />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  className={`${userMenuItemClassName} data-[state=open]:bg-canvas-soft data-[state=open]:text-ink`}
                >
                  <Monitor />
                  Tema
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className={userMenuContentClassName}>
                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={(value) => setTheme(value as typeof theme)}
                  >
                    <DropdownMenuRadioItem value="light" className={userMenuItemClassName}>
                      <Sun />
                      Claro
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark" className={userMenuItemClassName}>
                      <Moon />
                      Escuro
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system" className={userMenuItemClassName}>
                      <Monitor />
                      Sistema
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem
                className={userMenuItemClassName}
                onSelect={() => setChangePasswordOpen(true)}
              >
                <KeyRound />
                Alterar senha
              </DropdownMenuItem>
              <DropdownMenuSeparator className={userMenuSeparatorClassName} />
              <DropdownMenuItem
                className={`${userMenuItemClassName} text-destructive focus:bg-destructive/10 focus:text-destructive`}
                onSelect={handleLogout}
              >
                <LogOut />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-canvas">
      <SidebarHeader className="h-14 shrink-0 justify-center gap-0 border-b border-sidebar-border px-2 py-0 group-data-[collapsible=icon]:px-1">
        <SidebarMenu className={sidebarIconModeMenuClassName}>
          <SidebarMenuItem>
            <div className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <SidebarMenuButton
                asChild
                size="lg"
                className="h-10! min-w-0 flex-1 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2!"
              >
                <Link to="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-on-primary">
                    <span className="text-sm font-normal tabular-money">F</span>
                  </div>
                  <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-heading-sm text-sidebar-foreground">
                      Financeiro
                    </span>
                    <span className="truncate text-caption text-muted-foreground">
                      Controle pessoal
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
              <SidebarMobileClose />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMenu />
      </SidebarContent>

      <SidebarFooter
        className={`border-t border-sidebar-border ${sidebarIconModeGroupClassName} group-data-[collapsible=icon]:h-14 group-data-[collapsible=icon]:shrink-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center`}
      >
        <UserMenu />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
