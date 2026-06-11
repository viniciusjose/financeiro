# Categorias Specification

## Problem Statement

Hoje cada transação guarda `category` como texto livre — sem padronização, sem identidade visual e impossível de agregar com confiança. Usuários não conseguem reconhecer rapidamente "para onde foi o dinheiro" nem manter um vocabulário consistente ao longo do tempo. Sem categorias estruturadas, gráficos de breakdown e filtros avançados (já previstos no roadmap) ficam bloqueados.

## Goals

- [ ] Usuário cria e gerencia categorias personalizadas com **nome**, **ícone**, **cor** e **descrição**
- [ ] Cada categoria tem identidade visual reconhecível na listagem de transações e em seletores
- [ ] Transações referenciam categorias por FK (não mais texto solto)
- [ ] Base pronta para breakdown por categoria no dashboard e filtros (features posteriores)

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Orçamento / limite por categoria | Domínio de metas; milestone futuro (`PROJECT.md`) |
| Auto-categorização com ML / IA | Complexidade e custo; regras simples podem vir em P2 |
| Subcategorias em árvore (pai/filho) | Aumenta UX e modelo; P3 se houver demanda |
| Categorias compartilhadas entre usuários | Fora do escopo v1 |
| Ícones customizados (upload SVG) | Lucide cobre MVP; upload exige storage e validação |
| Emojis como ícone primário | Inconsistente entre SO/fontes; Lucide alinha ao design system |
| Categorias globais editáveis pelo usuário | Presets do sistema são cópia no cadastro; usuário edita só as suas |

---

## Modelo de Dados — Entidade `Category`

### Campos

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
| ----- | ---- | ----------- | --------- | ------- |
| `id` | UUID | sim | Identificador único | — |
| `userId` | UUID (FK) | sim | Dono; cascade delete com `users` | — |
| `name` | string (1–50) | sim | Nome exibido na UI | "Alimentação" |
| `description` | string? (0–200) | não | Texto auxiliar; tooltip ou subtítulo no gerenciador | "Mercado, restaurantes, delivery" |
| `icon` | string (1–50) | sim | Nome do ícone **Lucide** (PascalCase) | `"UtensilsCrossed"` |
| `color` | string (hex) | sim | Cor de destaque da categoria | `#E85D4C` |
| `type` | enum | sim | Aplicável a receitas, despesas ou ambos | `expense` |
| `sortOrder` | integer | sim | Ordem na listagem/seletor; default por `createdAt` | `0` |
| `isActive` | boolean | sim | `false` = arquivada; não aparece em novos cadastros | `true` |
| `createdAt` | timestamp | sim | Auditoria | — |
| `updatedAt` | timestamp | sim | Auditoria | — |

**Enum `type`:**

| Valor | Label pt-BR | Uso |
| ----- | ----------- | --- |
| `expense` | Despesa | Só em transações `expense` |
| `income` | Receita | Só em transações `income` |
| `both` | Ambos | Qualquer tipo de transação |

### Migration em `transactions`

Substituir `category text NOT NULL` por:

```sql
category_id UUID NULL REFERENCES categories(id) ON DELETE RESTRICT
```

- Transações existentes com texto: migration cria categorias `both` a partir dos valores únicos por `userId` (nome = texto original, ícone/cor default) e preenche `category_id`
- Após migration, `categoryId` é **opcional** em create/update — usuário pode escolher "Sem categoria" (decisão D5)

### Regras de domínio

1. WHEN `type = expense` THEN categoria SHALL aparecer apenas em transações de despesa
2. WHEN `type = income` THEN categoria SHALL aparecer apenas em transações de receita
3. WHEN `type = both` THEN categoria SHALL aparecer em ambos os tipos
4. WHEN usuário tenta excluir categoria com transações vinculadas THEN sistema SHALL impedir hard delete e oferecer arquivar (`isActive = false`)
5. WHEN categoria é arquivada THEN SHALL permanecer visível em transações existentes mas não em novos cadastros
6. WHEN `name` contém apenas espaços THEN sistema SHALL rejeitar validação
7. WHEN `color` não é hex válido (`#RRGGBB`) THEN sistema SHALL rejeitar validação
8. WHEN `icon` não existe no catálogo Lucide permitido THEN sistema SHALL rejeitar validação
9. WHEN usuário não tem categorias THEN sistema SHALL exibir presets sugeridos + CTA criar (ver P1 seed)

