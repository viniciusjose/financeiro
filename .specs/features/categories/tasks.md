# Categorias Tasks

**Spec**: `.specs/features/categories/spec.md`
**Context**: `.specs/features/categories/context.md`
**Design**: Inline — spec modelo de dados + camadas existentes (`bank-account.*` como referência)
**Scope**: P1 only (CAT-01–13) — P2/P3 fora desta entrega
**Decisões aplicadas**: D1=seed silencioso · D3=lista única + grid chips · D5=categoria opcional · D6=dropdown ícone · D7=paleta curada · D8=descrição colapsada · D9=grid seletor transação · D10=pill badge
**Status**: Complete (T1–T29)

---

## Execution Plan

### Phase 1: Database (Sequential)

Schema `categories` + alteração `transactions` + migration com backfill.

```
T1 ──→ T2 ──→ T3
```

### Phase 2: Categories API (Sequential + Parallel schemas)

Repository e service em sequência; schemas Zod em paralelo após T1.

```
     ┌→ T5 [P]
T3 ──┤
     └→ T4 ──→ T6 ──→ T7 ──→ T8
```

### Phase 3: Transactions API — categoryId (Sequential)

Atualizar transações para FK opcional + validação de ownership.

```
T8 ──→ T9 [P] ──┐
T3 ──→ T10 ──→ T11 ──→ T12
```

### Phase 4: Front Foundation (Parallel)

Constantes, primitives e schemas — independentes após T5/T9.

```
T13 [P] ──→ T14 [P]
T13 ──→ T15 [P]
T13,T14 ──→ T16 [P]
T5  ──→ T17 [P] ──→ T18 [P]
T9  ──→ T26 [P] ──→ T27 [P]
```

### Phase 5: Front Category UI (Parallel components)

Componentes de categorias após foundation.

```
T14,T17 ──→ T19 [P]
T15,T16,T17,T18 ──→ T20
T18 ──→ T21
T19,T20,T21 ──→ T22
```

### Phase 6: Categories Page & Nav (Sequential)

```
T22 ──→ T23
```

### Phase 7: Transaction Integration (Sequential)

Seletor, badge e formulário mínimo na página de transações.

```
T14,T18 ──→ T24 [P]
T14 ──→ T25 [P]
T24,T26,T27 ──→ T28 ──→ T29
```

---

## Task Breakdown

### T1: Create Drizzle categories schema

**What**: Tabela `categories` com enum `category_type` (`expense`, `income`, `both`), FK `userId`, campos `name`, `description`, `icon`, `color`, `sortOrder`, `isActive`
**Where**: `api/src/models/schema/categories.ts`, `api/src/models/schema/index.ts` (export)
**Depends on**: None
**Reuses**: `api/src/models/schema/bank-accounts.ts`
**Requirements**: CAT-02, CAT-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Enum `category_type` definido
- [ ] Tabela com defaults: `sortOrder` 0, `isActive` true, `description` nullable
- [ ] Tipos `Category` e `NewCategory` exportados
- [ ] Gate check passes: `npm run lint -w api`

**Tests**: none
**Gate**: quick

---

### T2: Update Drizzle transactions schema for categoryId

**What**: Substituir `category text` por `categoryId uuid` nullable com FK `categories(id) ON DELETE RESTRICT`
**Where**: `api/src/models/schema/transactions.ts`
**Depends on**: T1
**Reuses**: padrão FK de `bank-accounts`
**Requirements**: CAT-13

**Done when**:

- [ ] Coluna `category_id` nullable referenciando `categories`
- [ ] Coluna `category` texto removida do schema Drizzle
- [ ] Tipos `Transaction` / `NewTransaction` atualizados
- [ ] Gate check passes: `npm run lint -w api`

**Tests**: none
**Gate**: quick

---

### T3: Generate migration with category backfill

**What**: Migration SQL: criar `categories`, adicionar `category_id`, backfill (criar categorias a partir de `category` texto único por `userId`, preencher FK), remover coluna `category`
**Where**: `api/drizzle/`, `api/drizzle/meta/`
**Depends on**: T2
**Requirements**: CAT-13

**Done when**:

