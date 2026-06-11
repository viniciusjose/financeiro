import { Sparkles } from "lucide-react";

function AuthLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-deep shadow-lg shadow-primary/30">
        <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
          <circle cx="12" cy="12" r="2" fill="white" />
          <path d="M12 4a8 8 0 0 1 8 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M12 8a4 4 0 0 1 4 4"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M4 12a8 8 0 0 1 8-8"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </div>
      <span className="text-xl font-semibold tracking-tight text-white">Fintrack</span>
    </div>
  );
}

const stats = [
  { value: "R$2,4M", label: "volume gerenciado" },
  { value: "98%", label: "uptime do sistema" },
  { value: "4,8★", label: "avaliação média" },
] as const;

export function AuthBrandPanel() {
  return (
    <aside className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-[#0b0b13] p-12 lg:flex">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[-15%] top-[40%] size-[420px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute right-[-10%] top-[-5%] size-[320px] rounded-full bg-primary-deep/25 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[30%] size-[280px] rounded-full bg-primary-soft/15 blur-[90px]" />
      </div>

      <AuthLogo />

      <div className="relative max-w-lg">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5">
          <Sparkles className="size-3.5 text-primary-subdued" />
          <span className="text-sm text-primary-subdued">Controle financeiro inteligente</span>
        </div>

        <h2 className="text-balance text-[2.75rem] font-semibold leading-[1.1] tracking-tight text-white">
          Suas finanças, <span className="text-primary-soft">sob total controle.</span>
        </h2>

        <p className="mt-5 max-w-md text-base leading-relaxed text-white/55">
          Acompanhe receitas, despesas e fluxo de caixa em tempo real — tudo em um único painel.
        </p>
      </div>

      <div className="relative grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/8 bg-white/5 px-4 py-5 backdrop-blur-sm"
          >
            <p className="tabular-money text-xl font-semibold text-primary-soft">{stat.value}</p>
            <p className="mt-1 text-xs leading-snug text-white/45">{stat.label}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
