import { createBrowserRouter, Outlet } from "react-router-dom";
import { GuestRoute } from "@/components/auth/guest-route";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SessionRecovery } from "@/components/auth/session-recovery";
import { AppLayout } from "@/components/layout/app-layout";
import { AccountsPage } from "@/pages/accounts-page";
import { CategoriesPage } from "@/pages/categories-page";
import { CreditCardBillPage } from "@/pages/credit-card-bill-page";
import { CreditCardsPage } from "@/pages/credit-cards-page";
import { HomePage } from "@/pages/home-page";
import { LoginPage } from "@/pages/login-page";
import { RegisterPage } from "@/pages/register-page";
import { TransactionsPage } from "@/pages/transactions-page";

export const router = createBrowserRouter([
  {
    element: (
      <SessionRecovery>
        <Outlet />
      </SessionRecovery>
    ),
    children: [
      {
        path: "/login",
        element: (
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        ),
      },
      {
        path: "/register",
        element: (
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        ),
      },
      {
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "/",
            element: <HomePage />,
          },
          {
            path: "/accounts",
            element: <AccountsPage />,
          },
          {
            path: "/credit-cards",
            element: <CreditCardsPage />,
          },
          {
            path: "/credit-cards/:id/fatura",
            element: <CreditCardBillPage />,
          },
          {
            path: "/categories",
            element: <CategoriesPage />,
          },
          {
            path: "/transactions",
            element: <TransactionsPage />,
          },
        ],
      },
    ],
  },
]);