- [ ] `npm run db:generate -w api` produz migration sem erros
- [ ] Migration inclui backfill para transações existentes (nome = texto original, ícone `Circle`, cor `#94A3B8`, type `both`)
- [ ] `npm run db:migrate -w api` aplica no banco local
- [ ] Gate check passes: `npm run lint -w api`

**Tests**: none
**Gate**: quick

**Verify**:

```bash
npm run db:generate -w api && npm run db:migrate -w api
```

---

### T4: Create CategoryRepository

**What**: CRUD Drizzle com filtro `userId`; `list({ userId, type?, includeInactive })`; `countByUser`; `countTransactions(categoryId)` via join ou query em transactions
**Where**: `api/src/repositories/category.repository.ts`
**Depends on**: T3
**Reuses**: `api/src/repositories/bank-account.repository.ts`
**Requirements**: CAT-04, CAT-07, CAT-09, CAT-10

**Done when**:

- [ ] `findById`, `list`, `create`, `update`, `delete`, `countByUser` implementados
- [ ] `list` filtra `isActive = true` quando `includeInactive = false`; filtro opcional por `type`
- [ ] `hasTransactions(categoryId)` retorna boolean para bloqueio de delete
- [ ] Gate check passes: `npm run lint -w api`

**Tests**: none
**Gate**: quick

---

### T5: Create category route Zod schemas [P]

**What**: Schemas body/query/params; validação `icon` contra allowlist, `color` hex `#RRGGBB`, `name` 1–50, `description` 0–200
**Where**: `api/src/routes/schemas/category.schema.ts`
**Depends on**: T1
**Reuses**: `api/src/routes/schemas/bank-account.schema.ts`
**Requirements**: CAT-01, CAT-03

**Done when**:

- [ ] `listCategoriesSchema` com `type?` enum e `includeInactive` default `false`
- [ ] `createCategorySchema` e `updateCategorySchema` com refinamentos de `icon` e `color`
- [ ] `categoryIdSchema` com UUID em params
- [ ] Gate check passes: `npm run lint -w api`

**Tests**: none
**Gate**: quick

---

### T6: Create CategoryService

**What**: Regras de domínio + `ensureDefaults(userId)` com 14 presets do spec; bloqueio delete com vínculos (409); bloqueio mudança `type` com transações incompatíveis; limite 100 categorias ativas
**Where**: `api/src/services/category.service.ts`
**Depends on**: T4
**Reuses**: `api/src/services/bank-account.service.ts`, presets em constante `DEFAULT_CATEGORIES`
**Requirements**: CAT-02, CAT-03, CAT-05, CAT-08, CAT-09, CAT-10

**Done when**:

- [ ] `list` chama `ensureDefaults` se `countByUser === 0` antes de retornar
- [ ] `create` rejeita ícone fora da allowlist e cor inválida
- [ ] `update` bloqueia mudança de `type` se `hasTransactions` com tipo incompatível
- [ ] `delete` lança erro 409 se `hasTransactions`; ownership 404 se não encontrada
- [ ] `getById` / `update` / `delete` lançam `"Categoria não encontrada"` se ownership falhar
- [ ] Gate check passes: `npm run lint -w api`

**Tests**: none
**Gate**: quick

---

### T7: Create CategoryController

**What**: Handlers HTTP list, getById, create, update, delete
**Where**: `api/src/controllers/category.controller.ts`
**Depends on**: T5, T6
**Reuses**: `api/src/controllers/bank-account.controller.ts`, `api/src/views/response.ts`
**Requirements**: CAT-02, CAT-04, CAT-07, CAT-09

**Done when**:

- [ ] Extrai `userId` de `request.user.sub` em todos os handlers
- [ ] Respostas `{ success, data }` — `categories`, `category`, `message`
- [ ] Delete com vínculos retorna 409 com mensagem pt-BR sugerindo arquivar
- [ ] Gate check passes: `npm run lint -w api`

**Tests**: none
**Gate**: quick

---

### T8: Wire categories API routes and DI

