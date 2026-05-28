━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BROWSER QA REPORT — 2026-05-28
Application: http://localhost:3001
Pages navigated: 7
Elements tested: ~35
Status: PASS (with MINORs)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BLOCKERS (0): none

MAJORS (0): none

MINORS (2):
  /login | error message | Error text "Invalid login credentials" shown in English — UI is in Portuguese
  /projects/[slug] | links section | "Ver demo" and "Ver código" buttons not shown for seeded projects (live_url/repo_url are null in seed data — not a code bug, but seed coverage gap)

OK: ~33 elements without issues
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Full Results by Page

### / (Home)
- Hero section: PASS — title, tagline, GitHub and LinkedIn links visible
- Tag filter chips: PASS — all 8 chips visible (Todos, Next.js, OpenAI, React, Supabase, Tailwind CSS, Twilio, TypeScript, Vite)
- Project cards: PASS — 3 cards visible (Fila de Atendimento NeoEnergia, Etiquetadora, MatchCV)
- Card navigation: PASS — clicking card navigates to /projects/[slug] (requires scroll into view)
- Tag filter Next.js: PASS — correctly shows only MatchCV when filtered
- Theme toggle: PASS — dark/light mode switching works correctly
- Mobile (375px): PASS — responsive layout, single column cards, no overflow
- JS console errors: PASS — none found
- Network errors: PASS — none found

### /projects/fila-atendimento-neoenergia
- Title: PASS — "Fila de Atendimento NeoEnergia" visible
- Tagline: PASS — description visible
- Stack badges: PASS — React, TypeScript, Supabase, Tailwind CSS, Twilio, Vite
- "Público-alvo" section: PASS — rendered
- "Objetivo" section: PASS — rendered
- "Ver demo" / "Ver código" links: MINOR — not shown (seed data has no URLs)
- Back to projects link: PASS — functional

### /login
- Email field: PASS — visible, required, validates on empty submit
- Password field: PASS — visible, required
- Submit button: PASS — visible, submits form
- Empty form validation: PASS — native HTML5 "Preencha este campo." tooltip
- Invalid credentials: MINOR — error "Invalid login credentials" shown in English (Supabase raw error)
- Auth redirect: PASS — accessing /dashboard without login redirects to /login

### /dashboard
- Stats cards: PASS — Total=3, Publicados=3, Rascunhos=0 correct
- "+ Novo projeto" button: PASS — visible and functional
- "Gerenciar todos os projetos" link: PASS — visible

### /dashboard/projects
- Table: PASS — 3 seeded projects shown with correct data
- Status toggle + badge: PASS — all showing "Publicado" with active toggle
- Created date: PASS — 28/05/2026 displayed
- Edit button: PASS — navigates to /dashboard/projects/[id]/edit
- Delete button: PASS — opens confirmation dialog with project name
- Confirmation dialog: PASS — "Esta ação não pode ser desfeita. O projeto X será removido permanentemente."
- Cancel from dialog: PASS — dismisses without deleting

### /dashboard/projects/new
- Title: PASS — "Novo projeto" heading
- Required fields: PASS — Título*, Slug* marked
- All fields visible: PASS — Tagline, Descrição (Markdown), Público-alvo, Objetivo, Métricas/Impacto, URL demo, URL repositório, Stack, Status dropdown, Ordem, Destaque checkbox
- Buttons: PASS — "Criar projeto" and "Cancelar" visible

### /dashboard/projects/[id]/edit
- Pre-filled data: PASS — all saved fields populated correctly
- All form fields: PASS — same structure as new project form
