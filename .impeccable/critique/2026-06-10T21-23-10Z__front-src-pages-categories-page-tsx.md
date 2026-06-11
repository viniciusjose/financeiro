---
target: /categories
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-06-10T21-23-10Z
slug: front-src-pages-categories-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeletons e toasts funcionam; estado de erro sem ação de retry |
| 2 | Match System / Real World | 3 | Vocabulário pt-BR natural; fluxo arquivar vs excluir faz sentido |
| 3 | User Control and Freedom | 3 | Cancelar, confirmar exclusão e fallback de arquivamento presentes |
| 4 | Consistency and Standards | 2 | Padrão visual e de ações diverge da tela Contas (lista vs grid, botões rotulados vs ícones) |
| 5 | Error Prevention | 3 | Confirmação antes de excluir; validação no formulário; arquivamento quando há transações |
| 6 | Recognition Rather Than Recall | 2 | Ações ocultas no hover (desktop); descrição só em tooltip |
| 7 | Flexibility and Efficiency | 2 | Sem atalhos, bulk edit ou busca na listagem |
| 8 | Aesthetic and Minimalist Design | 3 | Hierarquia clara; grid colorido é funcional mas pode ficar ruidoso com muitas categorias |
| 9 | Error Recovery | 3 | Mensagens legíveis e fluxo de arquivamento; falta retry no erro de carregamento |
| 10 | Help and Documentation | 2 | Empty states úteis; sem explicação inline de tipo "Ambos" ou arquivamento |
| **Total** | | **26/40** | **Acceptable — melhorias significativas antes de sentir-se “pronto”** |

**Cognitive load:** 2 falhas (moderada) — seletor de 12 cores no formulário excede ≤4 opções visíveis; descrição da categoria não aparece no card (só tooltip).

**Emotional journey:** Entrada calma e editorial; vale positivo no empty state com CTA claro; vale negativo ao tentar editar no desktop (ações “sumidas” até hover).

## Anti-Patterns Verdict

**LLM assessment:** Não parece “AI slop” genérico. A tela segue o register product (Inter 300, ink, indigo parcimonioso, pill buttons) e reutiliza padrões do app. O grid de cards coloridos é justificável para categorias com identidade visual — não é o clichê de “icon + heading + text” repetido sem função. O que soa “subtamente off” para quem usa Linear/Notion: ações reveladas só no hover (padrão que ferramentas maduras evitam) e inconsistência com a tela Contas.

**Deterministic scan:** `detect.mjs` retornou **0 findings** em `categories-page.tsx` e `components/categories/`. Nenhum side-stripe, gradient text, ghost-card (border+shadow largo), ou over-rounding detectado.

## Overall Impression

A tela cumpre o job: listar, filtrar, criar e editar categorias com identidade visual. Está alinhada ao tom editorial-premium do produto. A maior oportunidade não é “embelezar” — é **alinhar affordances com Contas** e tornar ações/estados sempre visíveis, especialmente arquivadas e descrições.

## What's Working

1. **Filtro por tipo em segmented control** — três opções claras (Todos / Despesa / Receita), `fieldset` + `legend`, foco visível; empty state filtrado oferece “Ver todas” e “Nova categoria”.
2. **Fluxo destrutivo inteligente** — exclusão com confirmação; quando há transações vinculadas, oferece arquivar em vez de falhar silenciosamente.
3. **Formulário com preview ao vivo** — ícone, cor e nome atualizam o preview antes de salvar; descrição opcional com progressive disclosure (“Adicionar descrição”).

## Priority Issues

### [P1] Ações de editar/excluir ocultas no desktop até hover
- **Why it matters:** Usuários não descobrem como editar sem explorar; teclado/touchpad e tablet sofrem; quebra o princípio “recognition over recall” e o padrão da tela Contas (botões sempre visíveis com label).
- **Fix:** Remover `sm:opacity-0 sm:group-hover:opacity-100`; usar botões ghost com ícone + texto “Editar” / “Excluir”, ou menu `⋯` sempre visível.
- **Suggested command:** `$impeccable polish`

### [P1] Inconsistência de padrão com a tela Contas
- **Why it matters:** Mesma tarefa (CRUD de entidade de configuração) com layouts e affordances diferentes — lista horizontal vs grid de cards; botões rotulados vs ícones — aumenta carga cognitiva ao navegar entre seções.
- **Fix:** Escolher um vocabulário: ou migrar categorias para lista densa (como Contas) mantendo cor/ícone à esquerda, ou documentar por que grid é o padrão e alinhar Contas depois. No mínimo, unificar estilo de ações secundárias.
- **Suggested command:** `$impeccable distill`

### [P2] Categorias arquivadas só com opacidade reduzida
- **Why it matters:** Difícil distinguir arquivada de ativa com paletas claras; Contas usa badge “Arquivada” — inconsistência e risco de confusão ao classificar transações.
- **Fix:** Adicionar badge “Arquivada” no `CategoryChip`, como em `BankAccountListItem`.
- **Suggested command:** `$impeccable clarify`

### [P2] Descrição acessível só via tooltip
- **Why it matters:** Em mobile não há hover; descrição (até 200 chars) fica invisível na listagem; usuário precisa abrir edição para ler.
- **Fix:** Mostrar descrição truncada (1 linha) no card, ou remover tooltip e confiar no texto inline.
- **Suggested command:** `$impeccable layout`

### [P2] Estado de erro sem recuperação
- **Why it matters:** Falha de rede deixa mensagem estática sem “Tentar novamente”; usuário precisa recarregar a página.
- **Fix:** Botão retry chamando `refresh()` do hook; opcionalmente ícone + tom mais acionável.
- **Suggested command:** `$impeccable harden`

## Persona Red Flags

**Alex (Power User):** Editar exige hover no desktop ou abrir card → ícone pequeno; cada criação/edição passa por modal completo (ícone, cor, tipo) sem atalho; sem busca quando há dezenas de categorias.

**Sam (Accessibility-Dependent):** `aria-label` nos botões de ícone está correto; porém ações escondidas no hover não aparecem para quem não usa mouse; descrição só em tooltip não é anunciada de forma previsível no fluxo da listagem; contraste do texto `muted-foreground` (#64748d) sobre fundos tintados claros (`${color}12`) pode ficar abaixo de 4.5:1 em cores pastéis.

**Marina (controle financeiro pontual — persona do produto):** Quer ver rapidamente “o que é cada categoria” ao revisar o mês; sem descrição visível e com ações escondidas, a tela vira vitrine de cores, não vocabulário financeiro legível.

**Casey (Mobile distraído):** CTA “Nova categoria” no topo (fora da thumb zone); ações no card ficam visíveis no mobile (bom), mas filtro + checkbox competem por atenção antes do conteúdo principal.

## Minor Observations

- Seletor de tipo no formulário usa `rounded-md` retangular; filtro da página usa pill segmented — mesma decisão, UI diferente.
- `CategoryChip` força botões `size-8` (32px), abaixo do alvo 44px em mobile (mitigado parcialmente porque só no mobile ficam sempre visíveis).
- 12 swatches de cor no form é denso; agrupar por família ou reduzir paleta inicial ajudaria.
- Título `text-display-md` (26px, weight 300) é consistente com Contas, mas é display tier para uma tela de gestão — aceitável no app, não ideal no register product.

## Questions to Consider

- A grid de cards é o formato definitivo, ou categorias deveriam ser lista densa como contas bancárias?
- Descrição deveria ser first-class na listagem, ou é metadado raro que pode ficar só no formulário?
- Tipo “Ambos” merece explicação inline (“válida para receita e despesa”)?