**What**: Rotas `/api/categories` + singletons em `services/index` e `controllers/index`
**Where**: `api/src/routes/category.routes.ts`, `api/src/routes/index.ts`, `api/src/services/index.ts`, `api/src/controllers/index.ts`
**Depends on**: T7
**Reuses**: `api/src/routes/bank-account.routes.ts`
**Requirements**: CAT-02, CAT-04, CAT-07, CAT-09

**Done when**:

- [ ] 5 endpoints com `preHandler: [app.authenticate]` e schemas Zod
- [ ] `registerRoutes` inclui `categoryRoutes` com prefix `/api`
- [ ] Gate check passes: `npm run lint -w api && npm run build -w api`

**Tests**: none
**Gate**: build

**Verify**:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3333/api/categories
```

---

### T9: Update transaction route Zod schemas [P]

**What**: `category` string → `categoryId` UUID opcional (nullable) em create/update
**Where**: `api/src/routes/schemas/transaction.schema.ts`
**Depends on**: T1
**Reuses**: schemas existentes
**Requirements**: CAT-11, CAT-13

**Done when**:

- [ ] `createTransactionSchema`: `categoryId: z.string().uuid().optional().nullable()`
- [ ] `updateTransactionSchema`: mesmo campo opcional
- [ ] Campo `category` texto removido
- [ ] Gate check passes: `npm run lint -w api`

**Tests**: none
**Gate**: quick

---

### T10: Update TransactionRepository for categoryId

**What**: CRUD com `categoryId`; `countByCategoryId(categoryId)`; join opcional com `categories` em `findById`/`list`
**Where**: `api/src/repositories/transaction.repository.ts`
**Depends on**: T3
**Reuses**: padrão existente
**Requirements**: CAT-11, CAT-13

**Done when**:

- [ ] `create`/`update` aceitam `categoryId` null
- [ ] `list` e `findById` retornam join com `category` pick (`id`, `name`, `icon`, `color`) quando FK presente
- [ ] `countByCategoryId` implementado
- [ ] Gate check passes: `npm run lint -w api`

**Tests**: none
**Gate**: quick

---

### T11: Update TransactionService for categoryId

**What**: Validar `categoryId` pertence ao usuário e é compatível com `type` (se informado); serializar `category` aninhado; permitir null
**Where**: `api/src/services/transaction.service.ts`
**Depends on**: T6, T10
**Reuses**: `CategoryService.getById` ou `CategoryRepository.findById`
**Requirements**: CAT-11, CAT-12, CAT-13

**Done when**:

- [ ] `create`/`update`: se `categoryId` informado, valida ownership + tipo compatível; se null, persiste sem categoria
- [ ] `serializeTransaction` inclui `categoryId` e `category?: { id, name, icon, color }`
- [ ] `TransactionService` recebe `CategoryRepository` via construtor; `services/index.ts` atualizado
- [ ] Gate check passes: `npm run lint -w api`

**Tests**: none
**Gate**: quick

---

### T12: Update TransactionController for categoryId

**What**: Handlers passam `categoryId` do body; respostas incluem categoria aninhada
**Where**: `api/src/controllers/transaction.controller.ts`
**Depends on**: T9, T11
**Reuses**: controller existente
**Requirements**: CAT-11, CAT-12

**Done when**:

- [ ] Create/update extraem `categoryId` opcional do body
- [ ] Gate check passes: `npm run lint -w api && npm run build -w api`

**Tests**: none
**Gate**: build

---

### T13: Create category icons map and color palette [P]

**What**: Subset ~50 ícones Lucide com labels pt-BR + allowlist para validação + paleta ~12 cores curadas
**Where**: `front/src/lib/category-icons.ts`, `front/src/lib/category-colors.ts`
**Depends on**: None
**Reuses**: Lucide (já no projeto)
**Requirements**: CAT-01, CAT-03

**Done when**:

- [ ] `CATEGORY_ICONS` exporta `{ name, label, Icon }[]`
- [ ] `CATEGORY_ICON_ALLOWLIST` espelha nomes para validação front
- [ ] `CATEGORY_COLOR_PALETTE` exporta array de hex com labels opcionais
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T14: Create CategoryIcon component [P]

**What**: Renderiza ícone Lucide dinâmico por `name` com cor; fallback `Circle` se ícone inválido
**Where**: `front/src/components/categories/category-icon.tsx`
**Depends on**: T13
**Reuses**: `category-icons.ts`
**Requirements**: CAT-01, CAT-12

**Done when**:

- [ ] Props: `icon`, `color`, `size?`, `className?`
- [ ] Fallback para `Circle` sem quebrar layout
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T15: Create CategoryColorPicker component [P]

**What**: Paleta curada de cores clicáveis; preview da seleção (sem hex manual — D7)
**Where**: `front/src/components/categories/category-color-picker.tsx`
**Depends on**: T13
**Reuses**: `category-colors.ts`, tokens `front/DESIGN.md`
**Requirements**: CAT-01

**Done when**:

- [ ] Grid de swatches com estado selecionado acessível (aria-pressed)
- [ ] Integra com react-hook-form via `value`/`onChange`
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T16: Create CategoryIconPicker component [P]

**What**: Dropdown/select com preview de cada ícone + label pt-BR (D6)
**Where**: `front/src/components/categories/category-icon-picker.tsx`
**Depends on**: T13, T14
**Reuses**: `CategoryIcon`, shadcn Select ou Combobox
**Requirements**: CAT-01

**Done when**:

- [ ] Lista scrollável com ícone + label por opção
- [ ] Preview da seleção atual no trigger
- [ ] Integra com react-hook-form
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T17: Create front category Zod schemas [P]

**What**: Schemas de formulário espelhando API; descrição opcional
**Where**: `front/src/schemas/category.schema.ts`
**Depends on**: T5
**Reuses**: `front/src/schemas/bank-account.schema.ts`
**Requirements**: CAT-01, CAT-03

**Done when**:

- [ ] `createCategorySchema` e `updateCategorySchema` exportados
- [ ] Validação `icon` contra allowlist local; `color` contra paleta (ou hex da paleta)
- [ ] Tipos `CreateCategoryInput`, `UpdateCategoryInput` inferidos
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T18: Create front categories API service [P]

**What**: Métodos tipados `list`, `getById`, `create`, `update`, `delete` via `ApiClient`
**Where**: `front/src/services/categories.ts`
**Depends on**: T17
**Reuses**: `front/src/services/bank-accounts.ts`
**Requirements**: CAT-02, CAT-04, CAT-07, CAT-09

**Done when**:

- [ ] Tipo `Category` espelha response da API
- [ ] `list({ type?, includeInactive })` passa query params
- [ ] Erros propagam mensagem da API (incl. 409 delete)
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T19: Create CategoryChip component [P]

**What**: Chip colorido para grid: ícone + nome + badge tipo (Despesa/Receita/Ambos); ações editar/arquivar
**Where**: `front/src/components/categories/category-chip.tsx`
**Depends on**: T14, T17
**Reuses**: `CategoryIcon`, `front/DESIGN.md`
**Requirements**: CAT-04, CAT-06

**Done when**:

- [ ] Fundo/borda usa `color` da categoria com contraste adequado
- [ ] Badge de tipo visível; descrição em tooltip se presente
- [ ] Callbacks `onEdit`, `onDelete`/`onArchive`
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T20: Create CategoryFormDialog

**What**: Dialog criar/editar — `name`, `type`, IconPicker, ColorPicker, descrição colapsada (D8), preview ao vivo; em edição: toggle arquivar
**Where**: `front/src/components/categories/category-form-dialog.tsx`
**Depends on**: T15, T16, T17, T18
**Reuses**: `dialog.tsx`, `form.tsx`, padrão `bank-account-form-dialog.tsx`
**Requirements**: CAT-01, CAT-03, CAT-07, CAT-08

**Done when**:

- [ ] Modo create/edit via prop `category?: Category`
- [ ] Descrição colapsada: "Adicionar descrição (opcional)" expande textarea
- [ ] Preview ícone+cor atualiza em tempo real
- [ ] Submit com toast pt-BR; sem campo hex manual
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T21: Create useCategories hook

**What**: Estado de listagem, `includeInactive` toggle, filtro `type?`, mutations CRUD + refresh
**Where**: `front/src/hooks/use-categories.ts`
**Depends on**: T18
**Reuses**: `use-bank-accounts.ts`
**Requirements**: CAT-04, CAT-06, CAT-09

**Done when**:

- [ ] `categories`, `isLoading`, `error`, `includeInactive`, `setIncludeInactive`, `refresh` expostos
- [ ] `createCategory`, `updateCategory`, `deleteCategory` atualizam lista após sucesso
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T22: Create CategoriesPage

**What**: Página `/categories` com grid de chips, toggle "Mostrar arquivadas", form dialog, AlertDialog delete/arquivar
**Where**: `front/src/pages/categories-page.tsx`
**Depends on**: T19, T20, T21
**Reuses**: `accounts-page.tsx`, `AlertDialog`
**Requirements**: CAT-04, CAT-05, CAT-06, CAT-09, CAT-10

**Done when**:

- [ ] Header + botão "Nova categoria"
- [ ] Grid de `CategoryChip` (lista única, badge de tipo — D3)
- [ ] Primeiro acesso: seed silencioso via API → grid populado
- [ ] Delete sem vínculos: confirmação; com vínculos: toast erro + opção arquivar
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T23: Register /categories route and sidebar nav

**What**: Rota protegida e item "Categorias" na sidebar
**Where**: `front/src/routes/index.tsx`, `front/src/lib/navigation.ts`, `front/src/components/layout/app-sidebar.tsx`
**Depends on**: T22
**Reuses**: padrão `/accounts`
**Requirements**: CAT-04

**Done when**:

- [ ] `/categories` renderiza `CategoriesPage` em `AppLayout` + `ProtectedRoute`
- [ ] Nav item com ícone `Tags` ou `FolderOpen` e link `/categories`
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T24: Create CategoryPicker component [P]

**What**: Grid visual de cards clicáveis para seleção em transações (D9); opção "Sem categoria"; filtra por `transactionType`
**Where**: `front/src/components/categories/category-picker.tsx`
**Depends on**: T14, T18
**Reuses**: `CategoryIcon`, popover/dialog
**Requirements**: CAT-11

**Done when**:

- [ ] Cards com ícone grande + nome + cor; card "Sem categoria" sem pill
- [ ] Filtra categorias ativas por tipo da transação
- [ ] Empty state com link "Criar categoria" → `/categories`
- [ ] `value`/`onChange` para `categoryId: string | null`
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T25: Create CategoryBadge component [P]

**What**: Pill colorida com ícone + nome para listagem de transações (D10)
**Where**: `front/src/components/categories/category-badge.tsx`
**Depends on**: T14
**Reuses**: `CategoryIcon`
**Requirements**: CAT-12

**Done when**:

- [ ] Renderiza pill com `icon`, `name`, `color`
- [ ] Retorna `null` ou fragmento "Sem categoria" quando props ausentes (consumidor decide)
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T26: Create front transaction Zod schemas [P]

**What**: Schema create/update com `categoryId` opcional nullable
**Where**: `front/src/schemas/transaction.schema.ts`
**Depends on**: T9
**Reuses**: `front/src/schemas/category.schema.ts` (padrão mensagens pt-BR)
**Requirements**: CAT-11

**Done when**:

- [ ] `createTransactionSchema` e `updateTransactionSchema` exportados
- [ ] `categoryId` UUID opcional/nullable; sem campo `category` texto
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T27: Create front transactions API service [P]

**What**: CRUD tipado com `categoryId` e tipo `category` aninhado na response
**Where**: `front/src/services/transactions.ts`
**Depends on**: T26
**Reuses**: `front/src/services/bank-accounts.ts`, `front/src/lib/money.ts`
**Requirements**: CAT-11, CAT-12

**Done when**:

- [ ] Tipos `Transaction` com `categoryId: string | null` e `category?`
- [ ] `list`, `create`, `update`, `delete` implementados
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T28: Create TransactionFormDialog

**What**: Dialog criar/editar transação com `CategoryPicker` grid; categoria opcional (D5)
**Where**: `front/src/components/transactions/transaction-form-dialog.tsx`
**Depends on**: T24, T26, T27
**Reuses**: `bank-account-form-dialog.tsx`, `CategoryPicker`
**Requirements**: CAT-11

**Done when**:

- [ ] Campos: descrição, valor, tipo, data, CategoryPicker
- [ ] Ao mudar `type`, picker recarrega opções e limpa seleção inválida
- [ ] Submit com toast pt-BR
- [ ] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T29: Update TransactionsPage with list and form

**What**: Substituir placeholder por listagem básica + `CategoryBadge` + `TransactionFormDialog` + empty state
**Where**: `front/src/pages/transactions-page.tsx`, `front/src/hooks/use-transactions.ts` (novo)
**Depends on**: T25, T27, T28
**Reuses**: `categories-page.tsx`, `accounts-page.tsx`
**Requirements**: CAT-11, CAT-12

**Done when**:

- [ ] Listagem paginada com descrição, valor `tabular-money`, data, `CategoryBadge` ou "Sem categoria"
- [ ] Botão "Nova transação" abre form dialog
- [ ] Gate check passes: `npm run lint -w front && npm run build -w front`

**Tests**: none
**Gate**: build

**Commit**: `feat(categories): add categories CRUD, transaction categoryId, and transaction UI`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2 ──→ T3

Phase 2 (Categories API):
  T3 ──┬──→ T5 [P]
       └──→ T4 ──→ T6 ──→ T7 ──→ T8

Phase 3 (Transactions API):
  T3 ──→ T10 ──→ T11 ──→ T12
  T1 ──→ T9 [P] ───────────────→ T12

Phase 4 (Front Foundation):
  T13 [P] ──→ T14 [P]
  T5  ──→ T17 [P] ──→ T18 [P]
  T9  ──→ T26 [P] ──→ T27 [P]
  T13 ──→ T15 [P]
  T13,T14 ──→ T16 [P]

Phase 5 (Category UI):
  T14,T17 ──→ T19 [P]
  T15,T16,T17,T18 ──→ T20
  T18 ──→ T21
  T19,T20,T21 ──→ T22

Phase 6 (Nav):
  T22 ──→ T23

Phase 7 (Transaction UI):
  T14,T18 ──→ T24 [P]
  T14 ──→ T25 [P]
  T24,T25,T27 ──→ T28 ──→ T29
```

