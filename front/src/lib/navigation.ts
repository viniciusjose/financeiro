import {
  ArrowLeftRight,
  CreditCard,
  Landmark,
  LayoutDashboard,
  type LucideIcon,
  Tags,
} from "lucide-react";

export type AppNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  iconClassName?: string;
};

export const appName = "Financeiro";

export type BreadcrumbItem = {
  title: string;
  href?: string;
};

export const appNavItems: AppNavItem[] = [
  {
    title: "Painel",
    href: "/",
    icon: LayoutDashboard,
    iconClassName: "text-primary",
  },
  {
    title: "Transações",
    href: "/transactions",
    icon: ArrowLeftRight,
    iconClassName: "text-ruby",
  },
  {
    title: "Contas",
    href: "/accounts",
    icon: Landmark,
    iconClassName: "text-lemon",
  },
  {
    title: "Cartões",
    href: "/credit-cards",
    icon: CreditCard,
    iconClassName: "text-primary",
  },
  {
    title: "Categorias",
    href: "/categories",
    icon: Tags,
    iconClassName: "text-magenta",
  },
];

export function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const creditCardBillMatch = pathname.match(/^\/credit-cards\/[^/]+\/fatura$/);

  if (creditCardBillMatch) {
    return [
      { title: appName, href: "/" },
      { title: "Cartões", href: "/credit-cards" },
      { title: "Fatura" },
    ];
  }

  const currentNavItem = appNavItems.find((item) => item.href === pathname);

  if (!currentNavItem) {
    return [{ title: appName }];
  }

  return [{ title: appName, href: "/" }, { title: currentNavItem.title }];
}