### Categorias padrão (seed no primeiro acesso)

Ao primeiro `GET /api/categories` (ou no registro), sistema SHALL criar presets se o usuário não tiver nenhuma:

**Despesas (`expense`):**

| Nome | Ícone Lucide | Cor sugerida |
| ---- | ------------ | ------------ |
| Alimentação | `UtensilsCrossed` | `#E85D4C` |
| Transporte | `Car` | `#3B82F6` |
| Moradia | `Home` | `#8B5CF6` |
| Saúde | `HeartPulse` | `#10B981` |
| Lazer | `Gamepad2` | `#F59E0B` |
| Compras | `ShoppingBag` | `#EC4899` |
| Educação | `GraduationCap` | `#6366F1` |
| Contas e serviços | `Receipt` | `#64748B` |
| Outros | `MoreHorizontal` | `#94A3B8` |

**Receitas (`income`):**

| Nome | Ícone Lucide | Cor sugerida |
| ---- | ------------ | ------------ |
| Salário | `Briefcase` | `#10B981` |
| Freelance | `Laptop` | `#3B82F6` |
| Investimentos | `TrendingUp` | `#8B5CF6` |
| Presente / reembolso | `Gift` | `#F59E0B` |
| Outros | `MoreHorizontal` | `#94A3B8` |

Presets são registros normais em `categories` (editáveis e excluíveis pelo usuário); não há flag `isSystem`.

### Paleta de cores na UI (decisão confirmada)

Color picker SHALL oferecer **apenas paleta curada** (~12 cores) alinhada ao design editorial (sem neon/crypto). Sem campo hex manual no MVP.

Preview do ícone com fundo/círculo na cor escolhida (contraste WCAG ≥3:1 no badge).

### Seletor de ícones na UI (decisão confirmada)

- **Dropdown com preview** — lista scrollável de subset Lucide (~40–60 ícones) com label pt-BR e preview ao lado de cada opção
- Preview em tempo real no formulário ao selecionar ícone + cor
- Descrição: campo **colapsado** — "Adicionar descrição (opcional)" expande textarea

---

## User Stories

### P1: Cadastrar categoria ⭐ MVP

**User Story**: Como usuário logado, quero criar uma categoria com nome, ícone, cor e descrição opcional, para classificar minhas transações de forma consistente e visual.

**Why P1**: Entidade central; sem categorias estruturadas não há valor na feature.

**Acceptance Criteria**:

1. WHEN usuário autenticado acessa `/categories` THEN sistema SHALL exibir listagem (vazia, com seed ou com categorias) e ação "Nova categoria"
2. WHEN usuário submete formulário com `name`, `icon`, `color`, `type` válidos THEN sistema SHALL persistir via `POST /api/categories` associado ao `userId` da sessão
3. WHEN `description` não informada THEN sistema SHALL persistir `null`
4. WHEN cadastro é bem-sucedido THEN sistema SHALL exibir toast de sucesso em pt-BR e atualizar a listagem
5. WHEN campos obrigatórios inválidos THEN sistema SHALL impedir submit e exibir erros inline (mesmo padrão de contas/auth)
6. WHEN formulário é exibido THEN sistema SHALL incluir dropdown de ícone com preview e paleta curada de cores
7. WHEN usuário seleciona ícone e cor THEN preview SHALL atualizar em tempo real no formulário
8. WHEN formulário carrega THEN campo descrição SHALL estar colapsado; expandir via "Adicionar descrição (opcional)"

**Independent Test**: Login → Nova categoria ("Pets", `Dog`, `#F59E0B`, despesa) → item aparece na listagem com ícone, cor e nome corretos.

---

### P1: Listar categorias ⭐ MVP

**User Story**: Como usuário logado, quero ver todas as minhas categorias agrupadas ou filtradas por tipo, para gerenciar meu vocabulário financeiro.

**Why P1**: Complemento vertical do cadastro; valida isolamento por usuário.

**Acceptance Criteria**:

1. WHEN usuário autenticado chama `GET /api/categories` THEN sistema SHALL retornar apenas categorias do `userId` da sessão
2. WHEN listagem é exibida THEN sistema SHALL renderizar **grid de chips coloridos** — ícone + nome + badge de tipo (Despesa/Receita/Ambos); despesas e receitas na mesma lista
3. WHEN usuário não tem categorias THEN sistema SHALL executar seed silencioso no primeiro GET e exibir grid populado
4. WHEN `isActive = false` THEN sistema SHALL ocultar por padrão com toggle "Mostrar arquivadas" (mesmo padrão de contas)
5. WHEN listagem carrega THEN categorias SHALL ordenar por `sortOrder` asc, depois `name` asc

**Independent Test**: Primeiro acesso → presets aparecem; criar categoria custom → listagem mostra ambas; outro usuário não vê categorias alheias.

---

### P1: Editar categoria ⭐ MVP

**User Story**: Como usuário, quero editar nome, ícone, cor, descrição e tipo de uma categoria para manter meu cadastro atualizado.

**Why P1**: Categorias evoluem; usuário corrige nomes e identidade visual.

**Acceptance Criteria**:

1. WHEN usuário edita via `PUT /api/categories/:id` THEN sistema SHALL atualizar apenas se `userId` corresponder ao da sessão
2. WHEN `id` não existe ou pertence a outro usuário THEN sistema SHALL retornar 404
3. WHEN edição é bem-sucedida THEN sistema SHALL atualizar `updatedAt` e refletir na UI
4. WHEN usuário altera `type` de `expense` para `income` e existem transações incompatíveis THEN sistema SHALL bloquear com mensagem clara listando quantidade afetada

**Independent Test**: Editar cor e descrição → listagem reflete; tentar mudar tipo com transações vinculadas → erro amigável.

---

### P1: Excluir ou arquivar categoria ⭐ MVP

**User Story**: Como usuário, quero remover ou arquivar categorias que não uso mais para manter a listagem limpa.

**Why P1**: CRUD completo; evita poluição do seletor de transações.

**Acceptance Criteria**:

1. WHEN usuário solicita exclusão via `DELETE /api/categories/:id` sem transações vinculadas THEN sistema SHALL remover após confirmação na UI
2. WHEN categoria tem transações vinculadas THEN sistema SHALL retornar 409 e UI SHALL oferecer arquivar em vez de excluir
3. WHEN arquivar (`isActive = false`) THEN categoria SHALL sumir do seletor de novas transações mas permanecer nas existentes
4. WHEN exclusão/arquivamento é bem-sucedido THEN sistema SHALL exibir toast em pt-BR

**Independent Test**: Criar categoria sem transações → excluir OK; vincular transação → exclusão bloqueada, arquivar OK.

---

### P1: Selecionar categoria na transação ⭐ MVP

**User Story**: Como usuário, quero escolher uma categoria ao registrar ou editar uma transação, para classificar receitas e despesas visualmente.

**Why P1**: Entrega o valor principal — categorização no fluxo diário.

**Acceptance Criteria**:

1. WHEN usuário cria/edita transação THEN formulário SHALL incluir seletor em **grid visual de cards clicáveis** (ícone + nome + cor)
2. WHEN `type` da transação é `expense` THEN grid SHALL listar apenas categorias `expense` e `both` ativas
3. WHEN `type` da transação é `income` THEN grid SHALL listar apenas categorias `income` e `both` ativas
4. WHEN usuário não seleciona categoria THEN sistema SHALL permitir salvar com `categoryId` null ("Sem categoria")
5. WHEN nenhuma categoria compatível existe THEN grid SHALL exibir empty state com link "Criar categoria"
6. WHEN transação é salva com categoria THEN API SHALL persistir `categoryId` (não mais `category` texto)
7. WHEN listagem de transações exibe item com categoria THEN SHALL mostrar **pill colorida** com ícone + nome
8. WHEN transação não tem `categoryId` THEN listagem SHALL exibir "Sem categoria" (sem pill)

**Independent Test**: Criar despesa → seletor mostra só categorias de despesa → salvar → listagem exibe badge colorido.

---

### P2: Filtrar transações por categoria

**User Story**: Como usuário, quero filtrar a listagem de transações por uma ou mais categorias para analisar gastos específicos.

**Why P2**: Reforça utilidade das categorias; depende da UI de transações estar funcional.

**Acceptance Criteria**:

