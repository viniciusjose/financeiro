# Cartões de Crédito Specification

## Problem Statement

Usuários que controlam finanças pessoais costumam ter um ou mais cartões de crédito, cada um com ciclo próprio (fechamento e vencimento) e débito automático em uma conta bancária específica. Hoje o sistema não representa cartões — impossível saber qual cartão gerou um gasto, quando a fatura fecha ou de qual conta o pagamento sai. Um cadastro centralizado de cartões, vinculado à conta de pagamento, é a base para controle de faturas e despesas no cartão em features futuras.

## Goals

- [ ] Usuário cadastra e gerencia cartões de crédito com identificação clara (descrição, últimos 4 dígitos, bandeira)
- [ ] Cada cartão vincula à conta bancária onde a fatura será paga (FK `bankAccountId`)
- [ ] Ciclo do cartão registrado com dia de fechamento e dia de vencimento (1–31)
- [ ] Dados persistidos com isolamento por usuário (mesmo padrão de `bank_accounts`)
- [ ] Base pronta para vincular transações e faturas em feature posterior

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Número completo do cartão, CVV, validade | Dado sensível (PCI); sem benefício claro no MVP |
| Limite de crédito e saldo disponível | Complexidade de domínio; pode entrar em P2/P3 |
| Fatura, parcelas e lançamentos no cartão | Domínio de transações/faturas; feature separada |
| Pagamento automático de fatura | Integração bancária; fora do escopo v1 |
| Múltiplos titulares / cartões adicionais | Escopo pessoal; um titular por cartão cadastrado |
| Open Finance / sincronização com emissor | Milestone futuro |
| Alertas de vencimento e push | Orçamentos/alertas fora do escopo v1 (`PROJECT.md`) |

---

## Modelo de Dados — Campos Úteis

Entidade **`CreditCard`** (cartão de crédito do usuário).

### Identificação (obrigatórios no MVP)

| Campo | Tipo | Descrição | Exemplo |
| ----- | ---- | --------- | ------- |
| `id` | UUID | Identificador único | `550e8400-e29b-41d4-a716-446655440000` |
| `userId` | UUID (FK) | Dono do cartão; cascade delete com `users` | — |
| `name` | string (1–80) | Descrição/apelido escolhido pelo usuário | "Nubank Ultravioleta", "Itaú Click" |
| `lastFourDigits` | string (4 chars) | Últimos 4 dígitos; somente dígitos | `"4521"` |
| `brand` | enum | Bandeira do cartão | `visa`, `mastercard`, `elo`, `amex`, `hipercard`, `diners`, `other` |
| `brandName` | string? (1–80) | Nome livre quando `brand = other` | "Cabal" |

**Labels pt-BR sugeridos para UI (`brand`):**

| Enum `brand` | Label |
| ------------ | ----- |
| `visa` | Visa |
| `mastercard` | Mastercard |
| `elo` | Elo |
| `amex` | American Express |
| `hipercard` | Hipercard |
| `diners` | Diners Club |
| `other` | Outra |

### Ciclo e pagamento (obrigatórios no MVP)

| Campo | Tipo | Descrição | Exemplo |
| ----- | ---- | --------- | ------- |
| `closingDay` | integer (1–31) | Dia do mês em que a fatura fecha | `3` |
| `dueDay` | integer (1–31) | Dia do mês em que a fatura vence | `10` |
| `bankAccountId` | UUID (FK) | Conta bancária de onde a fatura é paga | FK → `bank_accounts.id` |

> **Nota sobre ciclo:** Apenas o **dia** é armazenado (não mês/ano). Quando `dueDay < closingDay` (ex.: fecha dia 25, vence dia 5), o vencimento é interpretado como **mês seguinte** ao fechamento — regra de domínio para features P2 (fatura), não bloqueia o cadastro no MVP.

### Controle (com defaults sensatos)

| Campo | Tipo | Default | Descrição |
| ----- | ---- | ------- | --------- |
| `isActive` | boolean | `true` | Cartão arquivado não aparece em selects; dados históricos permanecem |
| `color` | string? (hex) | — | Cor opcional para badge na UI (P3) |
| `notes` | text? | — | Observações livres; não exposto no formulário MVP |
| `createdAt` | timestamp | now() | Auditoria |
| `updatedAt` | timestamp | now() | Auditoria |

### Regras de domínio

