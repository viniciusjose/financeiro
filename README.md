# Financeiro

Monorepo de gerenciamento e controle financeiro de gastos pessoais.

## Estrutura

```
financeiro/
├── api/     # Back-end (Fastify + Drizzle + Supabase/Postgres)
└── front/   # Front-end (React + Vite + Shadcn + Tailwind)
```

## Pré-requisitos

- Node.js 24.15.x (recomendado: `24.15.0` — use `.nvmrc` ou `.node-version`)
- PostgreSQL (ou Supabase)

## Instalação

```bash
npm install
```

## Variáveis de ambiente

### API (`api/.env`)

```bash
cp api/.env.example api/.env
```

### Front (`front/.env`)

```bash
cp front/.env.example front/.env
```

## Desenvolvimento

```bash
# Ambos os projetos
npm run dev

# Apenas API
npm run dev:api

# Apenas front-end
npm run dev:front
```

## Build

```bash
npm run build
```

## Lint & Format

```bash
npm run lint
npm run lint:fix
npm run format
```

## Banco de dados

```bash
npm run db:generate   # Gerar migrations
npm run db:migrate    # Aplicar migrations
npm run db:studio     # Drizzle Studio
```

## Arquitetura da API

```
src/
├── config/        # Configurações e variáveis de ambiente
├── controllers/   # Camada HTTP (sem regras de negócio)
├── services/      # Regras de negócio
├── repositories/  # Persistência no banco de dados
├── models/      # Schemas Drizzle
├── routes/        # Definição de rotas
├── plugins/       # Plugins Fastify
├── views/         # Formatação de respostas HTTP
└── types/         # Tipos compartilhados
```

## Arquitetura do Front-end

```
src/
├── components/    # Componentes reutilizáveis
│   ├── ui/        # Shadcn UI
│   └── layout/    # Layout e estrutura
├── pages/         # Páginas da aplicação
├── routes/        # Configuração de rotas
├── hooks/         # Custom hooks
├── lib/           # Utilitários
├── providers/     # Context providers (tema, etc.)
└── schemas/       # Schemas Zod
```
