# Autenticação (UI) Specification

## Problem Statement

A API de autenticação está funcional, mas o front-end não oferece telas para cadastro, login ou proteção de rotas. Sem isso, o usuário não consegue acessar o produto pelo browser — o MVP UI fica bloqueado.

## Goals

- [ ] Usuário consegue criar conta e fazer login em menos de 60 segundos
- [ ] Rotas autenticadas redirecionam para `/login` quando não há sessão
- [ ] Sessão persiste entre recarregamentos da página (token em `localStorage`)
- [ ] Telas de auth seguem `front/PRODUCT.md` e `front/DESIGN.md` (gradient mesh, pill CTA, pt-BR)

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Recuperação de senha | Não há endpoint na API; milestone futuro |
| Login social (Google, etc.) | Fora do escopo v1 (`PROJECT.md`) |
| "Lembrar-me" / refresh token | Complexidade desnecessária no MVP |
| Alterações de segurança no back-end | Milestone Quality & Hardening (argon2, JWT expiry) |
| App shell completo com nav de produto | Feature separada: Layout & Navegação |
| Dashboard ou transações | Features subsequentes no roadmap |

---

## User Stories

### P1: Cadastro de conta ⭐ MVP

**User Story**: Como pessoa que quer controlar finanças, quero me cadastrar com e-mail, nome e senha para começar a usar o app.

**Why P1**: Sem cadastro não há usuário nem sessão — bloqueia todo o produto.

**Acceptance Criteria**:

1. WHEN o usuário acessa `/register` THEN o sistema SHALL exibir formulário com campos e-mail, nome e senha
2. WHEN o usuário submete dados válidos THEN o sistema SHALL chamar `POST /api/auth/register` e armazenar o token retornado em `localStorage`
3. WHEN o cadastro é bem-sucedido THEN o sistema SHALL redirecionar para `/` (dashboard placeholder até feature Dashboard)
4. WHEN a API retorna erro (ex.: e-mail já cadastrado) THEN o sistema SHALL exibir mensagem em pt-BR sem perder os dados do formulário (exceto senha)
5. WHEN campos estão inválidos localmente (e-mail malformado, nome < 2 chars, senha < 8 chars) THEN o sistema SHALL impedir submit e exibir erros inline alinhados às regras de `api/src/routes/schemas/auth.schema.ts`

**Independent Test**: Acessar `/register`, preencher formulário válido, ver redirect para `/` com token em `localStorage`.

---

### P1: Login ⭐ MVP

**User Story**: Como usuário cadastrado, quero fazer login com e-mail e senha para acessar minha área.

**Why P1**: Fluxo principal de retorno ao produto.

**Acceptance Criteria**:

1. WHEN o usuário acessa `/login` THEN o sistema SHALL exibir formulário com e-mail e senha
2. WHEN credenciais são válidas THEN o sistema SHALL chamar `POST /api/auth/login`, armazenar token e redirecionar para `/`
3. WHEN credenciais são inválidas THEN o sistema SHALL exibir mensagem genérica em pt-BR ("Credenciais inválidas" ou mensagem da API) sem revelar se o e-mail existe
4. WHEN o usuário já está autenticado e acessa `/login` ou `/register` THEN o sistema SHALL redirecionar para `/`
5. WHEN campos estão vazios ou e-mail inválido THEN o sistema SHALL impedir submit e exibir erros inline

**Independent Test**: Com usuário existente, login em `/login` → redirect `/` + token persistido.

---

### P1: Proteção de rotas ⭐ MVP

**User Story**: Como usuário autenticado, quero que minhas páginas privadas não sejam acessíveis sem login.

**Why P1**: Garante isolamento básico no front; pré-requisito para dashboard e transações.

**Acceptance Criteria**:

1. WHEN usuário não autenticado acessa rota protegida (`/`, `/transactions`, etc.) THEN o sistema SHALL redirecionar para `/login` preservando a URL de destino em query `?redirect=`
2. WHEN usuário autenticado acessa rota protegida THEN o sistema SHALL renderizar o conteúdo normalmente
3. WHEN a página carrega com token em `localStorage` THEN o sistema SHALL validar sessão via `GET /api/auth/me` antes de considerar autenticado
4. WHEN `GET /api/auth/me` retorna 401 THEN o sistema SHALL remover token, limpar estado de auth e redirecionar para `/login`
5. WHEN token existe mas API está indisponível THEN o sistema SHALL exibir estado de erro recuperável (mensagem + opção de tentar novamente ou ir para login)

**Independent Test**: Sem token, acessar `/` → redirect `/login`. Com token válido, `/` renderiza.

---

### P1: Logout ⭐ MVP

**User Story**: Como usuário logado, quero sair da conta para proteger meus dados em dispositivos compartilhados.

**Why P1**: Controle básico de sessão; complementa proteção de rotas.

**Acceptance Criteria**:

1. WHEN usuário autenticado aciona logout THEN o sistema SHALL remover token de `localStorage` e limpar estado de auth
2. WHEN logout é concluído THEN o sistema SHALL redirecionar para `/login`
3. WHEN usuário deslogado tenta acessar rota protegida THEN o sistema SHALL exigir novo login

**Independent Test**: Logar, acionar logout, confirmar redirect `/login` e ausência de token.

---

### P2: Layout de autenticação

**User Story**: Como visitante, quero telas de login/cadastro visualmente consistentes com a identidade do produto.

**Why P2**: Primeira impressão; reforça confiança editorial-premium sem bloquear funcionalidade.

**Acceptance Criteria**:

