# PLAN: Portfolio de Projetos de IA

> Gerado em modo autônomo. Auto-aprovado.

---

## Objetivo

Site público para apresentar projetos construídos com IA. Visitantes veem os projetos sem autenticação. O dono tem um painel admin autenticado para adicionar e editar projetos.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript strict |
| Estilo | Tailwind CSS v4 + shadcn/ui |
| Animações | Framer Motion (LazyMotion) |
| Banco | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + password) |
| Storage | Supabase Storage (imagens) |
| Testes unit | Vitest + React Testing Library |
| E2E | Cypress |
| BDD | Cucumber / Gherkin |
| Package manager | pnpm |

---

## Arquitetura — Next.js App Router

```
src/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx          # Layout público (header + footer)
│   │   ├── page.tsx            # Home: hero + project grid
│   │   └── projects/
│   │       └── [slug]/
│   │           ├── page.tsx    # Detalhe do projeto (ISR)
│   │           └── opengraph-image.tsx
│   ├── (admin)/
│   │   ├── login/
│   │   │   └── page.tsx        # Login form
│   │   └── dashboard/
│   │       ├── layout.tsx      # verifyAdminSession (DAL)
│   │       ├── page.tsx        # Dashboard overview
│   │       └── projects/
│   │           ├── page.tsx    # Lista + gerenciar projetos
│   │           ├── new/
│   │           │   └── page.tsx
│   │           └── [id]/
│   │               └── edit/
│   │                   └── page.tsx
│   └── layout.tsx              # Root layout + providers
├── components/
│   ├── ui/                     # shadcn primitives
│   ├── layout/                 # Header, Footer
│   └── projects/               # ProjectCard, ProjectGrid, TechBadge, StatusBadge
├── lib/
│   ├── supabase/
│   │   ├── server.ts           # createServerClient
│   │   ├── client.ts           # createBrowserClient
│   │   └── image-loader.ts    # custom loader Storage
│   ├── dal.ts                  # verifyAdminSession (server-only)
│   └── actions/
│       ├── auth.ts             # login, logout
│       └── projects.ts         # CRUD + revalidatePath
└── types/
    └── database.ts             # gerado pelo Supabase CLI
```

---

## Schema do Banco de Dados

```sql
-- projects
id, slug (unique), title, tagline, description (markdown),
target_audience, objective, metrics,
cover_image (storage path), built_with (text[]),
status (draft|published), featured, sort_order,
live_url, repo_url, created_at, updated_at

-- project_images
id, project_id → projects, storage_path, alt_text, sort_order

-- tags
id, name, slug

-- project_tags
project_id, tag_id  (PK composta)
```

**RLS:**
- `anon`: SELECT onde `status = 'published'`
- `authenticated`: SELECT/INSERT/UPDATE/DELETE tudo
- Storage bucket `portfolio`: read público, write autenticado

---

## Features

### Feature 1 — Foundation (scaffold + design system)
- Scaffold Next.js 15 + TypeScript + Tailwind v4 + shadcn/ui
- Configuração Supabase clients + middleware
- Header + Footer + root layout
- `next.config.ts` com Supabase image loader
- Dark mode (next-themes)

### Feature 2 — Supabase schema
- Migrações: projects, project_images, tags, project_tags
- RLS policies
- Storage bucket `portfolio`
- Seed com 3 projetos de exemplo

### Feature 3 — Auth admin
- Login page com email + password
- Server Action `login()` + `logout()`
- DAL `verifyAdminSession()`
- Middleware token refresh
- Proteção das rotas `/(admin)/dashboard/**`

### Feature 4 — Home pública (lista de projetos)
- Hero section: foto, nome, tagline pessoal
- ProjectGrid (Server Component → busca projetos publicados)
- ProjectCard: cover, título, tagline, status badge, tech tags
- Filtro por tag (Client Component + AnimatePresence)
- ISR (`revalidate = 3600`)
- generateMetadata + JSON-LD Person schema

### Feature 5 — Detalhe do projeto
- ProjectHeader: title, tagline, status, links (live + repo)
- Seções: descrição markdown, público-alvo, objetivo, métricas
- ImageGallery (screenshots)
- TechBadges (built_with)
- generateMetadata + OpenGraph por projeto
- generateStaticParams + ISR

