# Transações Parceladas e Recorrentes — Design

## Schema

Migration `0009_transaction_series.sql`:
- `series_id` UUID nullable
- `series_kind` enum: `installment` | `recurring`
- `series_index` integer nullable (1-based)
- `series_total` integer nullable
- Index `(series_id, series_index)`

## Domínio (`api/src/lib/transaction-series.ts`)

- `splitInstallmentAmounts(total, N)` — floor + residual na última
- `buildSeriesAmounts(kind, amount, N)` — installment divide; recurring repete
- `addMonths(date, offset)` — calendário local com ajuste de fim de mês
- `buildSeriesDates(start, N)` — N datas mensais consecutivas

## API

### POST `/api/transactions`

```typescript
recurrence?: { kind: "installment" | "recurring"; totalOccurrences: 2..48 }
```

- Sem `recurrence` → 1 transação (retrocompat)
- Com `recurrence` → `createMany` em transação DB atômica
- Response: `Transaction` ou `{ items: Transaction[] }`

### PUT `/api/transactions/:id`

```typescript
applyScope?: "only_this" | "this_and_future"  // default: only_this
```

- `this_and_future` → atualiza `seriesIndex >= atual`; recalcula datas se `date` mudou

### DELETE `/api/transactions/:id?applyScope=...`

- `this_and_future` → remove `seriesIndex >= atual`

## Front-end

### Form (`TransactionFormDialog`)

- Modo: Avulsa | Parcelada | Recorrente (somente criação)
- Campo `recurrenceCount` quando parcelada/recorrente (default 12 para recorrente, 2 para parcelada)
- Label dinâmico: Valor | Valor total | Valor mensal

### `SeriesScopeDialog`

Reutilizado em edição e exclusão quando `seriesId` presente:
- "Somente esta ocorrência"
- "Esta e as futuras"

### `TransactionSeriesBadge`

Exibe `3/12` + label Parcela/Recorrente nas listagens.
