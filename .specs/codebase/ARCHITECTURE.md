# Architecture

**Pattern:** Monorepo com API REST em camadas + SPA React

## High-Level Structure

```
Browser (React SPA)
    │ fetch + Bearer JWT
    ▼
Fastify API (:3333)
    │ routes (Zod validation)
    ▼
controllers → services → repositories
    │ Drizzle ORM
    ▼
PostgreSQL
```

## Identified Patterns

### Layered API (5 layers)

**Location:** `api/src/`
**Purpose:** Separar HTTP, regras de negócio e persistência
**Implementation:**
- `routes/` — define endpoints, schemas Zod, `preHandler` de auth
- `controllers/` — traduz request/response HTTP, sem regras de negócio
- `services/` — regras de negócio e validações de domínio
- `repositories/` — queries Drizzle
- `models/schema/` — definição de tabelas

**Example:** `transaction.routes.ts` → `TransactionController` → `TransactionService` → `TransactionRepository`

### Manual Dependency Injection

**Location:** `api/src/services/index.ts`, `api/src/controllers/index.ts`
**Purpose:** Instanciar repositórios e serviços sem framework DI
**Implementation:** Singletons exportados; controllers recebem services via construtor

```typescript
// services/index.ts
const userRepository = new UserRepository();
export const authService = new AuthService(userRepository);
```

### Uniform API Response Envelope

**Location:** `api/src/views/response.ts`, `api/src/types/api.ts`
**Purpose:** Respostas consistentes `{ success, data?, message? }`
**Implementation:** `sendSuccess()` / `sendError()` usados por todos os controllers

### Zod Route Validation

**Location:** `api/src/routes/schemas/`, `api/src/app.ts`
**Purpose:** Validar body/query/params na borda HTTP
**Implementation:** `fastify-type-provider-zod` com `validatorCompiler` / `serializerCompiler`

**Example:** `auth.routes.ts` usa `registerSchema` no `schema` da rota

### Fastify Plugin Registration

**Location:** `api/src/plugins/`
**Purpose:** Cross-cutting concerns (CORS, Helmet, JWT, rate-limit)
**Implementation:** `registerPlugins()` chamado em `buildApp()` antes das rotas

### Front ApiClient Singleton

**Location:** `front/src/lib/api.ts`
**Purpose:** Cliente HTTP centralizado com token JWT do `localStorage`
**Implementation:** Métodos `get/post/put/delete`; lança `Error` em falhas

## Data Flow

### Authentication

```
POST /api/auth/register | /api/auth/login
  → Zod valida body
  → AuthController
  → AuthService (hash/verify password, UserRepository)
  → reply.jwtSign({ sub, email })
  → { success: true, data: { user, token } }

GET /api/auth/me
  → preHandler: app.authenticate (jwtVerify)
  → AuthController.me → request.user
```

### Transaction CRUD

```
GET/POST/PUT/DELETE /api/transactions[...]
  → preHandler: app.authenticate
  → TransactionController (extrai request.user.sub)
  → TransactionService (valida amount > 0, ownership via userId)
  → TransactionRepository (queries com filtro userId)
  → Drizzle → PostgreSQL
```

## Code Organization

**Approach:** Layer-based no API; feature-ready no front (estrutura planejada, parcialmente implementada)

**API structure:**
```
api/src/
├── config/       env validation
├── plugins/      Fastify plugins
├── routes/       HTTP + schemas
├── controllers/  HTTP handlers
├── services/     business logic
├── repositories/ data access
├── models/schema/ Drizzle tables
├── views/        response helpers
├── db/           drizzle client
└── types/        shared TS types
```

**Front structure (atual):**
```
front/src/
├── components/ui/   shadcn primitives
├── routes/          React Router (placeholder)
├── providers/       ThemeProvider
├── lib/             api client, utils
└── (pages/, hooks/, schemas/ — planejados, não criados)
```

**Module boundaries:**
- API e front são pacotes independentes no workspace
- Comunicação apenas via HTTP REST (`VITE_API_URL`)
- Sem código compartilhado entre pacotes