**Parallelism constraint:** API com DB singleton — fases 2–3 sequenciais. Front `[P]` parallel-safe (sem test runner).

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: categories schema | 1 schema file | ✅ Granular |
| T2: transactions schema FK | 1 file edit | ✅ Granular |
| T3: Migration + backfill | 1 migration apply | ✅ Granular |
| T4: CategoryRepository | 1 repository | ✅ Granular |
| T5: Category Zod schemas | 1 schema file | ✅ Granular |
| T6: CategoryService | 1 service + presets constant | ✅ Granular |
| T7: CategoryController | 1 controller | ✅ Granular |
| T8: API wiring | 4 cohesive file edits | ✅ OK |
| T9: Transaction Zod update | 1 schema file | ✅ Granular |
| T10: TransactionRepository | 1 repository update | ✅ Granular |
| T11: TransactionService | 1 service update + DI | ✅ Granular |
| T12: TransactionController | 1 controller update | ✅ Granular |
| T13: Icons + palette lib | 2 lib files | ✅ OK |
| T14: CategoryIcon | 1 component | ✅ Granular |
| T15: ColorPicker | 1 component | ✅ Granular |
| T16: IconPicker | 1 component | ✅ Granular |
| T17: Front category schemas | 1 schema file | ✅ Granular |
| T18: Categories API service | 1 service file | ✅ Granular |
| T19: CategoryChip | 1 component | ✅ Granular |
| T20: CategoryFormDialog | 1 component | ✅ Granular |
| T21: useCategories hook | 1 hook | ✅ Granular |
| T22: CategoriesPage | 1 page | ✅ Granular |
| T23: Routes + nav | 3 cohesive edits | ✅ OK |
| T24: CategoryPicker | 1 component | ✅ Granular |
| T25: CategoryBadge | 1 component | ✅ Granular |
| T26: Transaction schemas | 1 schema file | ✅ Granular |
| T27: Transactions service | 1 service file | ✅ Granular |
| T28: TransactionFormDialog | 1 component | ✅ Granular |
| T29: TransactionsPage | 1 page + 1 hook | ✅ OK |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | Phase 1 start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T1 | T3 → T5 [P] | ✅ Match |
| T6 | T4 | T4 → T6 | ✅ Match |
| T7 | T5, T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T1 | T1 → T9 [P] | ✅ Match |
| T10 | T3 | T3 → T10 | ✅ Match |
| T11 | T6, T10 | T10 → T11 | ✅ Match |
| T12 | T9, T11 | T11 → T12 | ✅ Match |
| T13 | None | T13 [P] standalone | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |
| T15 | T13 | T13 → T15 | ✅ Match |
| T16 | T13, T14 | T13,T14 → T16 | ✅ Match |
| T17 | T5 | T5 → T17 | ✅ Match |
| T18 | T17 | T17 → T18 | ✅ Match |
| T19 | T14, T17 | T14,T17 → T19 | ✅ Match |
| T20 | T15, T16, T17, T18 | T15,T16,T17,T18 → T20 | ✅ Match |
| T21 | T18 | T18 → T21 | ✅ Match |
| T22 | T19, T20, T21 | T19,T20,T21 → T22 | ✅ Match |
| T23 | T22 | T22 → T23 | ✅ Match |
| T24 | T14, T18 | T14,T18 → T24 | ✅ Match |
| T25 | T14 | T14 → T25 | ✅ Match |
| T26 | T9 | T9 → T26 | ✅ Match |
| T27 | T26 | T26 → T27 | ✅ Match |
| T28 | T24, T26, T27 | T24,T26,T27 → T28 | ✅ Match |
| T29 | T25, T27, T28 | T25,T27,T28 → T29 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1–T3 | Drizzle / migration | none | none | ✅ OK |
| T4 | Repository | integration (futuro) | none | ✅ OK — sem test runner |
| T5–T8 | Service / routes | unit/integration (futuro) | none | ✅ OK — sem test runner |
| T9–T12 | Transaction layers | unit/integration (futuro) | none | ✅ OK — sem test runner |
| T13–T29 | Front | unit/e2e (futuro) | none | ✅ OK — sem test runner |