1. WHEN usuário acessa `/login` ou `/register` THEN o sistema SHALL renderizar layout com gradient mesh no terço superior (`DESIGN.md`)
2. WHEN formulário é exibido THEN o sistema SHALL usar card `rounded-lg`, inputs `rounded-sm`, botão primário pill indigo (`#533afd`)
3. WHEN em mobile (< 768px) THEN o sistema SHALL manter touch targets ≥ 44px e formulário legível em uma coluna
4. WHEN usuário prefere `prefers-reduced-motion` THEN o sistema SHALL evitar animações decorativas no mesh

**Independent Test**: Inspecionar `/login` visualmente — mesh, card centralizado, um CTA primário pill.

---

### P2: Navegação entre login e cadastro

**User Story**: Como visitante, quero alternar entre login e cadastro sem perder contexto.

**Why P2**: Fluxo natural para novos e retornantes.

**Acceptance Criteria**:

1. WHEN usuário está em `/login` THEN o sistema SHALL exibir link para `/register` ("Criar conta")
2. WHEN usuário está em `/register` THEN o sistema SHALL exibir link para `/login` ("Já tenho conta")
3. WHEN usuário navega entre telas THEN o sistema SHALL preservar query `redirect` se presente

**Independent Test**: Em `/login?redirect=/transactions`, clicar "Criar conta" → `/register?redirect=/transactions`.

---

### P3: Estado de carregamento na validação de sessão

**User Story**: Como usuário retornando, quero feedback visual enquanto a sessão é verificada.

**Why P3**: Evita flash de redirect ou conteúdo protegido; polish de UX.

**Acceptance Criteria**:

1. WHEN app inicia com token em `localStorage` THEN o sistema SHALL exibir indicador de carregamento até `GET /api/auth/me` resolver
2. WHEN validação conclui THEN o sistema SHALL remover indicador e renderizar rota ou redirect apropriado

**Independent Test**: Com token válido, reload em rota protegida — breve loading, depois conteúdo.

---

## Edge Cases

- WHEN usuário submete formulário duas vezes rapidamente THEN o sistema SHALL desabilitar botão durante request (evitar double-submit)
- WHEN API retorna erro de rede (fetch falha) THEN o sistema SHALL exibir "Não foi possível conectar. Tente novamente." em pt-BR
- WHEN senha no cadastro tem menos de 8 caracteres THEN o sistema SHALL validar antes do request (regra API)
- WHEN redirect após login aponta para rota inexistente THEN o sistema SHALL fallback para `/`
- WHEN token corrompido/inválido no `localStorage` THEN o sistema SHALL limpar e redirecionar para `/login` após 401 em `/auth/me`

---

## API Contract (existente — não alterar nesta feature)

| Endpoint | Body | Response `data` |
| -------- | ---- | --------------- |
| `POST /api/auth/register` | `{ email, name, password }` | `{ user: { id, email, name }, token }` |
| `POST /api/auth/login` | `{ email, password }` | `{ user: { id, email, name }, token }` |
| `GET /api/auth/me` | — (Bearer) | `{ user: { sub, email } }` |

Envelope: `{ success, data?, message? }` — ver `front/src/lib/api.ts`.

---

## Technical Notes (para implementação)

- Reutilizar `api` de `front/src/lib/api.ts`; estender se necessário para auth methods tipados
- Validação front com Zod espelhando `auth.schema.ts`
- Formulários: react-hook-form + `@hookform/resolvers/zod` (já nas dependências)
- Novos artefatos esperados: `pages/LoginPage`, `pages/RegisterPage`, `providers/auth-provider` ou `hooks/use-auth`, `components/layout/AuthLayout`, `components/GradientMesh`, `schemas/auth.schema.ts`
- Rotas: `/login`, `/register` (públicas); `/` e futuras rotas via wrapper `ProtectedRoute`

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| AUTH-01 | P1: Cadastro — formulário | Execute | Pending |
| AUTH-02 | P1: Cadastro — API + token | Execute | Pending |
| AUTH-03 | P1: Cadastro — redirect sucesso | Execute | Pending |
| AUTH-04 | P1: Cadastro — erros API | Execute | Pending |
| AUTH-05 | P1: Cadastro — validação local | Execute | Pending |
| AUTH-06 | P1: Login — formulário | Execute | Pending |
| AUTH-07 | P1: Login — API + redirect | Execute | Pending |
| AUTH-08 | P1: Login — erros | Execute | Pending |
| AUTH-09 | P1: Login — redirect se autenticado | Execute | Pending |
| AUTH-10 | P1: Proteção — redirect sem token | Execute | Pending |
| AUTH-11 | P1: Proteção — validação /auth/me | Execute | Pending |
| AUTH-12 | P1: Proteção — 401 limpa sessão | Execute | Pending |
| AUTH-13 | P1: Logout — limpar + redirect | Execute | Pending |
| AUTH-14 | P2: Layout — gradient mesh + tokens | Execute | Pending |
| AUTH-15 | P2: Nav — links login ↔ register | Execute | Pending |
| AUTH-16 | P3: Loading na validação de sessão | Execute | Pending |

**Coverage:** 16 total, 16 mapped to tasks, 0 unmapped ✅

---

## Success Criteria

- [ ] Fluxo completo: cadastro → dashboard placeholder → logout → login → dashboard em < 2 minutos
- [ ] Rotas protegidas inacessíveis sem token válido
- [ ] Zero regressão em `npm run lint` e `npm run build` no workspace `front`
- [ ] Formulários acessíveis: labels associados, erros anunciáveis, contraste WCAG AA