1. WHEN `brand != other` THEN `brandName` SHALL ser `null`
2. WHEN `brand = other` THEN `brandName` SHALL ser obrigatório (1–80 chars)
3. WHEN `lastFourDigits` informado THEN sistema SHALL validar exatamente 4 caracteres numéricos (`/^\d{4}$/`)
4. WHEN `closingDay` ou `dueDay` informados THEN sistema SHALL validar inteiro entre 1 e 31
5. WHEN `bankAccountId` informado THEN conta SHALL pertencer ao mesmo `userId` e estar ativa (`isActive = true`)
6. WHEN usuário não tem contas bancárias cadastradas THEN sistema SHALL impedir cadastro de cartão e orientar a criar conta primeiro
7. WHEN usuário tenta excluir cartão com transações vinculadas (P2+) THEN sistema SHALL impedir hard delete e oferecer arquivar (`isActive = false`)
8. WHEN usuário tenta excluir conta bancária com cartões vinculados THEN sistema SHALL impedir delete e sugerir arquivar conta ou reassignar cartões

### Campos considerados e **não** incluídos no MVP

| Campo | Motivo da exclusão |
| ----- | ------------------ |
| Limite total / limite disponível | Feature P2; não solicitado no escopo inicial |
| Data de validade (MM/AA) | Dado sensível; baixo valor sem gestão de fatura |
| Titular do cartão | Redundante (usuário autenticado) |
| Bandeira derivada do BIN | Complexidade; usuário informa bandeira manualmente |
| Anuidade / cashback | Escopo de produto financeiro avançado |

---

## User Stories

### P1: Cadastrar cartão de crédito ⭐ MVP

**User Story**: Como usuário logado, quero cadastrar um cartão informando descrição, últimos 4 dígitos, bandeira, dias de fechamento/vencimento e conta de pagamento, para organizar meus cartões e saber de onde sai o débito da fatura.

**Why P1**: Entidade central da feature; sem cadastro não há cartões para gerenciar.

**Acceptance Criteria**:

1. WHEN usuário autenticado acessa a área de cartões THEN sistema SHALL exibir listagem (vazia ou com cartões) e ação "Novo cartão"
2. WHEN usuário submete formulário com `name`, `lastFourDigits`, `brand`, `closingDay`, `dueDay`, `bankAccountId` válidos THEN sistema SHALL persistir via `POST /api/credit-cards` associado ao `userId` da sessão
3. WHEN `brand = other` THEN formulário SHALL exigir `brandName`; WHEN `brand != other` THEN `brandName` SHALL ser ignorado/nulo
4. WHEN `lastFourDigits` inválido (≠ 4 dígitos) THEN sistema SHALL impedir submit e exibir erro inline
5. WHEN `bankAccountId` não pertence ao usuário ou conta está inativa THEN sistema SHALL retornar 400/404 com mensagem em pt-BR
6. WHEN usuário não tem contas bancárias ativas THEN sistema SHALL exibir empty state com CTA "Cadastrar conta" (link `/accounts`) e desabilitar criação de cartão
7. WHEN cadastro é bem-sucedido THEN sistema SHALL exibir toast de sucesso em pt-BR e atualizar a listagem
8. WHEN seletor de bandeira é renderizado THEN cada opção SHALL exibir ícone/logo da bandeira + label pt-BR

**Independent Test**: Login → ter conta Nubank cadastrada → Novo cartão ("Nubank Ultravioleta", 4521, Visa, fecha 3, vence 10, conta Nubank) → cartão aparece na listagem com dados corretos.

---

### P1: Listar cartões de crédito ⭐ MVP

**User Story**: Como usuário logado, quero ver todos os meus cartões cadastrados com identificação rápida (bandeira, dígitos, ciclo) e conta de pagamento.

**Why P1**: Complemento vertical do cadastro; valida isolamento por usuário e leitura.

**Acceptance Criteria**:

1. WHEN usuário autenticado chama `GET /api/credit-cards` THEN sistema SHALL retornar apenas cartões do `userId` da sessão
2. WHEN listagem é exibida THEN cada item SHALL mostrar: bandeira (logo/ícone), descrição (`name`), máscara `•••• {lastFourDigits}`, dias de fechamento e vencimento formatados (ex.: "Fecha dia 3 · Vence dia 10"), nome da conta bancária vinculada
3. WHEN usuário não tem cartões THEN sistema SHALL exibir empty state útil com CTA "Cadastrar primeiro cartão"
4. WHEN cartão tem `isActive = false` THEN sistema SHALL ocultar por padrão com toggle "Mostrar arquivados" (mesmo padrão de contas — decisão D1)
5. WHEN resposta inclui `bankAccountId` THEN API SHALL incluir dados resumidos da conta (`accountName`, `bank`, `bankName`) via join ou campo aninhado

