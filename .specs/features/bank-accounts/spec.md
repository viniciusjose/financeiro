# Contas Bancárias Specification

## Problem Statement

Hoje o sistema trata todas as transações como um pool único — não há como saber em qual banco ou conta o dinheiro está. Usuários com múltiplas contas (corrente, poupança, carteiras digitais) precisam de um cadastro centralizado para organizar suas finanças e, futuramente, vincular transações e saldos por conta.

## Goals

- [ ] Usuário cadastra e gerencia todas as suas contas bancárias em um único lugar
- [ ] Cada conta identifica claramente a instituição financeira (Itaú, Sofisa, Nubank, Inter ou outra), com **logo do banco** na listagem e no cadastro
- [ ] Dados persistidos com isolamento por usuário (mesmo padrão de `transactions`)
- [ ] Base pronta para vincular transações a contas em feature posterior

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Open Finance / sincronização automática com banco | Complexidade regulatória e integração externa; milestone futuro |
| Importação de extratos (OFX/CSV) | Explicitamente fora do escopo v1 (`PROJECT.md`) |
| Cartão de crédito como entidade separada | Limite, fatura e ciclo de fechamento são domínio distinto; pode virar feature própria |
| Armazenar número completo de conta/agência | Dado sensível; risco de segurança sem benefício claro no MVP |
| Saldo calculado em tempo real a partir de transações | Depende de vincular transações → contas (P2 desta spec ou feature separada) |
| Compartilhamento de contas entre usuários | Fora do escopo v1 |

---

## Modelo de Dados — Campos Úteis

Entidade **`BankAccount`** (conta bancária do usuário). Campos agrupados por propósito:

### Identificação (obrigatórios no MVP)

| Campo | Tipo | Descrição | Exemplo |
| ----- | ---- | --------- | ------- |
| `id` | UUID | Identificador único | `550e8400-e29b-41d4-a716-446655440000` |
| `userId` | UUID (FK) | Dono da conta; cascade delete com `users` | — |
| `name` | string (1–80) | Apelido escolhido pelo usuário | "Conta corrente principal", "Reserva emergência" |
| `bank` | enum | Instituição financeira | `itau`, `sofisa`, `nubank`, `inter`, `other` |
| `bankName` | string? (1–80) | Nome livre quando `bank = other` | "C6 Bank", "BTG Pactual" |
| `type` | enum | Tipo da conta | `checking`, `savings`, `investment`, `wallet` |

**Labels pt-BR sugeridos para UI:**

| Enum `bank` | Label |
| ----------- | ----- |
| `itau` | Itaú |
| `sofisa` | Sofisa |
| `nubank` | Nubank |
| `inter` | Inter |
| `other` | Outro |

**Logos no MVP (decisão D5 — confirmada):**

| Enum `bank` | Asset | Fallback |
| ----------- | ----- | -------- |
| `itau` | Logo Itaú (SVG) | — |
| `sofisa` | Logo Sofisa (SVG) | — |
| `nubank` | Logo Nubank (SVG) | — |
| `inter` | Logo Inter (SVG) | — |
| `other` | — | Ícone genérico (ex.: `Building2` Lucide) + `bankName` como label |

Logos são **estáticos no front-end** (mapeamento `bank` → asset); não persistidos no banco. Tamanho sugerido na UI: 24–32px na listagem, 40–48px no seletor de banco do formulário.

| Enum `type` | Label |
| ----------- | ----- |
| `checking` | Conta corrente |
| `savings` | Poupança |
| `investment` | Investimentos |
| `wallet` | Carteira digital |

### Financeiro (opcional no cadastro, útil para saldo inicial)

| Campo | Tipo | Descrição | Exemplo |
| ----- | ---- | --------- | ------- |
| `initialBalance` | decimal(12,2) | Saldo no momento do cadastro; default `0.00` | `1500.00` |
| `currency` | string | Moeda; fixo `BRL` no MVP | `BRL` |

> **Nota:** `initialBalance` serve como ponto de partida até transações serem vinculadas à conta. Saldo exibido no dashboard por conta = `initialBalance` + Σ transações vinculadas (feature P2).

### Identificação visual (opcional, melhora UX na listagem)

