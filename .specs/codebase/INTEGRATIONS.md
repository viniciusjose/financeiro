# External Integrations

## Database

**Service:** PostgreSQL (local ou Supabase)
**Purpose:** Persistência de usuários e transações
**Implementation:**
- Client: `postgres` driver em `api/src/db/index.ts`
- ORM: Drizzle em `api/src/models/schema/`
- Connection: `env.DATABASE_URL` validado em `api/src/config/env.ts`

**Configuration:**
```bash
# api/.env.example
DATABASE_URL=postgresql://postgres:password@localhost:5432/financeiro
```

**Authentication:** Credenciais na connection string (usuário/senha do Postgres)
**Migrations:** drizzle-kit (`npm run db:generate`, `npm run db:migrate`, `npm run db:studio`)

**Nota:** Supabase é mencionado no README como opção de hosting Postgres; não há SDK Supabase nem Supabase Auth no código — apenas Postgres compatível via URL.

## API Integrations

### Front → API REST

**Purpose:** Todas as operações do app (auth, transações)
**Location:** `front/src/lib/api.ts`
**Authentication:** Bearer JWT em header `Authorization`
**Base URL:** `import.meta.env.VITE_API_URL` (default `http://localhost:3333`)

**Key endpoints consumidos (planejado; client pronto):**

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| GET | `/api/auth/me` | Bearer |
| GET | `/api/transactions` | Bearer |
| POST | `/api/transactions` | Bearer |
| PUT | `/api/transactions/:id` | Bearer |
| DELETE | `/api/transactions/:id` | Bearer |
| GET | `/health` | — |

**Response format:** `{ success: boolean, data?: T, message?: string }`

## Security Plugins (in-process)

**Service:** @fastify/helmet, @fastify/cors, @fastify/rate-limit
**Purpose:** Headers de segurança, CORS, rate limiting
**Location:** `api/src/plugins/helmet.ts`, `cors.ts`, `rate-limit.ts`
**Configuration:** `CORS_ORIGIN`, `RATE_LIMIT_MAX`, `RATE_LIMIT_TIME_WINDOW` em env

## JWT (in-process)

**Service:** @fastify/jwt
**Purpose:** Autenticação stateless
**Location:** `api/src/plugins/jwt.ts`
**Configuration:** `JWT_SECRET` (mín. 32 chars via Zod)
**Token storage (front):** `localStorage` key `token`

## Webhooks

_Nenhum webhook configurado._

## Background Jobs

_Nenhum sistema de filas ou jobs em background._
