const SIDEBAR_OPEN_KEY = "sidebarOpen";

export function getSidebarOpen(defaultOpen = true): boolean {
  if (typeof sessionStorage === "undefined") {
    return defaultOpen;
  }

  const stored = sessionStorage.getItem(SIDEBAR_OPEN_KEY);

  if (stored === null) {
    return defaultOpen;
  }

  return stored === "true";
}

export function setSidebarOpen(open: boolean): void {
  sessionStorage.setItem(SIDEBAR_OPEN_KEY, String(open));
}