| Campo | Tipo | Descrição | Exemplo |
| ----- | ---- | --------- | ------- |
| `color` | string? (hex) | Cor para badge/card na UI | `#820AD1` (roxo Nubank) |
| `lastFourDigits` | string? (4 chars) | Últimos 4 dígitos da conta; só dígitos | `"1234"` |

### Controle (com defaults sensatos)

| Campo | Tipo | Default | Descrição |
| ----- | ---- | ------- | --------- |
| `isDefault` | boolean | `false` | Conta padrão ao criar transação (quando P2 existir) |
| `isActive` | boolean | `true` | Conta arquivada não aparece em selects; transações existentes permanecem |
| `notes` | text? | — | Observações livres do usuário |
| `createdAt` | timestamp | now() | Auditoria |
| `updatedAt` | timestamp | now() | Auditoria |

### Regras de domínio

1. WHEN `bank != other` THEN `bankName` SHALL ser `null`
2. WHEN `bank = other` THEN `bankName` SHALL ser obrigatório (1–80 chars)
3. WHEN usuário define `isDefault = true` em uma conta THEN sistema SHALL desmarcar `isDefault` nas demais contas do mesmo usuário
4. WHEN usuário tenta excluir conta com transações vinculadas (P2+) THEN sistema SHALL impedir hard delete e oferecer arquivar (`isActive = false`)
5. WHEN usuário não tem contas THEN dashboard/transações SHALL funcionar como hoje (sem conta obrigatória até P2)

### Campos considerados e **não** incluídos no MVP

| Campo | Motivo da exclusão |
| ----- | ------------------ |
| Agência / número completo | Dado sensível; baixo valor sem Open Finance |
| CPF/CNPJ titular | Redundante (usuário já autenticado) |
| Chave PIX | Escopo diferente; pode ser extensão futura |
| Limite de crédito | Domínio de cartão de crédito |
| Taxa/juros | Complexidade desnecessária no cadastro |

---

## User Stories

### P1: Cadastrar conta bancária ⭐ MVP

**User Story**: Como usuário logado, quero cadastrar uma conta bancária informando banco, tipo e um apelido, para organizar minhas finanças por instituição.

**Why P1**: Entidade central da feature; sem cadastro não há contas para gerenciar.

**Acceptance Criteria**:

1. WHEN usuário autenticado acessa a área de contas THEN sistema SHALL exibir listagem (vazia ou com contas) e ação "Nova conta"
2. WHEN usuário submete formulário com `name`, `bank`, `type` válidos THEN sistema SHALL persistir via `POST /api/bank-accounts` associado ao `userId` da sessão
3. WHEN `bank = other` THEN formulário SHALL exigir `bankName`; WHEN `bank != other` THEN `bankName` SHALL ser ignorado/nulo
4. WHEN cadastro é bem-sucedido THEN sistema SHALL exibir toast de sucesso em pt-BR e atualizar a listagem
5. WHEN campos obrigatórios estão inválidos THEN sistema SHALL impedir submit e exibir erros inline (mesmo padrão de auth/transações)
6. WHEN `initialBalance` não informado THEN sistema SHALL persistir `0.00`
7. WHEN usuário escolhe banco no formulário THEN sistema SHALL exibir seletor com **logo + label** para cada opção (`itau`, `sofisa`, `nubank`, `inter`, `other`)

**Independent Test**: Login → Nova conta (Nubank, Carteira digital, "Nubank principal") → conta aparece na listagem com logo Nubank, banco e tipo corretos.

---

### P1: Listar contas bancárias ⭐ MVP

**User Story**: Como usuário logado, quero ver todas as minhas contas cadastradas para ter visão consolidada das instituições que uso.

**Why P1**: Complemento vertical do cadastro; valida isolamento por usuário e leitura.

**Acceptance Criteria**:

1. WHEN usuário autenticado chama `GET /api/bank-accounts` THEN sistema SHALL retornar apenas contas do `userId` da sessão
2. WHEN listagem é exibida THEN cada item SHALL mostrar: **logo do banco**, apelido (`name`), label do banco, label do tipo, saldo inicial formatado BRL (`tabular-money`)
3. WHEN usuário não tem contas THEN sistema SHALL exibir empty state útil com CTA "Cadastrar primeira conta"
4. WHEN conta tem `isActive = false` THEN sistema SHALL exibir indicador "Arquivada" ou filtrar por padrão (ver decisão em aberto abaixo)
5. WHEN conta tem `isDefault = true` THEN sistema SHALL exibir badge "Padrão"

