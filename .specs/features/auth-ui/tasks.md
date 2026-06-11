# Autenticação (UI) Tasks

**Spec**: `.specs/features/auth-ui/spec.md`
**Design**: Inline — `front/DESIGN.md`, `front/PRODUCT.md` (sem `design.md` formal)
**Status**: Done

---

## Execution Plan

### Phase 1: Foundation (Parallel → Sequential)

Schemas, storage e API client — base para sessão.

```
T1 ──┐
T2 ──┼──→ T3
T6 ──────────────→ T7
```

### Phase 2: Auth Core (Sequential)

Provider e guards de rota.

```
T3 ──→ T4 ──→ T5
```

### Phase 3: Pages (Parallel)

Login e cadastro em paralelo; placeholder home em sequência com provider.

```
T1,T4,T7 ──┬──→ T8 [P]
           └──→ T9 [P]
T4 ──→ T10
```

### Phase 4: Integration (Sequential)

Rotas e wiring final.

```
T5,T8,T9,T10 ──→ T11
```

---

## Task Breakdown

### T1: Create auth Zod schemas ✅

**What**: Schemas Zod de login e registro espelhando regras da API
**Where**: `front/src/schemas/auth.schema.ts`
**Depends on**: None
**Reuses**: `api/src/routes/schemas/auth.schema.ts` (regras de validação)
**Requirements**: AUTH-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `loginSchema` e `registerSchema` exportados com mensagens pt-BR
- [x] Regras: email válido; nome ≥ 2; senha ≥ 8 (register); senha obrigatória (login)
- [x] Tipos inferidos exportados (`LoginInput`, `RegisterInput`)
- [x] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T2: Create token storage utility ✅

**What**: Funções `getToken`, `setToken`, `removeToken` centralizadas
**Where**: `front/src/lib/auth-storage.ts`
**Depends on**: None
**Requirements**: AUTH-02, AUTH-13

**Done when**:

- [x] Constante `TOKEN_KEY` exportada
- [x] Três funções puras para read/write/remove do token
- [x] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T3: Add typed auth methods to ApiClient ✅

**What**: Métodos `register`, `login`, `me` tipados no cliente HTTP
**Where**: `front/src/lib/api.ts`
**Depends on**: T2
**Requirements**: AUTH-02, AUTH-07, AUTH-11

**Done when**:

- [x] `register()` chama `POST /api/auth/register`, persiste token via `setToken`
- [x] `login()` chama `POST /api/auth/login`, persiste token
- [x] `me()` chama `GET /api/auth/me` com Bearer
- [x] `getToken()` interno usa `auth-storage` (não `localStorage` direto)
- [x] Tipos de request/response exportados
- [x] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T4: Create AuthProvider and useAuth hook ✅

**What**: Context de autenticação com bootstrap via `/auth/me`, logout e loading state
**Where**: `front/src/providers/auth-provider.tsx`
**Depends on**: T2, T3
**Requirements**: AUTH-10, AUTH-11, AUTH-12, AUTH-16

**Done when**:

- [x] `AuthProvider` expõe: `user`, `isAuthenticated`, `isLoading`, `login`, `register`, `logout`, `refreshSession`
- [x] WHEN app monta com token THEN chama `me()` antes de `isLoading = false`
- [x] WHEN `me()` retorna 401 THEN `removeToken()` e `user = null`
- [x] WHEN API indisponível THEN estado de erro recuperável exposto (`sessionError` + `SessionRecovery`)
- [x] `useAuth()` lança se usado fora do provider
- [x] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T5: Create route guards (ProtectedRoute + GuestRoute) ✅

**What**: Wrappers que redirecionam conforme estado de auth
**Where**: `front/src/components/auth/protected-route.tsx`, `front/src/components/auth/guest-route.tsx`
**Depends on**: T4
**Requirements**: AUTH-09, AUTH-10

**Done when**:

- [x] `ProtectedRoute`: sem auth → `/login?redirect={pathname}`; com auth → children
- [x] `ProtectedRoute`: enquanto `isLoading` → spinner/skeleton (AUTH-16)
- [x] `GuestRoute`: autenticado → redirect `/` (ou `redirect` query se seguro)
- [x] `GuestRoute`: preserva query `redirect` ao redirecionar
- [x] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T6: Create GradientMesh component ✅