1. WHEN usuário aplica filtro de categoria na listagem THEN sistema SHALL retornar apenas transações com `categoryId` correspondente
2. WHEN múltiplas categorias selecionadas THEN sistema SHALL usar OR lógico
3. WHEN filtro ativo THEN UI SHALL exibir chips removíveis com ícone/cor da categoria

**Independent Test**: 3 despesas em categorias diferentes → filtrar "Alimentação" → só 1 aparece.

---

### P2: Breakdown por categoria no dashboard

**User Story**: Como usuário, quero ver quanto gastei ou recebi por categoria no mês, para entender para onde vai o dinheiro.

**Why P2**: Alinhado a `PRODUCT.md` ("para onde foi?") e Recharts já nas dependências.

**Acceptance Criteria**:

1. WHEN dashboard carrega THEN sistema SHALL exibir gráfico (donut ou barra) com totais do mês corrente agrupados por categoria
2. WHEN categoria não tem transações no período THEN SHALL omitir ou exibir zero
3. WHEN valores renderizados THEN SHALL usar `tabular-money` e BRL pt-BR
4. WHEN segmento do gráfico usa cor THEN SHALL usar `color` da categoria

**Independent Test**: 2 despesas em "Transporte" e 1 em "Alimentação" → gráfico reflete proporções corretas.

---

### P2: Regras de auto-categorização

**User Story**: Como usuário, quero definir que transações com certa palavra na descrição sejam categorizadas automaticamente, para reduzir trabalho repetitivo.

**Why P2**: Alto valor de produtividade; regras simples sem ML.

**Acceptance Criteria**:

1. WHEN usuário cria regra (`pattern` + `categoryId`) THEN sistema SHALL aplicar em novas transações cujo `description` contém `pattern` (case-insensitive)
2. WHEN múltiplas regras coincidem THEN sistema SHALL usar a mais específica (match mais longo) ou a mais recente (decisão em aberto)
3. WHEN usuário edita transação THEN auto-categoria SHALL ser sugestão pré-preenchida, editável antes do save
4. WHEN regra referencia categoria arquivada THEN sistema SHALL ignorar regra

**Independent Test**: Regra "uber" → Transporte → criar despesa "Uber trabalho" → categoria Transporte pré-selecionada.

---

### P3: Subcategorias

**User Story**: Como usuário, quero organizar categorias em hierarquia (ex.: Alimentação → Delivery, Mercado) para granularidade sem poluir o seletor principal.

**Why P3**: Poderoso mas complexifica modelo, migration e UX.

**Acceptance Criteria**:

1. WHEN categoria tem `parentId` THEN SHALL exibir indentação na listagem e agrupamento no seletor
2. WHEN usuário exclui categoria pai com filhos THEN sistema SHALL exigir realocação ou exclusão em cascata (decisão na implementação)

---

### P3: Orçamento mensal por categoria

**User Story**: Como usuário, quero definir um limite de gasto por categoria e ver progresso no dashboard, para controlar excessos.

**Why P3**: Feature de metas; depende de categorias estáveis.

**Acceptance Criteria**:

1. WHEN usuário define `monthlyBudget` em categoria `expense` THEN dashboard SHALL exibir barra de progresso (gasto / limite)
2. WHEN gasto ultrapassa 100% THEN indicador SHALL mudar para estado de alerta (sem push notification no MVP)

---

### P3: Reordenar categorias (drag-and-drop)

**User Story**: Como usuário, quero ordenar categorias no gerenciador para priorizar as que mais uso no seletor.

**Why P3**: Melhora UX; `sortOrder` já previsto no modelo.

**Acceptance Criteria**:

1. WHEN usuário arrasta item na listagem THEN sistema SHALL persistir nova ordem via `PATCH /api/categories/reorder`
2. WHEN seletor de transação abre THEN categorias SHALL respeitar `sortOrder` do usuário

---

## Funcionalidades Sugeridas (resumo)