**Independent Test**: Cadastrar 2 contas → listagem mostra ambas com dados corretos; outro usuário não vê contas alheias.

---

### P1: Editar conta bancária ⭐ MVP

**User Story**: Como usuário, quero editar os dados de uma conta para corrigir informações ou atualizar saldo inicial.

**Why P1**: Contas mudam (troca de apelido, saldo inicial ao migrar de planilha).

**Acceptance Criteria**:

1. WHEN usuário edita conta via `PUT /api/bank-accounts/:id` THEN sistema SHALL atualizar apenas se `userId` corresponder ao da sessão
2. WHEN `id` não existe ou pertence a outro usuário THEN sistema SHALL retornar 404
3. WHEN edição é bem-sucedida THEN sistema SHALL atualizar `updatedAt` e refletir na UI
4. WHEN usuário marca conta como padrão THEN sistema SHALL desmarcar as demais (regra de domínio #3)

**Independent Test**: Editar apelido e saldo inicial → listagem reflete alteração; 404 ao editar ID de outro usuário.

---

### P1: Excluir ou arquivar conta ⭐ MVP

**User Story**: Como usuário, quero remover ou arquivar contas que não uso mais para manter a listagem limpa.

**Why P1**: CRUD completo; evita lixo acumulado no cadastro.

**Acceptance Criteria**:

1. WHEN usuário solicita exclusão via `DELETE /api/bank-accounts/:id` THEN sistema SHALL remover conta se pertencer ao usuário e não houver transações vinculadas
2. WHEN conta não tem transações vinculadas THEN sistema SHALL pedir confirmação na UI antes de excluir
3. WHEN exclusão é bem-sucedida THEN sistema SHALL remover da listagem e exibir toast em pt-BR
4. WHEN `id` inválido ou de outro usuário THEN sistema SHALL retornar 404

**Independent Test**: Criar conta → excluir com confirmação → some da listagem.

---

### P1: Logos dos bancos ⭐ MVP

**User Story**: Como usuário, quero reconhecer cada banco pelo logo na listagem e ao cadastrar, para identificar contas rapidamente sem ler só o texto.

**Why P1**: Reconhecimento visual é parte central da proposta de organizar por instituição; confirmado pelo product owner para o MVP.

**Acceptance Criteria**:

1. WHEN `bank` é `itau`, `sofisa`, `nubank` ou `inter` THEN UI SHALL renderizar logo SVG correspondente via mapa estático front-end (`bank` → asset)
2. WHEN `bank = other` THEN UI SHALL exibir ícone genérico de instituição financeira e label `bankName` (ou "Outro" se ausente na listagem)
3. WHEN logo é exibido na listagem THEN SHALL ter tamanho consistente (24–32px), `alt` descritivo em pt-BR (ex.: "Logo Nubank") e não distorcer proporção (`object-contain`)
4. WHEN seletor de banco no formulário é renderizado THEN cada opção SHALL mostrar logo + label pt-BR lado a lado
5. WHEN asset de logo falha ao carregar THEN UI SHALL fallback para ícone genérico + label textual (sem quebrar layout)

**Independent Test**: Cadastrar contas Itaú e Nubank → listagem exibe logos distintos; formulário mostra grid/select com logos nos 4 bancos + opção Outro.

---

### P2: Vincular transação a conta

**User Story**: Como usuário, quero associar cada transação a uma conta bancária para saber de qual conta saiu ou entrou o dinheiro.

**Why P2**: Valor real das contas só aparece quando transações referenciam a entidade; depende de migration em `transactions`.

**Acceptance Criteria**:

1. WHEN usuário cria/edita transação THEN formulário SHALL incluir select de conta (contas ativas do usuário)
2. WHEN nenhuma conta cadastrada THEN select SHALL ficar oculto ou desabilitado; transação salva sem `accountId` (nullable)
3. WHEN transação tem `accountId` THEN listagem SHALL exibir nome/apelido da conta
4. WHEN conta é arquivada (`isActive = false`) THEN SHALL continuar visível em transações existentes mas não aparecer em novos cadastros
5. WHEN usuário tenta excluir conta com transações vinculadas THEN sistema SHALL bloquear delete e sugerir arquivar

**Independent Test**: Cadastrar 2 contas → criar despesa vinculada à conta A → listagem mostra conta A; excluir conta A falha.

---

### P2: Saldo por conta no dashboard

**User Story**: Como usuário, quero ver o saldo de cada conta no dashboard para saber quanto tenho em cada banco.

**Why P2**: Responde "quanto tenho?" por instituição — alinhado a `PRODUCT.md` princípio "Números primeiro".

**Acceptance Criteria**:

1. WHEN dashboard carrega THEN sistema SHALL exibir card/lista com saldo por conta ativa: `initialBalance + Σ(income) - Σ(expense)` das transações vinculadas
2. WHEN conta não tem transações THEN saldo exibido SHALL ser `initialBalance`
3. WHEN valores são renderizados THEN SHALL usar `tabular-money` e formatação BRL pt-BR
4. WHEN usuário não tem contas THEN dashboard SHALL manter saldo global atual (comportamento legado)

**Independent Test**: Conta com saldo inicial R$ 100 + receita R$ 50 vinculada → dashboard mostra R$ 150,00 na conta.

---

### P3: Personalização visual (cor e últimos dígitos)

**User Story**: Como usuário com várias contas no mesmo banco, quero diferenciá-las visualmente para reconhecimento rápido.

**Why P3**: Melhora UX quando há múltiplas contas Itaú/Nubank; não bloqueia MVP.

**Acceptance Criteria**:

1. WHEN usuário edita conta THEN formulário SHALL permitir `color` (color picker ou paleta) e `lastFourDigits` (4 dígitos)
2. WHEN `lastFourDigits` informado THEN sistema SHALL validar exatamente 4 caracteres numéricos
3. WHEN listagem renderiza conta com cor THEN SHALL exibir indicador colorido ao lado do nome

**Independent Test**: Definir cor roxa e dígitos "5678" → listagem exibe ambos.

---

## Edge Cases

- WHEN usuário cadastra conta duplicada (mesmo banco + tipo + nome) THEN sistema SHALL permitir (usuário pode ter 2 correntes Nubank) — sem unique constraint composta
- WHEN `initialBalance` é negativo THEN sistema SHALL permitir (conta no vermelho / cheque especial)
- WHEN usuário arquiva conta padrão THEN sistema SHALL remover flag `isDefault` ou promover outra (decisão: remover flag)
- WHEN API retorna erro de rede no front THEN sistema SHALL exibir mensagem recuperável em pt-BR
- WHEN `bankName` contém apenas espaços THEN sistema SHALL rejeitar validação
- WHEN usuário excede limite razoável de contas (ex.: 50) THEN sistema SHALL rejeitar com mensagem clara (proteção anti-abuso)

---

## API Contract (novo)

| Endpoint | Auth | Body / Params | Response `data` |
| -------- | ---- | ------------- | --------------- |
| `GET /api/bank-accounts` | Bearer | Query: `?includeInactive=false` | `{ accounts: BankAccount[] }` |
| `GET /api/bank-accounts/:id` | Bearer | — | `{ account: BankAccount }` |
| `POST /api/bank-accounts` | Bearer | CreateBankAccountBody | `{ account: BankAccount }` |
| `PUT /api/bank-accounts/:id` | Bearer | UpdateBankAccountBody | `{ account: BankAccount }` |
| `DELETE /api/bank-accounts/:id` | Bearer | — | `{ message }` ou 204 |

**BankAccount (response):**

```typescript
{
  id: string;
  name: string;
  bank: "itau" | "sofisa" | "nubank" | "inter" | "other";
  bankName: string | null;
  type: "checking" | "savings" | "investment" | "wallet";
  initialBalance: string; // "1500.00"
  currency: "BRL";
  color: string | null;
  lastFourDigits: string | null;
  isDefault: boolean;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
```

Envelope: `{ success, data?, message? }` — mesmo padrão de `api/src/views/response.ts`.

**Migration P2 (transações):** adicionar `account_id UUID NULL REFERENCES bank_accounts(id) ON DELETE RESTRICT` em `transactions`.

---

## Technical Notes (para implementação)

- Seguir camadas existentes: `bank-account.routes.ts` → controller → service → repository
- Schema Drizzle: `api/src/models/schema/bank-accounts.ts`
- Enums PostgreSQL: `bank_institution`, `bank_account_type`
- Front: rota `/accounts`, service tipado em `front/src/services/bank-accounts.ts`, schema Zod espelhando API
- UI: listagem + dialog/sheet para criar/editar; confirmação em delete (AlertDialog)
- **Logos:** `front/src/assets/banks/*.svg` (ou `front/public/banks/`) + `front/src/lib/bank-logos.ts` com mapa `BankInstitution → { label, src, alt }`; componente reutilizável `BankLogo`
- Logos: preferir SVG monocromático ou marca oficial em fundo neutro; respeitar contraste WCAG no container circular/quadrado da listagem
- Atualizar `PROJECT.md` scope: contas bancárias entram no v1; Open Finance permanece fora

---

## Decisões Confirmadas

| # | Decisão |
| - | ------- |
| D5 | **Logos dos bancos no MVP** — seletor e listagem exibem logo por enum; `other` usa ícone genérico |

## Decisões Confirmadas (continuação)

| # | Decisão |
| - | ------- |
| D1 | **Ocultar arquivadas por padrão** — toggle "Mostrar arquivadas" na listagem |
| D2 | **P1 only nesta entrega** — P2 (vínculo transações + saldo dashboard) na feature seguinte |
| D3 | **Primeira conta vira padrão automaticamente** |
| D4 | **Sem campo `notes` no formulário MVP** — campo existe na API/DB para uso futuro |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Tasks | Status |
| -------------- | ----- | ----- | ----- | ------ |
| ACCT-01 | P1: Cadastro — formulário e validação | P1 | T4, T11, T14 | Mapped |
| ACCT-02 | P1: Cadastro — POST API + persistência | P1 | T1–T2, T5–T7, T12 | Mapped |
| ACCT-03 | P1: Cadastro — regra bank/other + bankName | P1 | T4, T5, T11, T13, T14 | Mapped |
| ACCT-04 | P1: Listagem — GET isolado por usuário | P1 | T3, T6–T7, T12, T16–T18 | Mapped |
| ACCT-05 | P1: Listagem — empty state + formatação BRL | P1 | T15, T17 | Mapped |
| ACCT-06 | P1: Listagem — badge padrão e arquivada | P1 | T15, T17 | Mapped |
| ACCT-07 | P1: Edição — PUT + ownership 404 | P1 | T3, T5–T7, T12, T14 | Mapped |
| ACCT-08 | P1: Edição — regra isDefault exclusivo | P1 | T5, T14 | Mapped |
| ACCT-09 | P1: Exclusão — DELETE + confirmação UI | P1 | T6–T8, T16–T17 | Mapped |
| ACCT-10 | P1: Exclusão — 404 cross-user | P1 | T3, T5, T6 | Mapped |
| ACCT-17 | P1: Logos — mapa estático bank → SVG | P1 | T9, T10 | Mapped |
| ACCT-18 | P1: Logos — seletor formulário logo + label | P1 | T13 | Mapped |
| ACCT-19 | P1: Logos — listagem + fallback other/erro | P1 | T10, T15 | Mapped |
| ACCT-11 | P2: Transação — FK accountId nullable | P2 | — | Deferred |
| ACCT-12 | P2: Transação — select contas ativas | P2 | — | Deferred |
| ACCT-13 | P2: Transação — bloqueio delete com vínculos | P2 | — | Deferred |
| ACCT-14 | P2: Dashboard — saldo por conta | P2 | — | Deferred |
| ACCT-15 | P2: Dashboard — tabular-money BRL | P2 | — | Deferred |
| ACCT-16 | P3: Personalização — color + lastFourDigits | P3 | — | Deferred |

**Coverage:** 19 total, 13 mapped to tasks (P1), 6 deferred (P2/P3) ✅

---

## Success Criteria

- [ ] Usuário cadastra conta em Itaú, Nubank, Inter ou Sofisa em menos de 30 segundos
- [ ] CRUD completo funcional via API com isolamento por usuário (zero vazamento cross-user)
- [ ] Listagem exibe logo, banco, tipo e saldo inicial com legibilidade (`tabular-money`)
- [ ] Seletor de banco no cadastro exibe logos dos 4 bancos + fallback para "Outro"
- [ ] `npm run lint` e `npm run build` passam em `api/` e `front/` após implementação P1
- [ ] (P2) Transações vinculadas refletem saldo por conta no dashboard
