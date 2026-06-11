# Contas Bancárias Tasks

**Spec**: `.specs/features/bank-accounts/spec.md`
**Design**: Inline — spec modelo de dados + camadas existentes (`transaction.*` como referência)
**Scope**: P1 only (ACCT-01–10, ACCT-17–19) — P2/P3 fora desta entrega
**Decisões aplicadas**: D1=A (ocultar arquivadas + toggle), D2=A (só P1), D3=A (primeira conta = padrão), D4=B (sem `notes` no formulário)
**Status**: Done

---

## Execution Plan

### Phase 1: Database (Sequential)

Schema e migration antes de qualquer camada de dados.

```
T1 ──→ T2
```

### Phase 2: API (Sequential + Parallel schemas)

Repository e service em sequência; schemas Zod em paralelo após T1.

```
     ┌→ T4 [P]
T2 ──┤
     └→ T3 ──→ T5 ──→ T6 ──→ T7
```

### Phase 3: Front Foundation (Parallel)

Assets, primitives e schemas — independentes da API após T4.

```
T8 [P]   T9 [P]
              └──→ T10
T4 ──→ T11 [P]
T11 ──→ T12 [P]
```

### Phase 4: Front Components (Parallel)

Componentes de UI após foundation.

```
T10,T11 ──┬──→ T13 [P]
          └──→ T15 [P]
T12,T13 ──→ T14
```

### Phase 5: Page & Integration (Sequential)

Página, hook de dados e wiring de rotas.

```
T8,T12,T14,T15 ──→ T16 ──→ T17 ──→ T18
```

---

## Task Breakdown

### T1: Create Drizzle bank_accounts schema

**What**: Tabela `bank_accounts` com enums `bank_institution` e `bank_account_type`, FK `userId`, todos os campos do spec (incl. `isDefault`, `isActive`, `notes` na DB; `color`/`lastFourDigits` opcionais)
**Where**: `api/src/models/schema/bank-accounts.ts`, `api/src/models/schema/index.ts` (export)
**Depends on**: None
**Reuses**: `api/src/models/schema/transactions.ts` (padrão pgEnum + pgTable)
**Requirements**: ACCT-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Enums `bank_institution` (`itau`, `sofisa`, `nubank`, `inter`, `other`) e `bank_account_type` (`checking`, `savings`, `investment`, `wallet`) definidos
- [ ] Tabela com `initialBalance` numeric(12,2) default `0.00`, `currency` default `BRL`
- [ ] Tipos `BankAccount` e `NewBankAccount` exportados via `$inferSelect` / `$inferInsert`
- [ ] Gate check passes: `npm run lint -w api`

**Tests**: none
**Gate**: quick

---

### T2: Generate and apply Drizzle migration

**What**: Migration SQL para `bank_accounts` + enums; journal atualizado
**Where**: `api/drizzle/`, `api/drizzle/meta/`
**Depends on**: T1
**Requirements**: ACCT-02

**Done when**:

- [ ] `npm run db:generate -w api` produz migration sem erros
- [ ] `npm run db:migrate -w api` aplica migration no banco local
- [ ] Tabela `bank_accounts` existe no Postgres com colunas e enums corretos
- [ ] Gate check passes: `npm run lint -w api`

**Tests**: none
**Gate**: quick

**Verify**:

```bash
npm run db:generate -w api && npm run db:migrate -w api
```

---

### T3: Create BankAccountRepository

**What**: CRUD Drizzle com filtro `userId` em todas as queries
**Where**: `api/src/repositories/bank-account.repository.ts`
**Depends on**: T2
**Reuses**: `api/src/repositories/transaction.repository.ts`
**Requirements**: ACCT-04, ACCT-07, ACCT-10

**Done when**:

- [ ] `findById(id, userId)`, `list({ userId, includeInactive })`, `create`, `update`, `delete` implementados
- [ ] `list` filtra `isActive = true` quando `includeInactive = false`
- [ ] `clearDefaultForUser(userId)` para regra `isDefault` exclusivo
- [ ] `countByUser(userId)` para limite anti-abuso
- [ ] Gate check passes: `npm run lint -w api`

