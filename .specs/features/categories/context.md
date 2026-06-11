# Categorias Context

**Gathered:** 2026-06-10
**Spec:** `.specs/features/categories/spec.md`
**Status:** Ready for design

---

## Feature Boundary

CRUD de categorias personalizadas (nome, ícone Lucide, cor, descrição opcional, tipo receita/despesa/ambos). Presets automáticos no primeiro acesso. Vínculo `categoryId` em transações com seletor visual. Arquivar quando há transações vinculadas. P1 only nesta entrega — sem gráficos, filtros, auto-categorização ou subcategorias.

---

## Implementation Decisions

### Primeiro contato — presets (D1)

- **Seed silencioso no primeiro `GET /api/categories`** — sem wizard, sem bloqueio no registro
- Usuário abre `/categories` e já vê os 14 presets populados
- Presets são editáveis/excluíveis como qualquer categoria

### Tela de gerenciamento — listagem (D3)

- **Lista única** — todas as categorias juntos, sem tabs nem seções separadas
- Cada item exibe **badge de tipo** (Despesa / Receita / Ambos)
- Layout em **grid de chips coloridos** — visual, compacto, ênfase em ícone + cor + nome
- Toggle "Mostrar arquivadas" (mesmo padrão de contas bancárias)
- Dialog para criar/editar (mesmo padrão de `AccountsPage`)

### Formulário — ícone, cor e descrição

- **Ícone:** dropdown com preview — lista scrollável de ícones Lucide com label pt-BR e preview ao lado de cada opção (não grid no form)
- **Cor:** paleta curada (~12 cores) apenas — sem campo hex manual no MVP
- **Descrição:** colapsada por padrão — link/botão "Adicionar descrição (opcional)" expande textarea
- Preview em tempo real no formulário (ícone + cor aplicados)

### Transação — seletor e exibição (D5)

- **Categoria opcional** — opção explícita "Sem categoria" no seletor; `categoryId` nullable na API
- **Seletor:** grid visual de cards clicáveis (ícone grande + nome + cor de fundo/borda) — abre em popover ou dialog ao criar/editar transação
- Grid filtra por tipo da transação (`expense` → categorias `expense` + `both`; `income` → `income` + `both`)
- **Badge na listagem:** pill colorida com ícone + nome da categoria
- Transações legadas sem `categoryId` exibem estado "Sem categoria" (sem pill)

### Escopo P1 (D2)

- **Vertical slice completo:** CRUD categorias + seletor na transação + migration `category` → `categoryId`
- Rota `/categories` + item na sidebar

### Agent's Discretion

- Ordem dos chips no grid (alfabética vs `sortOrder` — usar `sortOrder` + nome)
- Tamanho exato dos chips e pills (seguir design system: `rounded-lg`, contraste WCAG)
- Empty state na listagem antes do seed completar (skeleton breve)
- Comportamento do grid de transação em mobile (2 colunas vs scroll horizontal)
- Conflito auto-categorização (D4) — adiado para P2; default: match mais longo

---

## Specific References

- Padrão de página espelha **Contas Bancárias** (`accounts-page.tsx`): header + CTA + listagem + dialog + AlertDialog delete
- Design editorial-premium: paleta sem neon; indigo só em CTAs; `tabular-money` onde houver valores
- Ícones Lucide (já no stack) — subset financeiro/pessoal

---

## Deferred Ideas

- Wizard de onboarding de categorias (rejeitado em favor de seed silencioso)
- Tabs Receita/Despesa na listagem (rejeitado em favor de lista única + badge)
- Grid de ícones no formulário (rejeitado em favor de dropdown com preview)
- Campo hex manual para cor (rejeitado no MVP; paleta curada suficiente)
- Categoria obrigatória na transação (rejeitado; opcional com "Sem categoria")
- Combobox com busca no seletor de transação (rejeitado em favor de grid visual)