| # | Funcionalidade | Prioridade | Valor |
| - | -------------- | ---------- | ----- |
| 1 | CRUD com ícone Lucide + cor + descrição | P1 ⭐ | Identidade visual e vocabulário consistente |
| 2 | Seed de categorias padrão no primeiro acesso | P1 ⭐ | Reduz fricção; usuário começa a categorizar no dia 1 |
| 3 | Seletor visual na transação (ícone + cor) | P1 ⭐ | Fluxo principal de categorização |
| 4 | Arquivar em vez de excluir quando há vínculos | P1 ⭐ | Integridade dos dados históricos |
| 5 | Tipo da categoria (receita/despesa/ambos) | P1 ⭐ | Seletor contextual sem ruído |
| 6 | Filtro de transações por categoria | P2 | Análise pontual de gastos |
| 7 | Gráfico breakdown no dashboard | P2 | Responde "para onde foi o dinheiro?" |
| 8 | Regras de auto-categorização por palavra-chave | P2 | Menos trabalho manual repetitivo |
| 9 | Subcategorias hierárquicas | P3 | Granularidade sem lista plana enorme |
| 10 | Orçamento/limite por categoria | P3 | Controle proativo de gastos |
| 11 | Reordenar por drag-and-drop | P3 | Personalização do seletor |
| 12 | Duplicar categoria (template) | P3 | Criar variações rápidas |
| 13 | Mesclar categorias | P3 | Limpar duplicatas após uso prolongado |
| 14 | Estatísticas: top 5 categorias do mês | P2 | Insight rápido sem abrir gráfico completo |

---

## Edge Cases

- WHEN usuário cadastra categoria com nome duplicado (mesmo `type`) THEN sistema SHALL permitir (sem unique constraint) — mesclar fica para P3
- WHEN transação sem `categoryId` (legado pós-migration) THEN listagem SHALL exibir "Sem categoria" com CTA para recategorizar
- WHEN ícone Lucide é descontinuado em upgrade THEN sistema SHALL fallback para `Circle` na UI
- WHEN cor muito clara reduz contraste do ícone THEN badge SHALL usar fundo `canvas-soft` com borda na cor da categoria
- WHEN usuário excede 100 categorias ativas THEN sistema SHALL rejeitar criação com mensagem clara (anti-abuso)
- WHEN API retorna erro de rede no front THEN sistema SHALL exibir mensagem recuperável em pt-BR
- WHEN usuário altera `type` da transação no formulário THEN seletor de categoria SHALL recarregar opções compatíveis e limpar seleção inválida

---

## API Contract (novo)

| Endpoint | Auth | Body / Params | Response `data` |
| -------- | ---- | ------------- | --------------- |
| `GET /api/categories` | Bearer | Query: `?type=expense&includeInactive=false` | `{ categories: Category[] }` |
| `GET /api/categories/:id` | Bearer | — | `{ category: Category }` |
| `POST /api/categories` | Bearer | CreateCategoryBody | `{ category: Category }` |
| `PUT /api/categories/:id` | Bearer | UpdateCategoryBody | `{ category: Category }` |
| `DELETE /api/categories/:id` | Bearer | — | `{ message }` ou 204; 409 se vínculos |
| `PATCH /api/categories/reorder` | Bearer | `{ orderedIds: string[] }` | `{ categories: Category[] }` (P3) |

**Category (response):**