**Tests**: none
**Gate**: quick

---

### T4: Create bank-account route Zod schemas [P]

**What**: Schemas de body/query/params para todos os endpoints
**Where**: `api/src/routes/schemas/bank-account.schema.ts`
**Depends on**: T1
**Reuses**: `api/src/routes/schemas/transaction.schema.ts`
**Requirements**: ACCT-01, ACCT-03

**Done when**:

- [ ] `listBankAccountsSchema` com `includeInactive` boolean default `false`
- [ ] `createBankAccountSchema` valida `name` 1–80, enums, `bankName` obrigatório se `bank=other`, `initialBalance` opcional com regex decimal, `isDefault` opcional
- [ ] `updateBankAccountSchema` com campos parciais + `isActive` para arquivar
- [ ] `bankAccountIdSchema` com UUID em params
- [ ] Gate check passes: `npm run lint -w api`

**Tests**: none
**Gate**: quick

---

### T5: Create BankAccountService

**What**: Regras de domínio: `bankName` condicional, `isDefault` exclusivo, primeira conta auto-padrão (D3), limite 50 contas, ownership 404
**Where**: `api/src/services/bank-account.service.ts`
**Depends on**: T3
**Reuses**: `api/src/services/transaction.service.ts`
**Requirements**: ACCT-02, ACCT-03, ACCT-08, ACCT-10

**Done when**:

- [ ] `create`: se primeira conta do usuário → `isDefault = true`; se `isDefault` true → limpa demais
- [ ] `create`: rejeita `bankName` quando `bank != other`; exige `bankName` quando `bank = other`
- [ ] `create`: `initialBalance` default `0.00`; permite negativo
- [ ] `create`: rejeita se usuário tem ≥ 50 contas
- [ ] `update`: mesmas regras `bank`/`bankName`; `isDefault` exclusivo; arquivar (`isActive=false`) remove `isDefault` se era padrão
- [ ] `getById` / `update` / `delete` lançam `"Conta não encontrada"` se ownership falhar
- [ ] Gate check passes: `npm run lint -w api`

**Tests**: none
**Gate**: quick

---

### T6: Create BankAccountController

**What**: Handlers HTTP para list, getById, create, update, delete
**Where**: `api/src/controllers/bank-account.controller.ts`
**Depends on**: T4, T5
**Reuses**: `api/src/controllers/transaction.controller.ts`, `api/src/views/response.ts`
**Requirements**: ACCT-02, ACCT-04, ACCT-07, ACCT-09, ACCT-10

**Done when**:

- [ ] Extrai `userId` de `request.user.sub` em todos os handlers
- [ ] Respostas no envelope `{ success, data }` — `accounts`, `account`, `message`
- [ ] Erros de domínio mapeados para 404 com mensagem pt-BR
- [ ] Gate check passes: `npm run lint -w api`

**Tests**: none
**Gate**: quick

---

### T7: Wire bank-accounts API routes and DI

**What**: Rotas registradas em `/api/bank-accounts` + singletons em `services/index` e `controllers/index`
**Where**: `api/src/routes/bank-account.routes.ts`, `api/src/routes/index.ts`, `api/src/services/index.ts`, `api/src/controllers/index.ts`
**Depends on**: T6
**Reuses**: `api/src/routes/transaction.routes.ts`
**Requirements**: ACCT-02, ACCT-04, ACCT-07, ACCT-09

**Done when**:

- [ ] 5 endpoints com `preHandler: [app.authenticate]` e schemas Zod
- [ ] `registerRoutes` inclui `bankAccountRoutes` com prefix `/api`
- [ ] Gate check passes: `npm run lint -w api && npm run build -w api`

**Tests**: none
**Gate**: build

**Verify**:

```bash
# Com token válido:
curl -H "Authorization: Bearer $TOKEN" http://localhost:3333/api/bank-accounts
```

---

### T8: Add shadcn AlertDialog component [P]

**What**: Primitive `AlertDialog` para confirmação de exclusão
**Where**: `front/src/components/ui/alert-dialog.tsx`
**Depends on**: None
**Reuses**: shadcn `new-york` preset
**Requirements**: ACCT-09