**Nota:** Gates atuais: `lint` (quick), `build` (T8, T12, T29). Vitest futuro: priorizar T6 e T11.

---

## Requirement Traceability

| Requirement | Task(s) |
| ----------- | ------- |
| CAT-01 | T5, T13, T15, T16, T17, T20 |
| CAT-02 | T1, T3, T6, T7, T8, T18 |
| CAT-03 | T1, T5, T6, T13, T15, T16, T17, T20 |
| CAT-04 | T4, T6, T7, T8, T18, T19, T21, T22, T23 |
| CAT-05 | T6, T22 |
| CAT-06 | T4, T19, T21, T22 |
| CAT-07 | T4, T6, T7, T8, T18, T20 |
| CAT-08 | T6, T20 |
| CAT-09 | T4, T6, T7, T8, T18, T21, T22 |
| CAT-10 | T4, T6, T7, T22 |
| CAT-11 | T9, T10, T11, T12, T24, T26, T27, T28, T29 |
| CAT-12 | T10, T11, T12, T25, T27, T29 |
| CAT-13 | T2, T3, T9, T10, T11 |
| CAT-14–19 | _P2/P3 — fora do escopo_ |

**Coverage:** 13/13 requisitos P1 mapeados ✅

---

## Out of Scope (P2/P3 — próxima feature)

- CAT-14: Filtro transações por categoria
- CAT-15: Gráfico breakdown dashboard
- CAT-16: Auto-categorização por palavra-chave
- CAT-17–19: Subcategorias, orçamento, reorder

---

## Ferramentas sugeridas por fase (para Execute)

| Fase | MCP / Skill |
| ---- | ----------- |
| API (T1–T12) | Skill: NONE · padrão `bank-account.*` |
| Front UI (T13–T23) | Skill: `shadcn` (Select/Combobox se necessário) · Skill: `impeccable` (chips, pills, paleta) |
| Transaction UI (T24–T29) | Skill: `impeccable` · reutilizar padrão `accounts-page` |
