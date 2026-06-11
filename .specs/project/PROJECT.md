# Financeiro

**Vision:** Aplicação pessoal de controle financeiro que centraliza receitas e despesas em um painel confiável, com clareza nos números e mínimo atrito.
**For:** Pessoas físicas no Brasil que querem controlar gastos e receitas pessoais.
**Solves:** Falta de visibilidade sobre saldo, transações e destino do dinheiro — permitindo decisões financeiras mais conscientes.

## Goals

- Registrar e consultar transações (receita/despesa) com resposta em menos de 2 segundos em fluxos comuns
- Exibir saldo e resumo mensal com legibilidade máxima (tipografia tabular, hierarquia clara)
- Manter autenticação segura e dados isolados por usuário

## Tech Stack

**Core:**

- Runtime: Node.js 24.15.x
- Monorepo: npm workspaces (`api/` + `front/`)
- Database: PostgreSQL (local ou Supabase)

**API:**

- Framework: Fastify 5
- ORM: Drizzle ORM + postgres.js
- Validation: Zod + fastify-type-provider-zod
- Auth: @fastify/jwt

**Front-end:**

- Framework: React 19 + Vite 8
- UI: shadcn/ui (new-york) + Tailwind CSS v4
- Routing: React Router 7
- Forms: react-hook-form + Zod

**Key dependencies:** Biome (lint/format), Recharts, TanStack Table, Lucide icons

## Scope

**v1 includes:**

- Autenticação (registro, login, sessão JWT)
- CRUD de transações (receita/despesa, categoria, data, valor)
- Dashboard com saldo e visão do mês
- Listagem e filtros básicos de transações
- Interface pt-BR, formatação BRL, design editorial-premium (ver `front/PRODUCT.md`, `front/DESIGN.md`)

**Explicitly out of scope:**

- Contas bancárias múltiplas / Open Finance
- Orçamentos, metas e alertas automatizados
- Compartilhamento familiar / multi-tenant
- App mobile nativo
- Importação de extratos (OFX/CSV)

## Constraints

- Timeline: projeto pessoal — priorizar MVP funcional antes de polish avançado
- Technical: Node >=24.15.0; API em camadas (routes → controllers → services → repositories); front segue design system documentado
- Resources: monorepo mantido por desenvolvimento solo; sem CI configurado ainda