**Tools**:

- MCP: NONE
- Skill: `shadcn`

**Done when**:

- [ ] Componente instalado e exportado
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T9: Add bank logo assets and static map [P]

**What**: SVGs dos 4 bancos + mapa `bank → { label, src, alt }` com fallback para `other`
**Where**: `front/src/assets/banks/*.svg`, `front/src/lib/bank-logos.ts`
**Depends on**: None
**Requirements**: ACCT-17

**Done when**:

- [ ] SVGs para `itau`, `sofisa`, `nubank`, `inter` (monocromático ou marca em fundo neutro)
- [ ] Mapa exporta labels pt-BR e `alt` descritivo (ex.: "Logo Nubank")
- [ ] Entrada `other` sem `src` — consumidor usa ícone genérico
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T10: Create BankLogo component

**What**: Componente reutilizável com tamanhos `sm` (24–32px) e `md` (40–48px), `object-contain`, fallback em erro de asset
**Where**: `front/src/components/bank-accounts/bank-logo.tsx`
**Depends on**: T9
**Reuses**: `front/src/lib/bank-logos.ts`, ícone `Building2` (Lucide)
**Requirements**: ACCT-17, ACCT-19

**Done when**:

- [ ] Renderiza SVG para bancos conhecidos; `Building2` + `bankName` para `other`
- [ ] Prop `size` controla dimensão; `alt` acessível em pt-BR
- [ ] `onError` no `<img>` faz fallback para ícone sem quebrar layout
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T11: Create front bank-account Zod schemas [P]

**What**: Schemas de formulário espelhando validação da API (sem `notes` no form — D4)
**Where**: `front/src/schemas/bank-account.schema.ts`
**Depends on**: T4
**Reuses**: `front/src/schemas/auth.schema.ts` (mensagens pt-BR)
**Requirements**: ACCT-01, ACCT-03

**Done when**:

- [ ] `createBankAccountSchema` e `updateBankAccountSchema` exportados
- [ ] `bankName` refinado: obrigatório se `bank=other`, proibido/vazio se não
- [ ] `initialBalance` opcional, aceita negativo, formato decimal
- [ ] Tipos inferidos exportados (`CreateBankAccountInput`, `UpdateBankAccountInput`)
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T12: Create front bank-accounts API service [P]

**What**: Métodos tipados `list`, `getById`, `create`, `update`, `delete` via `ApiClient`
**Where**: `front/src/services/bank-accounts.ts`
**Depends on**: T11
**Reuses**: `front/src/lib/api.ts`, `front/src/services/auth.ts` (padrão)
**Requirements**: ACCT-02, ACCT-04, ACCT-07, ACCT-09

**Done when**:

- [ ] Tipos `BankAccount` espelham response da API
- [ ] `list({ includeInactive })` passa query param
- [ ] Erros de rede propagam `Error` com mensagem da API
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T13: Create BankSelector component [P]

**What**: Seletor de banco com logo + label pt-BR para cada opção; campo `bankName` condicional para `other`
**Where**: `front/src/components/bank-accounts/bank-selector.tsx`
**Depends on**: T10, T11
**Reuses**: `BankLogo`, `front/src/components/ui` (RadioGroup ou grid de botões)
**Requirements**: ACCT-18

**Done when**:

- [ ] 5 opções visíveis com logo + label lado a lado
- [ ] Seleção `other` revela input `bankName`
- [ ] Integra com react-hook-form via `control`/`name`
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T14: Create BankAccountForm dialog

**What**: Dialog criar/editar conta — campos `name`, `bank` (BankSelector), `type`, `initialBalance`, `isDefault`; em edição: toggle `isActive` (arquivar)
**Where**: `front/src/components/bank-accounts/bank-account-form-dialog.tsx`
**Depends on**: T12, T13
**Reuses**: `front/src/components/ui/dialog.tsx`, `front/src/components/ui/form.tsx`, padrão auth forms
**Requirements**: ACCT-01, ACCT-03, ACCT-07, ACCT-08

**Done when**:

