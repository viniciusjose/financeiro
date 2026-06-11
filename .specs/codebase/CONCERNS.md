# Codebase Concerns

**Analysis Date:** 2026-06-10

## Security Considerations

**SHA-256 password hashing:**

- Risk: SHA-256 é rápido e vulnerável a brute-force em massa; inadequado para senhas
- Files: `api/src/services/auth.service.ts` (`hashPassword`, `verifyPassword`)
- Current mitigation: salt aleatório + `timingSafeEqual` na comparação
- Recommendations: Migrar para argon2 (`@node-rs/argon2`) ou bcrypt; manter salt por usuário

**JWT sem expiração:**

- Risk: Token roubado permanece válido indefinidamente
- Files: `api/src/plugins/jwt.ts`, `api/src/controllers/auth.controller.ts` (`reply.jwtSign` sem `expiresIn`)
- Current mitigation: Nenhuma expiração configurada
- Recommendations: Adicionar `expiresIn` (ex.: `7d`); considerar refresh token ou rotação

**Token em localStorage:**

- Risk: Vulnerável a XSS — script malicioso pode ler `localStorage.getItem("token")`
- Files: `front/src/lib/api.ts`
- Current mitigation: Nenhuma (padrão comum em SPAs)
- Recommendations: Avaliar httpOnly cookie + CSRF protection; sanitizar inputs no front

**Credenciais no .env.example:**

- Risk: `.env.example` contém connection string com senha de exemplo (`api/.env.example` linha 6)
- Impact: Baixo se for só dev local, mas pode vazar em commits de `.env` real
- Recommendations: Usar placeholder genérico; garantir `.env` no `.gitignore`

## Tech Debt

**Front-end placeholder:**

- Issue: Apenas rota `"/"` com `<div />`; sem páginas, hooks ou schemas
- Files: `front/src/routes/index.tsx`
- Impact: Produto não utilizável pelo browser apesar da API funcional
- Fix approach: Implementar MVP UI conforme `ROADMAP.md` (auth, dashboard, transações)

**Body casting bypasses Zod types:**

- Issue: Controllers usam `request.body as { ... }` em vez de tipos inferidos do Zod provider
- Files: `api/src/controllers/auth.controller.ts`, `api/src/controllers/transaction.controller.ts`
- Impact: Type-safety frágil; refactors no schema não propagam para controllers
- Fix approach: Tipar handlers com `FastifyRequest<{ Body: ... }>` do schema ou usar generics do ZodTypeProvider

**Migrations não versionadas:**

- Issue: Schemas Drizzle existem mas pasta `drizzle/` (migrations geradas) ausente no repo
- Files: `api/src/models/schema/`, `api/drizzle.config.ts`
- Impact: Setup de novo ambiente depende de `db:generate` manual; drift entre devs
- Fix approach: Gerar migrations, commitar em `api/drizzle/`, documentar fluxo no README

**README vs estrutura real do front:**

- Issue: README lista `pages/`, `hooks/`, `schemas/` mas diretórios não existem
- Files: `README.md`, `front/src/`
- Impact: Confusão para novos contribuidores/agentes
- Fix approach: Criar diretórios ao implementar features ou atualizar README

## Test Coverage Gaps

**Zero automated tests:**

- Issue: Nenhum test runner, arquivo de teste ou pipeline CI
- Files: `package.json` (root, api, front); ausência de `.github/workflows/`
- Impact: Regressões não detectadas; refactors arriscados (auth, transações)
- Fix approach: Adicionar Vitest; testes unitários em services; integração com `app.inject()`; CI mínimo

## Performance Bottlenecks

_Nenhum gargalo crítico identificado no estágio atual (baixo volume, queries simples)._

**Observação:** `TransactionRepository.list` faz duas queries paralelas (items + count) — adequado para paginação atual.

## Fragile Areas

**Singleton DB client:**

- Issue: `postgres` client e `drizzle` exportados como singleton em `api/src/db/index.ts`
- Impact: Dificulta testes de integração com DB isolado; conexão compartilhada entre testes
- Fix approach: Factory injetável ou connection pool configurável por ambiente `test`

**Error-to-status mapping manual:**

- Issue: Controllers mapeiam qualquer `Error.message` para status fixo (ex.: 404 para qualquer erro em `getById`)
- Files: `api/src/controllers/transaction.controller.ts`
- Impact: Erros de infra (DB down) podem retornar 404 em vez de 500
- Fix approach: Classes de erro tipadas (`NotFoundError`, `ValidationError`) com status code

## Missing Features (documented gaps)

- Dashboard / saldo agregado — API lista transações mas não expõe endpoint de resumo
- Categorias — campo texto livre; sem entidade ou validação de categorias
- Front UI completa — ver Tech Debt acima