```typescript
{
  id: string;
  name: string;
  description: string | null;
  icon: string;       // Lucide icon name, e.g. "UtensilsCrossed"
  color: string;      // "#E85D4C"
  type: "expense" | "income" | "both";
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Transaction (alteração):**

```typescript
// antes: category: string
// depois:
categoryId: string;
// response enriquecida (opcional):
category?: Pick<Category, "id" | "name" | "icon" | "color">;
```

Envelope: `{ success, data?, message? }` — mesmo padrão de `api/src/views/response.ts`.

---

## Technical Notes (para implementação)

- Seguir camadas existentes: `category.routes.ts` → controller → service → repository
- Schema Drizzle: `api/src/models/schema/categories.ts`
- Enum PostgreSQL: `category_type` (`expense`, `income`, `both`)
- Migration: `category_id` em `transactions`; script de backfill texto → categorias
- Front: rota `/categories`, item na sidebar, service em `front/src/services/categories.ts`
- Componentes reutilizáveis: `CategoryIcon` (Lucide dinâmico + cor), `CategoryPicker`, `IconPicker`, `ColorPicker`
- Mapa de ícones: `front/src/lib/category-icons.ts` (subset Lucide + labels pt-BR)
- Seed: `CategoryService.ensureDefaults(userId)` no primeiro list ou hook pós-registro
- Atualizar schemas Zod de transação (`category` → `categoryId`)

---

## Decisões Confirmadas

Contexto completo: `.specs/features/categories/context.md`

| # | Decisão | Escolha |
| - | ------- | ------- |
| D1 | **Seed automático** | **(a)** Silencioso no primeiro `GET /categories` — sem wizard |
| D2 | **Escopo P1** | CRUD + vínculo transação (vertical slice) |
| D3 | **Listagem** | **(b)** Lista única com badge de tipo; layout em **grid de chips** |
| D4 | **Conflito auto-categorização** | Match mais longo — adiado para P2 |
| D5 | **Categoria na transação** | **(b)** Opcional — "Sem categoria" permitido; `categoryId` nullable |
| D6 | **Ícone no form** | Dropdown com preview (não grid) |
| D7 | **Cor no form** | Paleta curada apenas (sem hex manual) |
| D8 | **Descrição no form** | Colapsada — "Adicionar descrição (opcional)" |
| D9 | **Seletor na transação** | Grid visual de cards clicáveis |
| D10 | **Badge na listagem** | Pill colorida com ícone + nome |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Tasks | Status |
| -------------- | ----- | ----- | ----- | ------ |
| CAT-01 | P1: Cadastro — formulário ícone/cor/descrição | P1 | T5, T13–T17, T20 | Mapped |
| CAT-02 | P1: Cadastro — POST API + persistência | P1 | T1–T3, T6–T8, T18 | Mapped |
| CAT-03 | P1: Cadastro — validação icon/color/type | P1 | T5, T6, T13, T15–T17, T20 | Mapped |
| CAT-04 | P1: Listagem — GET isolado por usuário | P1 | T4, T6–T8, T18–T19, T21–T23 | Mapped |
| CAT-05 | P1: Listagem — empty state + seed presets | P1 | T6, T22 | Mapped |
| CAT-06 | P1: Listagem — toggle arquivadas | P1 | T4, T19, T21, T22 | Mapped |
| CAT-07 | P1: Edição — PUT + ownership 404 | P1 | T4, T6–T8, T18, T20 | Mapped |
| CAT-08 | P1: Edição — bloqueio mudança type com vínculos | P1 | T6, T20 | Mapped |
| CAT-09 | P1: Exclusão — DELETE sem vínculos | P1 | T4, T6–T8, T18, T21, T22 | Mapped |
| CAT-10 | P1: Exclusão — 409 + arquivar com vínculos | P1 | T4, T6, T7, T22 | Mapped |
| CAT-11 | P1: Transação — seletor por type + categoryId | P1 | T9–T12, T24, T26–T29 | Mapped |
| CAT-12 | P1: Transação — badge na listagem | P1 | T10–T12, T25, T27, T29 | Mapped |
| CAT-13 | P1: Migration — texto → categoryId | P1 | T2, T3, T9–T11 | Mapped |
| CAT-14 | P2: Filtro transações por categoria | — | — | Deferred |
| CAT-15 | P2: Dashboard — gráfico breakdown | — | — | Deferred |
| CAT-16 | P2: Auto-categorização por palavra-chave | — | — | Deferred |
| CAT-17 | P3: Subcategorias parentId | — | — | Deferred |
| CAT-18 | P3: Orçamento mensal por categoria | — | — | Deferred |
| CAT-19 | P3: Reorder drag-and-drop | — | — | Deferred |

**Coverage:** 19 total, 13 mapped to tasks (P1), 6 deferred (P2/P3) ✅

---

## Success Criteria

- [ ] Usuário cria categoria com ícone e cor em menos de 45 segundos
- [ ] CRUD completo via API com isolamento por usuário (zero vazamento cross-user)
- [ ] Primeiro acesso exibe categorias padrão úteis sem configuração manual
- [ ] Transação salva com ou sem `categoryId`; quando presente, listagem exibe pill com ícone + nome
- [ ] Categorias arquivadas não aparecem em novos cadastros mas preservam histórico
- [ ] `npm run lint` e `npm run build` passam em `api/` e `front/` após implementação P1
- [ ] (P2) Dashboard exibe breakdown do mês por categoria com cores corretas
