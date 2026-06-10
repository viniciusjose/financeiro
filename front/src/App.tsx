import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/providers/theme-provider";
import { router } from "@/routes";

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="financeiro-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
