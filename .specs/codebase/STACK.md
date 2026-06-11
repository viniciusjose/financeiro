# Tech Stack

**Analyzed:** 2026-06-10

## Core

- Runtime: Node.js `24.15.0` (`.nvmrc`, `.node-version`, `engines` em root/api/front)
- Language: TypeScript `^6.0.3`
- Package manager: npm workspaces
- Monorepo root: `financeiro/` (`api/`, `front/`)

## Frontend

- UI Framework: React `^19.2.7` + React DOM `^19.2.7`
- Build: Vite `^8.0.16` + `@vitejs/plugin-react` `^6.0.2`
- Styling: Tailwind CSS `^4.3.0` via `@tailwindcss/vite`
- Component library: shadcn/ui (`new-york` style, `components.json`)
- Routing: react-router-dom `^7.17.0`
- State Management: React Context (`ThemeProvider`); sem Redux/Zustand
- Form Handling: react-hook-form `^7.78.0` + `@hookform/resolvers` + Zod `^4.4.3`
- Tables: @tanstack/react-table `^8.21.3`
- Charts: recharts `^3.8.1`
- Icons: lucide-react `^1.17.0`
- Utilities: clsx, tailwind-merge, class-variance-authority

## Backend

- API Style: REST + Fastify `^5.8.5`
- Validation: Zod `^4.4.3` + fastify-type-provider-zod `^6.1.0`
- Database: PostgreSQL via `postgres` `^3.4.9` + Drizzle ORM `^0.45.2`
- Migrations: drizzle-kit `^0.31.10`
- Authentication: @fastify/jwt `^10.1.0` (Bearer token)
- Security plugins: @fastify/helmet, @fastify/cors, @fastify/rate-limit
- Config: dotenv + Zod schema (`api/src/config/env.ts`)
- Build: tsup `^8.5.1`; dev: tsx `^4.22.4`

## Testing

- Unit: _não configurado_
- Integration: _não configurado_
- E2E: _não configurado_

## External Services

- Database: PostgreSQL (local ou Supabase via `DATABASE_URL`)
- _Nenhum outro serviço externo integrado no código_

## Development Tools

- Lint/Format: @biomejs/biome `^2.4.16` (api e front)
- Type checking: `tsc -b` (front build); TypeScript strict no api
- Path aliases: `@/*` → `src/*` (ambos os pacotes)