### Feature 6 — Admin panel (CRUD)
- Dashboard overview (contagem: total, publicados, drafts)
- Lista de projetos: tabela com status toggle, edit, delete
- Formulário de projeto (new + edit): todos os campos
- Upload de imagens para Supabase Storage
- revalidatePath após salvar/publicar/deletar

---

## BDD Scenarios (Gherkin)

```gherkin
Feature: Public Portfolio

  Scenario: Visitor sees published projects on home page
    Given there are 3 published projects and 1 draft
    When a visitor navigates to the home page
    Then they see 3 project cards
    And the draft project is not visible

  Scenario: Visitor filters projects by tag
    Given there are projects tagged "Next.js" and "Python"
    When the visitor clicks the "Python" filter chip
    Then only Python-tagged projects are visible
    And projects animate in/out smoothly

  Scenario: Visitor sees project details
    Given a published project with slug "matchcv"
    When the visitor navigates to "/projects/matchcv"
    Then they see the title, description, target audience, and objective
    And they see the tech stack badges
    And they see links to live demo and repository

Feature: Admin Panel

  Scenario: Admin logs in successfully
    Given the admin navigates to "/admin/login"
    When they enter valid email and password
    Then they are redirected to "/admin/dashboard"

  Scenario: Admin login fails with wrong credentials
    Given the admin navigates to "/admin/login"
    When they enter an invalid password
    Then they see an error message
    And they remain on the login page

  Scenario: Unauthenticated user is redirected from admin
    Given an unauthenticated user
    When they navigate to "/admin/dashboard"
    Then they are redirected to "/admin/login"

  Scenario: Admin creates a new project
    Given the admin is logged in
    When they fill the project form with valid data
    And click "Save"
    Then the project appears in the admin list with status "draft"

  Scenario: Admin publishes a project
    Given the admin has a draft project
    When they toggle the status to "published"
    Then the project becomes visible on the public home page

  Scenario: Admin deletes a project
    Given the admin has a project
    When they click "Delete" and confirm
    Then the project is removed from the list and from the public site
```

---

## Test Plan

### Unit tests (Vitest + RTL)
- `ProjectCard` renders title, tagline, status badge, tech tags
- `ProjectGrid` renders filtered list based on active tag
- `TechBadge` renders technology name correctly
- `StatusBadge` renders correct colors per status
- `dal.ts` `verifyAdminSession` redirects when unauthenticated
- Server Actions `createProject`, `updateProject`, `deleteProject` — happy path + validation errors

### E2E (Cypress)
- Home page loads and shows project cards
- Tag filter shows/hides projects
- Project detail page loads correctly
- Admin login flow (success + failure)
- Admin create project flow
- Admin publish project → verifica visibilidade pública

### BDD (Cucumber)
- Todos os scenarios Gherkin acima

---

## UI Inventory

### `/` — Home
```
Hero:
  - Avatar/foto do autor
  - Nome + tagline pessoal
  - Links sociais (GitHub, LinkedIn, X)

Filtros:
  - Chips de tags (All, + tags dos projetos)
    → ação: setState(activeTag) → anima filtro de cards

ProjectGrid:
  - N ProjectCards

ProjectCard:
  - Cover image (next/image, lazy)
  - StatusBadge (Live / Beta / Em desenvolvimento / Descontinuado)
  - Título
  - Tagline (1 linha)
  - TechBadges (built_with[])
  - Link "Ver projeto" → /projects/[slug]

States: loading (skeleton) | empty (mensagem) | error (toast)
```

### `/projects/[slug]` — Detalhe
```
ProjectHeader:
  - Título
  - Tagline
  - StatusBadge
  - Botão "Ver demo" → live_url (abre em nova aba)
  - Botão "Ver código" → repo_url (abre em nova aba)

Seções:
  - Descrição (markdown renderizado)
  - Público-alvo
  - Objetivo
  - Métricas (se preenchido)
  - Stack (TechBadges)

ImageGallery:
  - Screenshots do projeto (Supabase Storage)
  - Clique abre em lightbox
```

### `/admin/login`
```
Form:
  - Input email
  - Input password
  - Botão "Entrar"
  - Mensagem de erro (se login falhar)
```

