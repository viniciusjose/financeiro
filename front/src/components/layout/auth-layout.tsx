import { Link } from "react-router-dom";
import { AuthBrandPanel } from "@/components/layout/auth-brand-panel";

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: {
    question: string;
    linkText: string;
    href: string;
  };
}

function AuthMobileBrand() {
  return (
    <div className="mb-8 flex items-center gap-3 lg:hidden">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-on-primary">
        <span className="text-sm font-normal tabular-money">F</span>
      </div>
      <div className="leading-tight">
        <p className="text-heading-sm text-ink">Financeiro</p>
        <p className="text-caption text-muted-foreground">Controle pessoal</p>
      </div>
    </div>
  );
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />

      <main className="flex flex-1 flex-col bg-canvas-soft">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-12 sm:py-12">
          <div className="w-full max-w-[420px]">
            <AuthMobileBrand />

            <h1 className="text-display-md text-ink">{title}</h1>
            {description ? (
              <p className="mt-2 text-[15px] font-light text-muted-foreground">{description}</p>
            ) : null}

            <div className="mt-8">{children}</div>

            {footer ? (
              <p className="mt-8 text-center text-[15px] text-muted-foreground">
                {footer.question}{" "}
                <Link
                  to={footer.href}
                  className="font-normal text-primary no-underline hover:text-primary-deep"
                >
                  {footer.linkText}
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