- [ ] Modo create e edit via prop `account?: BankAccount`
- [ ] Submit chama `create` ou `update` do service; toast sucesso/erro pt-BR
- [ ] Validação inline com Zod resolver (mesmo padrão login/register)
- [ ] Sem campo `notes` (D4); sem `color`/`lastFourDigits` (P3)
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T15: Create BankAccountListItem component [P]

**What**: Card/row de conta com logo, apelido, labels banco/tipo, saldo `tabular-money`, badges "Padrão" e "Arquivada", ações editar/excluir
**Where**: `front/src/components/bank-accounts/bank-account-list-item.tsx`
**Depends on**: T10, T11
**Reuses**: `BankLogo`, `front/DESIGN.md` tokens
**Requirements**: ACCT-05, ACCT-06, ACCT-19

**Done when**:

- [ ] Saldo formatado BRL pt-BR com classe `tabular-money`
- [ ] Badge "Padrão" quando `isDefault`; "Arquivada" quando `!isActive`
- [ ] Botões editar e excluir disparam callbacks
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T16: Create useBankAccounts hook

**What**: Hook com estado de listagem, `includeInactive` toggle, mutations create/update/delete e refresh
**Where**: `front/src/hooks/use-bank-accounts.ts`
**Depends on**: T12
**Reuses**: padrão de data-fetching do projeto (useState + useEffect ou TanStack Query se já adotado)
**Requirements**: ACCT-04, ACCT-09

**Done when**:

- [ ] `accounts`, `isLoading`, `error`, `includeInactive`, `setIncludeInactive`, `refresh` expostos
- [ ] `createAccount`, `updateAccount`, `deleteAccount` atualizam lista após sucesso
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T17: Create AccountsPage

**What**: Página `/accounts` com listagem, empty state + CTA, toggle "Mostrar arquivadas" (D1), form dialog, delete AlertDialog
**Where**: `front/src/pages/accounts-page.tsx`
**Depends on**: T8, T14, T15, T16
**Reuses**: `useBankAccounts`, `BankAccountFormDialog`, `BankAccountListItem`, `AlertDialog`
**Requirements**: ACCT-04, ACCT-05, ACCT-06, ACCT-09

**Done when**:

- [ ] Header com título e botão "Nova conta"
- [ ] Empty state útil: "Cadastrar primeira conta" abre dialog
- [ ] Toggle "Mostrar arquivadas" controla `includeInactive` (D1)
- [ ] Excluir pede confirmação em AlertDialog; toast pt-BR ao concluir
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T18: Register /accounts route and sidebar nav

**What**: Rota protegida e item "Contas" na sidebar
**Where**: `front/src/routes/index.tsx`, `front/src/components/layout/app-sidebar.tsx`
**Depends on**: T17
**Reuses**: padrão `/transactions` em routes e sidebar
**Requirements**: ACCT-04

**Done when**:

- [ ] `GET /accounts` renderiza `AccountsPage` dentro de `AppLayout` + `ProtectedRoute`
- [ ] Sidebar item "Contas" com ícone `Landmark` ou `Wallet` e link `/accounts`
- [ ] Gate check passes: `npm run lint -w front && npm run build -w front`

**Tests**: none
**Gate**: build

**Commit**: `feat(accounts): add bank accounts CRUD UI and API`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2

Phase 2 (API):
  T2 ──┬──→ T4 [P]
       └──→ T3 ──→ T5 ──→ T6 ──→ T7

Phase 3 (Front Foundation — parallel with late Phase 2):
  T8 [P]     T9 [P] ──→ T10
  T4 ──→ T11 [P] ──→ T12 [P]

Phase 4 (Components):
  T10,T11 ──┬──→ T13 [P]
            └──→ T15 [P]
  T12,T13 ──→ T14

Phase 5 (Integration):
  T8,T14,T15,T16 ──→ T17 ──→ T18