### `/admin/dashboard/projects`
```
Header:
  - Título "Projetos"
  - Botão "Novo projeto" → /admin/dashboard/projects/new

Tabela:
  - Colunas: título, status (toggle switch), criado em, ações
  - Toggle status: draft ↔ published (Server Action)
  - Botão "Editar" → /admin/dashboard/projects/[id]/edit
  - Botão "Excluir" → dialog de confirmação → Server Action

States: loading | empty ("Nenhum projeto. Crie o primeiro.") | error
```

### `/admin/dashboard/projects/new` e `…/[id]/edit`
```
Formulário:
  - Título (obrigatório)
  - Slug (auto-gerado a partir do título, editável)
  - Tagline (obrigatório)
  - Descrição (textarea markdown, obrigatório)
  - Público-alvo
  - Objetivo
  - Métricas
  - URL demo
  - URL repositório
  - Stack/tecnologias (input de tags)
  - Upload de cover image
  - Upload de screenshots (múltiplas)
  - Status (draft / published)
  - Featured (checkbox)
  - Ordem de exibição (número)

Ações:
  - Botão "Salvar rascunho" → status=draft
  - Botão "Publicar" → status=published + revalidatePath
  - Botão "Cancelar" → volta para lista
```

---

## Implementation Waves (Agent Teams)

```
Wave 1 (Foundation + Schema)  — pode ser paralelo:
  Agent A: scaffold Next.js + Tailwind + shadcn + layout base
  Agent B: Supabase schema + migrations + RLS + seed

Wave 2 (Auth)  — sequencial (depende de Wave 1):
  Agent: middleware + DAL + login page + Server Actions auth

Wave 3 (Public UI)  — pode ser paralelo com Wave 2 Auth:
  Agent: home page (hero + ProjectGrid + filtros + ISR)
  (depende de Wave 1B schema estar pronto)

Wave 4 (Project Detail)  — sequencial (depende Wave 3):
  Agent: /projects/[slug] + generateStaticParams + SEO + OG

Wave 5 (Admin CRUD)  — sequencial (depende Wave 2 Auth):
  Agent: admin dashboard + form + image upload + Server Actions

Wave 6 (Tests)  — paralelo após Waves 3-5:
  Agent A: unit tests (Vitest + RTL)
  Agent B: E2E Cypress + BDD Cucumber
```

---

## Git Strategy

- Branch: `feature/portfolio-site`
- Commits:
  - `chore: scaffold Next.js 15 + Tailwind + shadcn`
  - `feat(db): Supabase schema + RLS + seed`
  - `feat(auth): admin login + middleware + DAL`
  - `feat(public): home page + project cards + tag filter`
  - `feat(public): project detail page + ISR + SEO`
  - `feat(admin): project CRUD + image upload`
  - `test: unit tests + E2E Cypress + BDD`

---

## Definition of Done

- [ ] Home pública carrega e exibe projetos publicados
- [ ] Filtro por tag anima corretamente
- [ ] Página de detalhe exibe todos os campos do projeto
- [ ] Admin login funciona (success + error)
- [ ] Rota `/admin/dashboard` redireciona para login se não autenticado
- [ ] CRUD completo de projetos no admin
- [ ] Upload de imagens para Supabase Storage
- [ ] Publicar projeto aparece na home (ISR revalidado)
- [ ] generateMetadata correto em todas as páginas públicas
- [ ] ISR configurado (revalidate = 3600)
- [ ] Dark mode funcional
- [ ] Responsive (mobile + tablet + desktop)
- [ ] Vitest: todos os testes passando
- [ ] Cypress: fluxos principais E2E
- [ ] Lighthouse: LCP < 2.5s, CLS < 0.1
- [ ] RLS: anon não vê drafts, authenticated gerencia tudo

---

## Checkpoint

```
phase: planning_complete
plan_md: generated
user_approval: auto-approved (autonomous mode)
next: phase_3_implementation
stack: Next.js 15 + Supabase + Tailwind + shadcn/ui + Framer Motion
directory: workspace/thiago/portfolio/
branch: feature/portfolio-site
waves: 6 (2 parallel opportunities)
```
