# Testing Infrastructure

## Test Frameworks

**Unit/Integration:** _não configurado_ — nenhum test runner em `package.json`
**E2E:** _não configurado_
**Coverage:** _não configurado_

## Test Organization

**Location:** _nenhum diretório de testes existente_
**Naming:** _N/A_
**Structure:** _N/A_

Nenhum arquivo `*.test.ts`, `*.spec.ts` ou pasta `__tests__/` encontrado no repositório.

## Testing Patterns

### Unit Tests

**Approach:** _não implementado_
**Candidatos prioritários:** `AuthService`, `TransactionService` (lógica de domínio isolável)

### Integration Tests

**Approach:** _não implementado_
**Candidatos prioritários:** rotas auth e transactions com Fastify `inject()` + DB de teste

### E2E Tests

**Approach:** _não implementado_

## Test Execution

**Commands atuais (sem testes):**

| Comando | Escopo |
|---------|--------|
| `npm run lint` | Biome check (api + front) |
| `npm run build` | tsup (api) + tsc/vite (front) |

## Coverage Targets

**Current:** 0% — sem testes
**Goals:** _não documentados_
**Enforcement:** _nenhuma_ — sem CI (`.github/` ausente)

## Test Coverage Matrix

| Code Layer | Required Test Type | Location Pattern | Run Command |
|------------|-------------------|------------------|-------------|
| API services | unit | `api/src/services/*.service.ts` | _não definido_ |
| API repositories | integration | `api/src/repositories/*.repository.ts` | _não definido_ |
| API routes/controllers | integration | `api/src/routes/*.routes.ts` | _não definido_ |
| Front components | unit | `front/src/components/**/*.tsx` | _não definido_ |
| Front pages | e2e (futuro) | `front/src/pages/**/*.tsx` | _não definido_ |
| Front lib/api | unit | `front/src/lib/api.ts` | _não definido_ |

## Parallelism Assessment

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
|-----------|----------------|-----------------|----------|
| Unit (futuro) | Yes | Mocks isolados por teste | Sem DB compartilhado se services mockam repositories |
| Integration (futuro) | No (inicialmente) | DB compartilhado via `DATABASE_URL` | `api/src/db/index.ts` — singleton postgres client |
| E2E (futuro) | Unknown | — | Não implementado |

**Nota:** Integração com DB real exigirá Testcontainers, schema isolado ou SQLite in-memory antes de paralelizar com segurança.

## Gate Check Commands

| Gate Level | When to Use | Command |
|------------|-------------|---------|
| Quick | Após mudanças em um pacote | `npm run lint -w api` ou `npm run lint -w front` |
| Build | Após task de implementação | `npm run build` |
| Full | Antes de merge (futuro) | `npm run lint && npm run build && npm test` _(test a criar)_ |

**Estado atual:** único gate disponível é lint + build manual.
