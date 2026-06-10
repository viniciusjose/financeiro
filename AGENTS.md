# Financeiro — Agent Context

Monorepo de controle financeiro pessoal (`api/` + `front/`).

## Design Context

Antes de alterar UI ou UX no front-end, leia:

- **`front/PRODUCT.md`** — register (`product`), usuários, propósito, personalidade editorial-premium, anti-referências e princípios estratégicos
- **`front/DESIGN.md`** — tokens visuais (cores, tipografia Inter 300, componentes pill/card/input, gradient mesh em auth)

Impeccable resolve ambos via `.agents/context/` (symlinks). Regra Cursor: `.cursor/rules/front-design.mdc`.

**Register:** product — design serve tarefas (dashboard, transações), não marketing-first.

**Resumo rápido:** indigo `#533afd` só em CTAs; texto ink `#0d253d`; valores monetários com `tabular-money` (`tnum`); botões pill; cards `rounded-lg` 12px.
