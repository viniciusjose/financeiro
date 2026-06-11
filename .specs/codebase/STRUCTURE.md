# Project Structure

**Root:** `/Users/vinicius/projetos/pessoal/financeiro`

## Directory Tree

```
financeiro/
├── .specs/              # Spec-driven docs (PROJECT, ROADMAP, codebase)
├── api/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── models/schema/
│   │   ├── plugins/
│   │   ├── repositories/
│   │   ├── routes/
│   │   │   └── schemas/
│   │   ├── services/
│   │   ├── types/
│   │   └── views/
│   ├── drizzle.config.ts
│   └── package.json
├── front/
│   ├── src/
│   │   ├── components/ui/
│   │   ├── lib/
│   │   ├── providers/
│   │   └── routes/
│   ├── PRODUCT.md
│   ├── DESIGN.md
│   └── package.json
├── AGENTS.md
├── README.md
└── package.json
```

## Module Organization

### API (`api/`)

**Purpose:** Back-end REST com autenticação e CRUD de transações
**Location:** `api/src/`
**Key files:**
- `server.ts` — entry point
- `app.ts` — Fastify factory
- `config/env.ts` — env validation
- `routes/index.ts` — route registration
- `services/index.ts` — DI wiring

### Front (`front/`)

**Purpose:** SPA React para controle financeiro pessoal
**Location:** `front/src/`
**Key files:**
- `main.tsx`, `App.tsx` — bootstrap
- `routes/index.tsx` — router (placeholder)
- `lib/api.ts` — HTTP client
- `components/ui/*` — shadcn primitives

### Specs (`.specs/`)

**Purpose:** Documentação spec-driven (visão, roadmap, brownfield)
**Location:** `.specs/project/`, `.specs/codebase/`, `.specs/features/`, `.specs/quick/`

## Where Things Live

**Authentication:**

- HTTP routes: `api/src/routes/auth.routes.ts`
- Business logic: `api/src/services/auth.service.ts`
- Data access: `api/src/repositories/user.repository.ts`
- Schema: `api/src/models/schema/users.ts`
- JWT plugin: `api/src/plugins/jwt.ts`
- UI: _não implementado_ (planejado em `front/src/pages/`)

**Transactions:**

- HTTP routes: `api/src/routes/transaction.routes.ts`
- Business logic: `api/src/services/transaction.service.ts`
- Data access: `api/src/repositories/transaction.repository.ts`
- Schema: `api/src/models/schema/transactions.ts`
- UI: _não implementado_

**Configuration:**

- API env: `api/.env` (template: `api/.env.example`)
- Front env: `front/.env` (template: `front/.env.example`)
- Node version: `.nvmrc`, `.node-version`

**Design & Product:**

- Product vision: `front/PRODUCT.md`
- Design tokens: `front/DESIGN.md`
- Agent context: `AGENTS.md`

## Special Directories

**`api/src/routes/schemas/`:**
Schemas Zod para validação de rotas (body, query, params, response)

**`front/src/components/ui/`:**
Componentes shadcn gerados — não editar manualmente sem seguir padrão shadcn

**`front/src/lib/`:**
Utilitários (`cn()` em `utils.ts`) e cliente API

**Planejados (README, ainda não existem):**
- `front/src/pages/` — páginas da aplicação
- `front/src/hooks/` — custom hooks
- `front/src/schemas/` — schemas Zod do front
