# Code Conventions

## Naming Conventions

**Files:**
- API: `kebab-case` com sufixo de papel — `auth.controller.ts`, `transaction.service.ts`, `user.repository.ts`
- Front: `kebab-case` — `theme-provider.tsx`, `button.tsx`
- Schemas de rota: `*.schema.ts` em `routes/schemas/`

Examples: `auth.service.ts`, `transaction.routes.ts`, `response.ts`

**Classes:**
- PascalCase com sufixo — `AuthService`, `TransactionController`, `TransactionRepository`

**Functions/Methods:**
- camelCase — `hashPassword`, `sendSuccess`, `registerRoutes`
- Controller handlers como arrow properties — `register = async (request, reply) => { ... }`

**Variables:**
- camelCase — `existingUser`, `passwordHash`, `perPage`

**Constants:**
- camelCase para instâncias exportadas — `authService`, `transactionRepository`
- UPPER_SNAKE apenas em env schema keys (`JWT_SECRET` via Zod)

## Code Organization

**Import/Dependency Declaration:**
- API: imports externos primeiro, depois `@/` aliases; extensão `.js` nos imports relativos (ESM)
- Front: React/libs externas, depois `@/` aliases

Example (API):
```typescript
import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthService } from "@/services/auth.service.js";
import { sendError, sendSuccess } from "@/views/response.js";
```

**File Structure (API controller):**
1. Imports
2. Class com constructor injection
3. Handler methods (arrow functions)
4. try/catch → `sendSuccess` / `sendError`

**File Structure (API service):**
1. Imports
2. Input interfaces exportadas
3. Class com business methods
4. Private helpers no final

## Type Safety

**Approach:** TypeScript strict; Drizzle `$inferSelect` / `$inferInsert` para modelos; Zod para env e rotas

**Module augmentation:** `api/src/types/fastify.d.ts` estende `@fastify/jwt` com `payload` e `user`

**Gap observado:** Controllers fazem cast manual (`request.body as { ... }`) em vez de usar tipos inferidos do Zod provider — padrão inconsistente com a validação nas rotas

## Error Handling

**Pattern (API):**
- Services lançam `throw new Error("mensagem pt-BR")` para erros de domínio
- Controllers capturam em try/catch, mapeiam para HTTP status via `sendError`
- Mensagens de usuário em português

Example:
```typescript
// service
throw new Error("Transação não encontrada");

// controller
catch (error) {
  const message = error instanceof Error ? error.message : "Erro ao buscar transação";
  return sendError(reply, message, 404);
}
```

**Pattern (Front):**
- `ApiClient.request()` lança `Error` com `body.message` da API

## Comments/Documentation

**Style:** Código majoritariamente autoexplicativo; sem JSDoc extensivo
Comentários reservados para lógica não óbvia (poucos no código atual)

## Formatting & Lint

**Tool:** Biome (`biome check`, `biome format --write`)
**Commands:** `npm run lint`, `npm run lint:fix`, `npm run format` (root propaga para workspaces)

## Language & Locale

- Mensagens de API e erros: pt-BR
- UI planejada: pt-BR com formatação BRL (`front/PRODUCT.md`)

## Front Design Conventions

- shadcn `new-york` style; aliases `@/components`, `@/lib`
- CTA primário: indigo `#533afd`; valores monetários: classe `tabular-money`
- Ver `front/DESIGN.md` e `.cursor/rules/front-design.mdc` para tokens completos