**What**: Backdrop gradient mesh no terço superior (auth heroes)
**Where**: `front/src/components/layout/gradient-mesh.tsx`
**Depends on**: None
**Requirements**: AUTH-14

**Done when**:

- [x] Mesh ocupa ~33vh no topo, edge-to-edge
- [x] `prefers-reduced-motion`: sem animação decorativa (estático)
- [x] Implementação estática (CSS blobs)
- [x] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T7: Create AuthLayout component ✅

**What**: Layout centralizado com mesh, card e slot para formulário
**Where**: `front/src/components/layout/auth-layout.tsx`
**Depends on**: T6
**Requirements**: AUTH-14, AUTH-15

**Done when**:

- [x] Card `rounded-lg` centralizado sobre canvas branco
- [x] Props: `title`, `children`, `footerLink` (texto + href com `redirect` preservado)
- [x] Mobile: coluna única, touch targets ≥ 44px nos links
- [x] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T8: Create LoginPage ✅

**What**: Página de login com formulário react-hook-form + Zod
**Where**: `front/src/pages/login-page.tsx`
**Depends on**: T1, T4, T7
**Requirements**: AUTH-06, AUTH-07, AUTH-08, AUTH-15

**Done when**:

- [x] Formulário e-mail + senha com validação Zod
- [x] Submit chama `login()` do context; redirect para `redirect` query ou `/`
- [x] Erros API exibidos em pt-BR; botão desabilitado durante request
- [x] Link "Criar conta" → `/register` preservando `redirect`
- [x] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T9: Create RegisterPage ✅

**What**: Página de cadastro com formulário react-hook-form + Zod
**Where**: `front/src/pages/register-page.tsx`
**Depends on**: T1, T4, T7
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05

**Done when**:

- [x] Formulário e-mail, nome, senha com validação Zod
- [x] Submit chama `register()`; redirect para `redirect` query ou `/`
- [x] Erros API em pt-BR; campos preservados exceto senha
- [x] Link "Já tenho conta" → `/login` preservando `redirect`
- [x] Botão desabilitado durante request
- [x] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T10: Create HomePage placeholder with logout ✅

**What**: Página protegida mínima com saudação e botão logout
**Where**: `front/src/pages/home-page.tsx`
**Depends on**: T4
**Requirements**: AUTH-13

**Done when**:

- [x] Exibe nome/e-mail do usuário autenticado
- [x] Botão logout chama `logout()` e navega para `/login`
- [x] Placeholder até feature Dashboard
- [x] Gate check passes: `npm run lint -w front`

**Tests**: none
**Gate**: quick

---

### T11: Wire routes and App providers ✅

**What**: Registrar rotas, guards e `AuthProvider` no app
**Where**: `front/src/routes/index.tsx`, `front/src/App.tsx`
**Depends on**: T5, T8, T9, T10
**Requirements**: AUTH-03, AUTH-10, AUTH-16

**Done when**:

- [x] Rotas: `/login` (GuestRoute), `/register` (GuestRoute), `/` (ProtectedRoute → HomePage)
- [x] `App.tsx` envolve `RouterProvider` com `AuthProvider` + `SessionRecovery`
- [x] Loading global durante bootstrap de sessão (sem flash de conteúdo protegido)
- [x] Gate check passes: `npm run lint -w front && npm run build -w front`

**Tests**: none
**Gate**: build

---

## Requirement Traceability

| Requirement ID | Task(s) | Status |
| -------------- | ------- | ------ |
| AUTH-01 | T9 | Verified |
| AUTH-02 | T2, T3, T9 | Verified |
| AUTH-03 | T9, T11 | Verified |
| AUTH-04 | T9 | Verified |
| AUTH-05 | T1, T8, T9 | Verified |
| AUTH-06 | T8 | Verified |
| AUTH-07 | T3, T8 | Verified |
| AUTH-08 | T8 | Verified |
| AUTH-09 | T5, T8 | Verified |
| AUTH-10 | T4, T5, T11 | Verified |
| AUTH-11 | T3, T4 | Verified |
| AUTH-12 | T4 | Verified |
| AUTH-13 | T2, T10 | Verified |
| AUTH-14 | T6, T7 | Verified |
| AUTH-15 | T7, T8, T9 | Verified |
| AUTH-16 | T4, T5, T11 | Verified |

**Coverage:** 16 total, 16 mapped, 16 verified ✅
