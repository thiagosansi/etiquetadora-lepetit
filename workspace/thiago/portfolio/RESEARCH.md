# Research: Portfolio de Projetos de IA

## Key Insights

1. **Qualidade sobre quantidade** — 3–6 projetos com profundidade superam 15 superficiais. Cada projeto precisa: problema, demo, resultado mensurável, stack.
2. **Prova de impacto é obrigatória** — visitantes querem métricas reais ("reduced review time by 80%", "10k users in 2 weeks"), não apenas tecnologias.
3. **AI portfolios precisam de transparência** — mostrar limitações, decisões de arquitetura e o "messy middle" diferencia AI builders de código-junkies.
4. **Status badges são muito eficazes** — Live / Beta / Discontinued / Acquired como Marc Lou usa ($102k/mês) geram credibilidade imediata.
5. **ISR é a estratégia ideal para portfólio público** — HTML estático para SEO + revalidação automática quando o dono publica/edita projetos.
6. **Server Components para dados, Client Components para interação** — filtros de tag ficam no cliente, fetch de dados no servidor.
7. **WCAG 2.1 AA é agora fator de ranking no Google** (atualização set/2025) — sites conformes viram +37% tráfego orgânico.
8. **Supabase Storage com custom image loader** — transforma imagens nativamente (resize, WebP), evitando custo com Image Optimization do Next.js sobre domínios externos.
9. **`getUser()` no servidor, nunca `getSession()`** — getSession() não valida JWT, getUser() bate no servidor Supabase. Regra de ouro de segurança.
10. **`revalidatePath()` no Server Action de publicar** — mantém ISR atualizado sem rebuild completo.

## Business & Market Analysis

### Referências de portfólio validadas na comunidade

| Site | O que destaca |
|------|--------------|
| brittanychiang.com | Referência mais citada. Next.js + Tailwind, 3 seções, foco em acessibilidade. |
| levels.io/projects | Pieter Levels. Lista cronológica simples, data + link PH/HN. Funciona. |
| marclou.com | Marc Lou ($102k/mês). Cards com MRR, badges de status por produto. |
| indiepa.ge | "Linktree para empreendedores". Revenue badge verificado, leaderboard. |

### O que torna um AI product portfolio diferente

| Dimensão | Dev portfolio | AI product portfolio |
|----------|--------------|---------------------|
| Foco | Qualidade de código | Systems thinking + outcomes de negócio |
| Prova | App funcionando | Produto em produção com métrica mensurável |
| Diferencial | "Construí X com Y" | "Resolvi Z para W, medido por V" |
| Demo | GitHub repo | App ao vivo + GIF de uso real |

### Conteúdo obrigatório por projeto
1. Headline + tagline (problema e público em 1 frase)
2. Demo link + screenshot/GIF
3. Resultado mensurável
4. Stack (tags)
5. Decisões de arquitetura / tradeoffs
6. Status: Live / Beta / Em desenvolvimento / Descontinuado

## Architecture & Backend Patterns

### Estrutura de diretórios (Next.js 15 App Router + feature-based)

```
src/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx          # layout público (SEO base)
│   │   ├── page.tsx            # home (hero + lista projetos)
│   │   └── projects/[slug]/
│   │       ├── page.tsx        # detalhe do projeto (ISR)
│   │       └── opengraph-image.tsx
│   ├── (admin)/
│   │   ├── login/page.tsx
│   │   └── dashboard/
│   │       ├── layout.tsx      # verifyAdminSession (DAL)
│   │       └── projects/
│   │           ├── page.tsx    # listar/editar
│   │           └── new/page.tsx
│   ├── api/revalidate/route.ts
│   └── layout.tsx              # root layout + providers
├── components/
│   ├── ui/                     # Button, Card, Badge, Input (shadcn)
│   ├── layout/                 # Header, Footer
│   └── projects/               # ProjectCard, ProjectGrid, TechBadge
├── lib/
│   ├── supabase/
│   │   ├── server.ts           # createServerClient (SSR)
│   │   ├── client.ts           # createBrowserClient
│   │   ├── middleware.ts       # token refresh
│   │   └── image-loader.ts    # custom loader para Storage
│   ├── dal.ts                  # verifyAdminSession (server-only)
│   └── actions/
│       ├── projects.ts         # CRUD + revalidatePath
│       └── images.ts           # upload/delete Storage
└── types/database.ts           # gerados pelo Supabase CLI
```

### Schema do banco de dados

```sql
projects: id, slug, title, tagline, description, body (markdown),
          cover_image, status (draft|published), featured, built_with[],
          live_url, repo_url, target_audience, objective, sort_order,
          created_at, updated_at

project_images: id, project_id, storage_path, alt_text, sort_order

tags: id, name, slug
project_tags: project_id, tag_id
```

### Estratégia de renderização

