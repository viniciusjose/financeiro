# Roadmap

**Current Milestone:** MVP UI
**Status:** In Progress

---

## Foundation

**Goal:** Monorepo funcional com API em camadas e shell do front-end
**Target:** Infraestrutura pronta para construir telas

### Features

**Monorepo & Tooling** - COMPLETE

- npm workspaces (`api/`, `front/`)
- Biome lint/format em ambos os pacotes
- Scripts unificados (`dev`, `build`, `lint`, `db:*`)

**API Backbone** - COMPLETE

- Fastify + plugins (CORS, Helmet, JWT, rate-limit)
- Camadas: routes, controllers, services, repositories
- Schemas Drizzle (users, transactions)
- Endpoints: health, auth, transactions CRUD

**Front Shell** - COMPLETE

- Vite + React + Tailwind v4 + shadcn base
- `ApiClient`, `ThemeProvider`, componentes UI base
- Design docs (`PRODUCT.md`, `DESIGN.md`)

---

## MVP UI

**Goal:** Usuário consegue se cadastrar, logar e gerenciar transações pela interface
**Target:** Fluxo ponta-a-ponta utilizável no browser

### Features

**Autenticação (UI)** - COMPLETE

- Spec: `.specs/features/auth-ui/spec.md` (16 requirements)
- Telas de registro e login
- Persistência de token e proteção de rotas
- Fluxo de logout

**Dashboard** - PLANNED

- Saldo atual (receitas − despesas)
- Resumo do mês corrente
- Estado vazio útil

**Contas Bancárias** - COMPLETE

- Spec: `.specs/features/bank-accounts/spec.md` (P1: 13 requirements)
- CRUD de contas por banco (Itaú, Sofisa, Nubank, Inter, Outro) com logos no MVP
- Tipos: corrente, poupança, investimentos, carteira digital
- P2: vincular transações + saldo por conta no dashboard

**Cartões de Crédito** - COMPLETE

- Spec: `.specs/features/credit-cards/spec.md` (P1: 17 requirements)
- CRUD com descrição, últimos 4 dígitos, bandeira, dia fechamento/vencimento
- FK obrigatória para conta bancária de pagamento
- P2: transações no cartão + resumo de fatura por ciclo
- P3: limite de crédito e cor personalizada

**Transações (UI)** - PLANNED

- Listagem paginada
- Formulário criar/editar transação
- Exclusão com confirmação
- Formatação monetária BRL (`tabular-money`)

**Layout & Navegação** - PLANNED

- App shell (header, nav, área de conteúdo)
- Rotas: `/`, `/login`, `/register`, `/transactions`

---

## Quality & Hardening

**Goal:** Base segura e verificável antes de features avançadas

### Features

**Segurança de Auth** - PLANNED

- Hash de senha com argon2/bcrypt (substituir SHA-256)
- Expiração de JWT
- Revisão de armazenamento de token

**Testes** - PLANNED

- Test runner (Vitest sugerido)
- Testes unitários em services
- Testes de integração em rotas críticas

**CI** - PLANNED

- Pipeline lint + build + test em PR

---

## Insights

**Goal:** Entender para onde o dinheiro vai além da listagem

### Features

**Categorias** - TASKS READY

- Spec: `.specs/features/categories/spec.md` (P1: 13 requirements)
- Tasks: `.specs/features/categories/tasks.md` (29 tasks)
- CRUD com ícone Lucide, cor, descrição e tipo (receita/despesa/ambos)
- Seed de presets no primeiro acesso; FK `categoryId` em transações
- P2: filtro, gráfico breakdown, auto-categorização por palavra-chave
- P3: subcategorias, orçamento, reordenar

**Gráficos & Tendências** - PLANNED

- Breakdown por categoria (depende de Categorias P2)
- Tendência mensal

**Filtros Avançados** - PLANNED

- Por período, tipo, categoria

---

## Future Considerations

- Mesclar/duplicar categorias; estatísticas avançadas
- Exportação de relatórios (PDF/CSV)
- Modo escuro
- PWA / offline básico
- Integração Supabase Auth (se migrar de JWT próprio)