**Independent Test**: Cadastrar 2 cartões → listagem mostra ambos; outro usuário não vê cartões alheios.

---

### P1: Editar cartão de crédito ⭐ MVP

**User Story**: Como usuário, quero editar os dados de um cartão para corrigir ciclo, conta de pagamento ou descrição.

**Why P1**: Cartões mudam (troca de conta de débito, reemissão com novos dígitos).

**Acceptance Criteria**:

1. WHEN usuário edita cartão via `PUT /api/credit-cards/:id` THEN sistema SHALL atualizar apenas se `userId` corresponder ao da sessão
2. WHEN `id` não existe ou pertence a outro usuário THEN sistema SHALL retornar 404
3. WHEN edição altera `bankAccountId` THEN sistema SHALL validar ownership e conta ativa (regra #5)
4. WHEN edição é bem-sucedida THEN sistema SHALL atualizar `updatedAt` e refletir na UI

**Independent Test**: Editar dia de vencimento e conta vinculada → listagem reflete alteração; 404 ao editar ID de outro usuário.

---

### P1: Excluir ou arquivar cartão ⭐ MVP

**User Story**: Como usuário, quero remover ou arquivar cartões que não uso mais para manter a listagem limpa.

**Why P1**: CRUD completo; evita lixo acumulado no cadastro.

**Acceptance Criteria**:

1. WHEN usuário solicita exclusão via `DELETE /api/credit-cards/:id` THEN sistema SHALL remover cartão se pertencer ao usuário e não houver transações vinculadas (P2)
2. WHEN exclusão é solicitada na UI THEN sistema SHALL pedir confirmação (AlertDialog) antes de excluir
3. WHEN exclusão é bem-sucedida THEN sistema SHALL remover da listagem e exibir toast em pt-BR
4. WHEN `id` inválido ou de outro usuário THEN sistema SHALL retornar 404
5. WHEN usuário arquiva cartão (`isActive = false` via PUT) THEN cartão SHALL sumir da listagem padrão mas permanecer recuperável via toggle

**Independent Test**: Criar cartão → excluir com confirmação → some da listagem.

---

### P1: Identificação visual por bandeira ⭐ MVP

**User Story**: Como usuário, quero reconhecer cada cartão pela bandeira na listagem e no cadastro, para identificação rápida sem ler só o texto.

**Why P1**: Bandeira é campo explícito do requisito; reconhecimento visual alinha ao padrão de logos em contas bancárias.

**Acceptance Criteria**:

1. WHEN `brand` é `visa`, `mastercard`, `elo`, `amex`, `hipercard` ou `diners` THEN UI SHALL renderizar logo/ícone correspondente via mapa estático front-end
2. WHEN `brand = other` THEN UI SHALL exibir ícone genérico de cartão + label `brandName`
3. WHEN bandeira é exibida na listagem THEN SHALL ter tamanho consistente (24–32px), `alt` descritivo em pt-BR e `object-contain`
4. WHEN seletor de bandeira no formulário é renderizado THEN cada opção SHALL mostrar logo + label pt-BR

**Independent Test**: Cadastrar cartões Visa e Elo → listagem exibe bandeiras distintas; formulário mostra seletor com logos.

---

### P2: Vincular transação a cartão

**User Story**: Como usuário, quero registrar despesas no cartão de crédito associando transações ao cartão, para controle de gastos por fatura.

**Why P2**: Valor real dos cartões só aparece com transações; depende de migration em `transactions` e lógica de ciclo.

**Acceptance Criteria**:

1. WHEN usuário cria despesa THEN formulário SHALL permitir indicar pagamento via cartão (select de cartões ativos)
2. WHEN transação tem `creditCardId` THEN listagem SHALL exibir descrição do cartão e `•••• {lastFourDigits}`
3. WHEN usuário tenta excluir cartão com transações vinculadas THEN sistema SHALL bloquear delete e sugerir arquivar

**Independent Test**: Cadastrar cartão → criar despesa vinculada → listagem mostra cartão; excluir cartão falha.

---

### P2: Resumo de fatura por ciclo

**User Story**: Como usuário, quero ver o total gasto no cartão no ciclo atual (entre fechamento anterior e próximo fechamento) para antecipar o valor da fatura.

**Why P2**: Usa `closingDay`/`dueDay` cadastrados; responde "quanto vai dar a fatura?".

**Acceptance Criteria**:

1. WHEN dashboard ou página de cartões carrega THEN sistema SHALL calcular total de despesas vinculadas ao cartão no ciclo corrente
2. WHEN ciclo cruza virada de mês (`dueDay < closingDay`) THEN cálculo SHALL considerar intervalo correto (fechamento → vencimento no mês seguinte)
3. WHEN valores são renderizados THEN SHALL usar `tabular-money` e formatação BRL pt-BR

**Independent Test**: Cartão fecha dia 3 → despesas entre último dia 3 e hoje somam no resumo.

---

### P3: Limite de crédito e personalização

**User Story**: Como usuário, quero registrar o limite do cartão e uma cor de identificação para controle de utilização.

**Why P3**: Útil mas não bloqueia cadastro básico solicitado.

**Acceptance Criteria**:

1. WHEN usuário edita cartão THEN formulário SHALL permitir `creditLimit` (opcional, centavos) e `color` (hex)
2. WHEN `creditLimit` informado THEN listagem SHALL exibir barra ou percentual utilizado (depende de P2 transações)

**Independent Test**: Definir limite R$ 5.000 → após despesas P2, exibir % utilizado.

---

## Edge Cases

- WHEN usuário cadastra cartões duplicados (mesma descrição + dígitos + conta) THEN sistema SHALL permitir (pode ter 2 cartões Nubank) — sem unique constraint composta
- WHEN `closingDay` ou `dueDay` é 31 e mês não tem 31 dias THEN sistema SHALL aceitar o valor; features P2 interpretam "último dia do mês" ou dia efetivo (decisão D4)
- WHEN conta vinculada é arquivada THEN cartões vinculados SHALL permanecer visíveis na listagem com indicador "Conta arquivada" e edição SHALL exigir nova conta ativa
- WHEN API retorna erro de rede no front THEN sistema SHALL exibir mensagem recuperável em pt-BR
- WHEN `brandName` contém apenas espaços THEN sistema SHALL rejeitar validação
- WHEN usuário excede limite razoável de cartões (ex.: 30) THEN sistema SHALL rejeitar com mensagem clara

---

## API Contract (novo)

| Endpoint | Auth | Body / Params | Response `data` |
| -------- | ---- | ------------- | --------------- |
| `GET /api/credit-cards` | Bearer | Query: `?includeInactive=false` | `{ creditCards: CreditCard[] }` |
| `GET /api/credit-cards/:id` | Bearer | — | `{ creditCard: CreditCard }` |
| `POST /api/credit-cards` | Bearer | CreateCreditCardBody | `{ creditCard: CreditCard }` |
| `PUT /api/credit-cards/:id` | Bearer | UpdateCreditCardBody | `{ creditCard: CreditCard }` |
| `DELETE /api/credit-cards/:id` | Bearer | — | `{ message }` ou 204 |

**CreditCard (response):**

```typescript
{
  id: string;
  name: string;
  lastFourDigits: string;
  brand: "visa" | "mastercard" | "elo" | "amex" | "hipercard" | "diners" | "other";
  brandName: string | null;
  closingDay: number; // 1–31
  dueDay: number; // 1–31
  bankAccountId: string;
  bankAccount: {
    id: string;
    name: string;
    bank: "itau" | "sofisa" | "nubank" | "inter" | "other";
    bankName: string | null;
  };
  isActive: boolean;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**CreateCreditCardBody:**

```typescript
{
  name: string;
  lastFourDigits: string;
  brand: CreditCardBrand;
  brandName?: string; // required when brand = other
  closingDay: number;
  dueDay: number;
  bankAccountId: string;
}
```

Envelope: `{ success, data?, message? }` — mesmo padrão de `api/src/views/response.ts`.

**Migration:** tabela `credit_cards` com FK `bank_account_id → bank_accounts(id) ON DELETE RESTRICT`.

**Migration P2 (transações):** adicionar `credit_card_id UUID NULL REFERENCES credit_cards(id) ON DELETE RESTRICT` em `transactions`.

---

## Technical Notes (para implementação)

- Seguir camadas existentes: `credit-card.routes.ts` → controller → service → repository (espelhar `bank-account.*`)
- Schema Drizzle: `api/src/models/schema/credit-cards.ts`
- Enum PostgreSQL: `credit_card_brand`
- Front: rota `/credit-cards`, item na sidebar, service em `front/src/services/credit-cards.ts`, schema Zod espelhando API
- UI: listagem + dialog para criar/editar; seletor de conta bancária (contas ativas); seletor de bandeira com logos; confirmação em delete (AlertDialog)
- **Logos bandeira:** `front/src/assets/card-brands/*.svg` + `front/src/lib/card-brands.ts` (mapa `CreditCardBrand → { label, src, alt }`); componente `CardBrandLogo`
- Seletor de conta: reutilizar padrão de `BankLogo` + nome da conta; apenas contas `isActive = true`
- Campos `closingDay`/`dueDay`: inputs numéricos ou select 1–31 com labels "Dia X"
- Atualizar `PROJECT.md` scope quando P1 for implementado

---

## Decisões Recomendadas (aguardando confirmação)

Áreas com comportamento não explícito no pedido — defaults alinhados ao padrão de Contas Bancárias:

| # | Área | Recomendação |
| - | ---- | ------------ |
| D1 | **Ocultar arquivados por padrão** | Toggle "Mostrar arquivados" na listagem (igual contas) |
| D2 | **Página dedicada `/credit-cards`** | Item "Cartões" na sidebar; não subseção de Contas |
| D3 | **Conta de pagamento obrigatória** | Sem cartão órfão; empty state direciona a criar conta primeiro |
| D4 | **Dia 31 em meses curtos** | Aceitar 1–31 no cadastro; P2 usa último dia efetivo do mês no cálculo de ciclo |
| D5 | **Logos de bandeira no MVP** | Mapa estático front-end (Visa, Mastercard, Elo, Amex, Hipercard, Diners + other) |
| D6 | **Sem `notes` no formulário MVP** | Campo existe na API/DB para uso futuro |
| D7 | **Qualquer tipo de conta para pagamento** | Corrente, poupança, carteira etc. — usuário escolhe de onde debita |

Se alguma decisão divergir da sua expectativa, ajustamos antes de Tasks/Implement.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| CCARD-01 | P1: Cadastro — formulário e validação | P1 | Verified |
| CCARD-02 | P1: Cadastro — POST API + persistência | P1 | Verified |
| CCARD-03 | P1: Cadastro — regra brand/other + brandName | P1 | Verified |
| CCARD-04 | P1: Cadastro — validação lastFourDigits | P1 | Verified |
| CCARD-05 | P1: Cadastro — FK bankAccountId ownership | P1 | Verified |
| CCARD-06 | P1: Cadastro — bloqueio sem contas bancárias | P1 | Verified |
| CCARD-07 | P1: Listagem — GET isolado por usuário | P1 | Verified |
| CCARD-08 | P1: Listagem — empty state + dados conta vinculada | P1 | Verified |
| CCARD-09 | P1: Listagem — toggle arquivados | P1 | Verified |
| CCARD-10 | P1: Edição — PUT + ownership 404 | P1 | Verified |
| CCARD-11 | P1: Edição — validação conta ativa | P1 | Verified |
| CCARD-12 | P1: Exclusão — DELETE + confirmação UI | P1 | Verified |
| CCARD-13 | P1: Exclusão — arquivar via isActive | P1 | Verified |
| CCARD-14 | P1: Bandeira — logos mapa estático | P1 | Verified |
| CCARD-15 | P1: Bandeira — seletor formulário logo + label | P1 | Verified |
| CCARD-16 | P1: Bandeira — listagem + fallback other | P1 | Verified |
| CCARD-17 | P1: Domínio — bloqueio delete conta com cartões | P1 | Verified |
| CCARD-18 | P2: Transação — FK creditCardId nullable | P2 | Deferred |
| CCARD-19 | P2: Transação — select cartões ativos | P2 | Deferred |
| CCARD-20 | P2: Fatura — resumo ciclo por closingDay | P2 | Deferred |
| CCARD-21 | P3: Limite — creditLimit + cor | P3 | Deferred |

**Coverage:** 21 total, 17 P1 verified, 4 deferred (P2/P3) ✅

---

## Success Criteria

- [ ] Usuário cadastra cartão com conta bancária existente em menos de 45 segundos
- [ ] CRUD completo funcional via API com isolamento por usuário (zero vazamento cross-user)
- [ ] Listagem exibe bandeira, `•••• {dígitos}`, ciclo (fecha/vence) e conta de pagamento
- [ ] Seletor de bandeira exibe logos das bandeiras principais + fallback "Outra"
- [ ] `npm run lint` e `npm run build` passam em `api/` e `front/` após implementação P1
- [ ] (P2) Despesas vinculadas refletem resumo de fatura por ciclo