```

**Parallelism constraint:** Integração com DB é singleton — tasks de API são sequenciais. Front tasks `[P]` são parallel-safe (sem test runner configurado).

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Drizzle schema | 1 schema file + export | ✅ Granular |
| T2: Migration | 1 migration apply | ✅ Granular |
| T3: Repository | 1 repository class | ✅ Granular |
| T4: Route schemas | 1 schema file | ✅ Granular |
| T5: Service | 1 service class | ✅ Granular |
| T6: Controller | 1 controller class | ✅ Granular |
| T7: API wiring | 4 small file edits (cohesive) | ✅ OK |
| T8: AlertDialog | 1 UI primitive | ✅ Granular |
| T9: Logo assets + map | 1 lib + assets | ✅ OK |
| T10: BankLogo | 1 component | ✅ Granular |
| T11: Front schemas | 1 schema file | ✅ Granular |
| T12: API service | 1 service file | ✅ Granular |
| T13: BankSelector | 1 component | ✅ Granular |
| T14: Form dialog | 1 component | ✅ Granular |
| T15: ListItem | 1 component | ✅ Granular |
| T16: Hook | 1 hook file | ✅ Granular |
| T17: AccountsPage | 1 page | ✅ Granular |
| T18: Routes + nav | 2 file edits (cohesive) | ✅ OK |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | Phase 1 start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T1 | T2 → T4 [P] (T4 needs T1 only; starts after schema exists — diagram shows post-T2 which is safe) | ✅ Match |
| T5 | T3 | T3 → T5 | ✅ Match |
| T6 | T4, T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | None | T8 [P] standalone | ✅ Match |
| T9 | None | T9 [P] → T10 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T4 | T4 → T11 [P] | ✅ Match |
| T12 | T11 | T11 → T12 [P] | ✅ Match |
| T13 | T10, T11 | T10,T11 → T13 [P] | ✅ Match |
| T14 | T12, T13 | T12,T13 → T14 | ✅ Match |
| T15 | T10, T11 | T10,T11 → T15 [P] | ✅ Match |
| T16 | T12 | (hook starts Phase 5; needs T12 from Phase 3) | ✅ Match |
| T17 | T8, T14, T15, T16 | T8,T14,T15,T16 → T17 | ✅ Match |
| T18 | T17 | T17 → T18 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Drizzle schema | none | none | ✅ OK |
| T2 | Migration | none | none | ✅ OK |
| T3 | Repository | integration (futuro) | none | ✅ OK — sem test runner |
| T4 | Route schemas | none | none | ✅ OK |
| T5 | Service | unit (futuro) | none | ✅ OK — sem test runner |
| T6 | Controller | integration (futuro) | none | ✅ OK — sem test runner |
| T7 | Routes | integration (futuro) | none | ✅ OK — sem test runner |
| T8–T18 | Front components/pages/lib | unit/e2e (futuro) | none | ✅ OK — sem test runner |

**Nota:** Test runner não configurado (`TESTING.md`). Gates atuais: `lint` (quick) e `build` (integration tasks T7, T18). Quando Vitest for adicionado, T5 e T7 devem ganhar testes unitários/integration retroativos.

---

## Requirement Traceability

| Requirement | Task(s) |
| ----------- | ------- |
| ACCT-01 | T4, T11, T14 |
| ACCT-02 | T1, T2, T5, T6, T7, T12 |
| ACCT-03 | T4, T5, T11, T13, T14 |
| ACCT-04 | T3, T6, T7, T12, T16, T17, T18 |
| ACCT-05 | T15, T17 |
| ACCT-06 | T15, T17 |
| ACCT-07 | T3, T5, T6, T7, T12, T14 |
| ACCT-08 | T5, T14 |
| ACCT-09 | T6, T7, T8, T16, T17 |
| ACCT-10 | T3, T5, T6 |
| ACCT-17 | T9, T10 |
| ACCT-18 | T13 |
| ACCT-19 | T10, T15 |
| ACCT-11–16 | _P2/P3 — fora do escopo_ |

**Coverage:** 13/13 requisitos P1 mapeados ✅

---

## Out of Scope (P2/P3 — próxima feature)

- ACCT-11–13: FK `account_id` em transactions + select + bloqueio delete
- ACCT-14–15: Saldo por conta no dashboard
- ACCT-16: `color` e `lastFourDigits` no formulário