| Rota | Estratégia |
|------|-----------|
| `/` | ISR (`revalidate = 3600`) |
| `/projects/[slug]` | ISR + `generateStaticParams` |
| `/(admin)/**` | Dynamic (`force-dynamic`) |

### RLS (Row Level Security)

- `anon`: SELECT somente onde `status = 'published'`
- `authenticated`: SELECT/INSERT/UPDATE/DELETE tudo
- Storage bucket `portfolio`: leitura pública, escrita autenticada

## Implementation Patterns

### Referências open-source
- **dillionverma/portfolio** — Next.js + shadcn/ui + Framer Motion + MDX via content-collections. Config-driven com `src/data/resume.tsx`.
- **techwithanirudh/shadcn-portfolio** — TurboRepo, Next.js 15, Framer Motion, Lenis. Mais completo.
- **svennijhuis/portfolio-supabase-nextjs** — Supabase + Next.js + Framer Motion.

### Animações (Framer Motion)
- Entrada de lista: `staggerChildren` com variants container/item
- Filtro de tag: `AnimatePresence mode="popLayout"` com `layout` prop
- Cards: `whileHover={{ scale: 1.05 }}` com spring physics
- Scroll-triggered: `whileInView` com `viewport={{ once: true }}`
- Bundle: `LazyMotion + domAnimation` para reduzir ~50% do bundle

### Filtragem por tag
- Server Component faz fetch → passa para Client Component `ProjectGrid`
- `useState('All')` no Client Component
- `AnimatePresence` anima entrada/saída dos cards filtrados

### SEO
- `metadata` estático em `layout.tsx` para dados globais
- `generateMetadata` + `React.cache()` para páginas de projeto
- `opengraph-image.tsx` por rota (OG image dinâmica)
- JSON-LD `Person` + `SoftwareApplication` schema

## Pitfalls & Lessons Learned

1. **Não fazer auth check no `layout.tsx`** — layout não re-renderiza a cada navegação. Auth check vai no DAL, chamado dentro dos page components.
2. **CVE-2025-29927**: não depender exclusivamente do middleware para bloqueio de auth. Verificação real no DAL (server-side).
3. **`getUser()` não `getSession()`** no servidor — getSession() lê cookie sem validar JWT.
4. **`priority` apenas na imagem LCP** (hero) — não espalhar em múltiplas imagens.
5. **`sizes` obrigatório com `fill`** — sem sizes, o Next.js não otimiza corretamente.
6. **`AnimatePresence` precisa de `key` explícita** em cada filho — sem key não anima exit.
7. **`revalidatePath` no Server Action** é obrigatório após qualquer escrita para ISR funcionar.

## Autonomous Decisions

**Q1: Supabase vs MDX para conteúdo?**
→ **Supabase.** O usuário já usa Supabase em todos os seus projetos, tem familiaridade, e o painel admin custom é mais flexível para adicionar campos específicos de AI products (target_audience, objective, metrics). MDX seria mais simples mas limitaria campos estruturados e buscas.

**Q2: Auth para admin — email+password vs OAuth?**
→ **Email+password.** Há apenas um admin (o dono). OAuth adicionaria complexidade desnecessária. Supabase Auth com email+password é suficiente e seguro.

**Q3: Hexagonal vs Feature-based?**
→ **Feature-based (Next.js App Router pattern).** Hexagonal cria abstrações desnecessárias para um portfolio single-owner com uma única fonte de dados. Feature-based com colocação é o padrão da comunidade Next.js.

**Q4: Framer Motion vs CSS animations?**
→ **Framer Motion com `LazyMotion`.** A pesquisa mostra adoção massiva nos portfolios de referência. `LazyMotion + domAnimation` mantém bundle pequeno. CSS não suporta `AnimatePresence` (unmount animations).

**Q5: Revenue/métricas públicas?**
→ **Opcional por projeto.** Incluir campo `metrics` (texto livre) no schema. O dono decide o que exibir por projeto. Padrão vazio.

## References

- [Marc Lou Portfolio](https://marclou.com/)
- [Brittany Chiang](https://brittanychiang.com/)
- [Pieter Levels Projects](https://levels.io/projects/)
- [IndiePa.ge](https://indiepa.ge/)
- [Supabase SSR Auth — Next.js guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js Authentication docs](https://nextjs.org/docs/app/guides/authentication)
- [Next.js Metadata & OG Images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [dillionverma/portfolio](https://github.com/dillionverma/portfolio)
- [techwithanirudh/shadcn-portfolio](https://github.com/techwithanirudh/shadcn-portfolio)
- [Supabase Storage Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations)
- [Managing Advanced Filter — Aurora Scharff](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/)
- [Card Scroll Parallax — Olivier Larose](https://blog.olivierlarose.com/tutorials/cards-parallax)
- [dataexpert.io — AI Engineering Portfolios](https://www.dataexpert.io/blog/ultimate-guide-ai-engineering-portfolios)
