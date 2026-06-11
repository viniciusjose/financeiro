# Transações Parceladas e Recorrentes — Specification

## Problem Statement

Usuários precisam registrar compras parceladas e despesas/receitas mensais fixas sem lançar manualmente cada mês. Ao corrigir ou remover um lançamento do grupo, o sistema deve perguntar se a ação vale só para aquela ocorrência ou também para os meses seguintes.

## Goals

- [ ] Criar séries parceladas (valor total dividido) e recorrentes (valor mensal repetido)
- [ ] Pré-criar recorrências de 2–48 meses
- [ ] Edição e exclusão com escopo: somente esta ou esta e futuras
- [ ] Funcionar em todos os entry points via `TransactionFormDialog`

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Geração automática após 48 meses | Sem cron/job |
| Intervalos não mensais | Escopo futuro |
| Alterar tamanho da série após criação | Escopo futuro |
| Edição/exclusão de ocorrências passadas em massa | Confirmado pelo usuário |

## Decisões (discuss)

| ID | Decisão |
| -- | ------- |
| D1 | Parcelada: valor **total** dividido em parcelas iguais |
| D2 | Centavos residuais na **última parcela** |
| D3 | Edição: **Somente esta** ou **Esta e futuras** |
| D4 | Exclusão: mesmas opções de escopo |
| D5 | Recorrente: valor mensal **não dividido** pelo número de meses |

## User Stories & Requirements

### P1: Parcelada — SER-01..SER-06

1. WHEN modo **Parcelada** THEN exibir **Número de parcelas** (2–48) e label **Valor total**
2. WHEN valor total T e N parcelas THEN criar N transações com datas mensais
3. WHEN divisão THEN parcelas 1..N-1 = `floor(T/N)`; última = `T - soma(anteriores)`
4. WHEN cartão THEN todas as parcelas mantêm `creditCardId`
5. WHEN listagem THEN indicador `index/total`

### P1: Recorrente — SER-07..SER-12

1. WHEN modo **Recorrente** THEN exibir **Quantidade de meses** (2–48) e label **Valor mensal**
2. WHEN valor V e M meses THEN criar M transações com valor **V** cada
3. WHEN recorrente THEN **não** dividir V por M
4. WHEN M < 2 ou M > 48 THEN rejeitar
5. WHEN income/expense THEN ambos suportados

### P1: Avulsa — SER-13..SER-15

1. WHEN modo **Avulsa** (default) THEN formulário sem campos de série
2. WHEN submit avulso THEN 1 transação com campos de série `null`
3. WHEN API sem `recurrence` THEN retrocompatível

### P1: Edição com escopo — SER-16..SER-20

1. WHEN editar transação com `seriesId` THEN diálogo de escopo
2. WHEN `only_this` THEN atualizar só a selecionada
3. WHEN `this_and_future` THEN atualizar `seriesIndex >= atual`
4. WHEN `this_and_future` e data alterada THEN recalcular datas mensais a partir da nova base
5. WHEN avulsa THEN sem diálogo de escopo

### P1: Exclusão com escopo — SER-21..SER-25

1. WHEN excluir com `seriesId` THEN diálogo de escopo
2. WHEN `only_this` THEN remover só a selecionada
3. WHEN `this_and_future` THEN remover `seriesIndex >= atual`
4. WHEN avulsa THEN confirmação simples

### P2: Indicadores UI — SER-26..SER-27

1. WHEN série THEN badge `index/total` + label parcela/recorrente em `/transactions` e fatura
2. WHEN valores THEN `tabular-money`

## Requirement Traceability

| ID | Story | Status |
| -- | ----- | ------ |
| SER-01..SER-06 | Parcelada | Pending |
| SER-07..SER-12 | Recorrente | Pending |
| SER-13..SER-15 | Avulsa | Pending |
| SER-16..SER-20 | Edição escopo | Pending |
| SER-21..SER-25 | Exclusão escopo | Pending |
| SER-26..SER-27 | Indicadores UI | Pending |
