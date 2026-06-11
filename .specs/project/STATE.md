# Project State

**Last updated:** 2026-06-10 (transaction-series)

## Session

- Initialized TLC spec-driven project structure
- Mapped brownfield codebase (7 docs in `.specs/codebase/`)
- Specified feature: **Autenticação (UI)** → `.specs/features/auth-ui/spec.md`
- Tasks created: 11 atomic tasks → `.specs/features/auth-ui/tasks.md`
- Implemented: **Autenticação (UI)** — 11/11 tasks complete
- Specified feature: **Contas Bancárias** → `.specs/features/bank-accounts/spec.md` (16 requirements)
- Decisão D5 confirmada: logos dos bancos no MVP (ACCT-17–19)
- Tasks created: **Contas Bancárias** — 18 atomic tasks (P1 only) → `.specs/features/bank-accounts/tasks.md`
- Decisões D1–D4 aplicadas com defaults recomendados na spec (arquivadas ocultas + toggle, só P1, primeira conta padrão, sem notes no form)
- Implemented: **Contas Bancárias** — 18/18 tasks complete (P1 CRUD + logos)
- Specified feature: **Categorias** → `.specs/features/categories/spec.md` (19 requirements, P1: 13)
- Discuss complete: **Categorias** → `.specs/features/categories/context.md` (D1–D10 confirmados)
- Tasks created: **Categorias** — 29 atomic tasks (P1) → `.specs/features/categories/tasks.md`
- Current focus: Categorias pronta para implementação P1 (T1–T29)
- Implemented: **Categorias** — 29/29 tasks complete (P1 CRUD + transaction categoryId + UI)
- Specified feature: **Cartões de Crédito** → `.specs/features/credit-cards/spec.md` (21 requirements, P1: 17)
- Implemented: **Cartões de Crédito** — P1 CRUD completo (API + UI `/credit-cards`)
- Migration `0005_credit_cards` criada (aplicar manualmente: `npm run db:migrate` na pasta `api/`)
- Specified feature: **Transações Parceladas e Recorrentes** → `.specs/features/transaction-series/spec.md` (27 requirements)
- Decisões D1–D5: parcelada divide total; recorrente valor mensal; escopo edição/exclusão; mín 2 meses
- Implemented: **Transações Parceladas e Recorrentes** — API + front (migration `0009_transaction_series`)

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-10 | Categorias: seed silencioso, grid chips, categoria opcional (D1/D3/D5) | Menos fricção no onboarding; visual colorido; flexibilidade na transação |
| 2026-06-10 | Logos dos bancos no MVP (D5) | Reconhecimento visual na listagem e seletor; assets estáticos front-end |
| 2026-06-10 | Spec-driven workflow via `.specs/` | Rastreabilidade de requisitos e memória entre sessões |
| — | API em 5 camadas (routes → repositories) | Separação clara; já implementada no código existente |
| — | JWT próprio (não Supabase Auth) | `@fastify/jwt` já integrado; Supabase usado só como Postgres |

## Blockers

_Nenhum bloqueador ativo._

## Todos

- [x] Implementar telas de autenticação no front
- [x] Implementar CRUD de categorias e vínculo em transações
- [ ] Implementar dashboard e listagem de transações
- [ ] Substituir SHA-256 por argon2/bcrypt em `auth.service.ts`
- [ ] Adicionar `expiresIn` ao JWT
- [ ] Configurar test runner e CI
- [ ] Gerar e aplicar migrations Drizzle (`npm run db:generate`) — migration `0003_categories` aplicada manualmente

## Lessons

- Front-end tem dependências prontas (Recharts, TanStack Table) mas nenhuma página implementada — README descreve estrutura planejada (`pages/`, `hooks/`, `schemas/`) ainda inexistente
- Controllers usam `as` cast no body em vez dos tipos do Zod provider — oportunidade de melhoria de type-safety

## Deferred Ideas

- Open Finance / importação de extratos
- Orçamentos e metas
- App mobile

## Preferences

- Design: seguir `front/PRODUCT.md` e `front/DESIGN.md` (register product, indigo só em CTAs)
- Idioma da UI: pt-BR
