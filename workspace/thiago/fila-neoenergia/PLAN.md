# PLAN: Sistema de Fila de Atendimento — NEOENERGIA BAHIA FARM 2026

> Plan auto-approved (autonomous mode)

---

## Feature Set

| # | Feature | Tipo | Prioridade |
|---|---|---|---|
| F1 | Foundation (setup, design system, layout tablet) | Infraestrutura | CRÍTICO |
| F2 | Auth — Login de operador via PIN | Auth | CRÍTICO |
| F3 | Cadastro de cliente na fila | Core | CRÍTICO |
| F4 | Painel de gestão da fila (visualizar, controlar, chamar) | Core | CRÍTICO |
| F5 | Transições de status (atendendo, ausente, finalizado) | Core | CRÍTICO |
| F6 | Realtime sync entre tablets | Core | CRÍTICO |
| F7 | SMS automático via Edge Function + Zenvia | Integração | ALTO |
| F8 | SMS manual (botão no painel) | Integração | ALTO |
| F9 | Tela de chamada (CallingDisplay) | UX | MÉDIO |

---

## Architecture

**Pattern:** feature-based (React SPA + Supabase backend)

```
workspace/thiago/fila-neoenergia/
├── src/
│   ├── features/
│   │   ├── auth/              # F2: PIN login, auth store, auth guard
│   │   ├── queue/             # F4/F5/F6: painel, lista, card, realtime
│   │   ├── registration/      # F3: formulário de cadastro
│   │   └── sms/               # F7/F8: envio SMS, status badge
│   ├── shared/
│   │   ├── components/        # TabletLayout, ui/ (shadcn)
│   │   ├── hooks/             # useSupabase, useToast
│   │   ├── lib/               # supabase client, utils
│   │   ├── stores/            # queueStore (Zustand)
│   │   └── types/             # Queue, Entry, Operator types
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql     # queues, queue_entries, operators
│   │   ├── 002_rls.sql        # Row Level Security
│   │   ├── 003_functions.sql  # call_next_in_queue, get_queue_position
│   │   ├── 004_realtime.sql   # notify_queue_change trigger
│   │   └── 005_operators.sql  # seed operadores com PIN
│   └── functions/
│       └── send-sms/
│           └── index.ts       # Edge Function: Zenvia + idempotência
└── .claude/
    ├── architecture.json
    └── capabilities.json
```

---

## BDD Scenarios (Gherkin)

```gherkin
Feature: Cadastro de Cliente na Fila
  Scenario: Registro bem-sucedido
    Given o operador está autenticado
    When preenche nome "João Silva", telefone "71999887766", horário "14:30"
    Then o cliente aparece na fila com status "waiting"
    And recebe posição calculada automaticamente

  Scenario: Telefone inválido
    Given o operador está autenticado
    When preenche telefone "123"
    Then vê erro "Telefone inválido — use DDD + número (ex: 71999887766)"

  Scenario: Campos obrigatórios em branco
    Given o operador está autenticado
    When submete formulário com campos em branco
    Then vê erros de validação nos campos obrigatórios

Feature: Operações de Fila
  Scenario: Chamar próximo cliente
    Given há clientes com status "waiting" na fila
    When o operador clica em "Chamar Próximo"
    Then o primeiro cliente por scheduled_time muda para "in_service"
    And a tela de chamada exibe o nome e número

  Scenario: Dois tablets chamam simultaneamente
    Given dois tablets estão com a mesma fila
    When ambos clicam em "Chamar Próximo" ao mesmo tempo
    Then cada tablet chama um cliente diferente
    And nenhum cliente é chamado duas vezes (SKIP LOCKED)

  Scenario: Marcar cliente como ausente
    Given cliente está com status "in_service"
    When operador clica em "Ausente"
    Then status muda para "absent"

  Scenario: Marcar atendimento como finalizado
    Given cliente está com status "in_service"
    When operador clica em "Finalizar"
    Then status muda para "finished"
    And cliente sai da lista de espera ativa

  Scenario: Retornar cliente ausente para fila
    Given cliente está com status "absent"
    When operador clica em "Retornar à Fila"
    Then status volta para "waiting"

Feature: Notificação SMS
  Scenario: SMS automático ao chamar próximo
    Given cliente A está em atendimento e cliente B é o próximo
    When cliente A é finalizado (trigger de banco)
    Then Edge Function envia SMS para cliente B via Zenvia
    And sms_sent é marcado true para evitar duplicata

  Scenario: SMS manual pelo operador
    Given cliente está com status "waiting"
    When operador clica em "Enviar SMS"
    Then SMS é enviado via Zenvia com mensagem de aviso
    And badge de status exibe "Enviando..." → "Enviado"

  Scenario: Falha no envio de SMS
    Given API Zenvia retorna erro
    When operador tenta enviar SMS
    Then badge exibe "Falhou" em vermelho
    And operador pode tentar novamente

Feature: Sincronização em Tempo Real
  Scenario: Segundo tablet vê atualização imediata
    Given dois tablets estão conectados à mesma fila
    When tablet A chama um cliente
    Then tablet B vê a mudança em menos de 2 segundos
    And a lista de espera está sincronizada
```

---

## Database Schema (aprovado — baseado na pesquisa)

```sql
-- migration 001: schema principal
CREATE TYPE queue_status AS ENUM ('waiting', 'in_service', 'absent', 'finished');

CREATE TABLE operators (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  pin_hash  text NOT NULL
);

CREATE TABLE queues (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  date       date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, date)
);

CREATE TABLE queue_entries (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id       uuid         NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  customer_name  text         NOT NULL,
  phone          text         NOT NULL,
  scheduled_time time         NOT NULL,
  status         queue_status NOT NULL DEFAULT 'waiting',
  called_at      timestamptz,
  served_at      timestamptz,
  finished_at    timestamptz,
  sms_sent       boolean      NOT NULL DEFAULT false,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now(),
  version        integer      NOT NULL DEFAULT 0
);

-- Índices para hot paths
CREATE INDEX idx_qe_next ON queue_entries (queue_id, scheduled_time ASC) WHERE status = 'waiting';
CREATE INDEX idx_qe_sms  ON queue_entries (queue_id) WHERE status = 'waiting' AND sms_sent = false;
```

---

## UI Inventory (Anti-stub: se está aqui, DEVE ser implementado)

### Screen: `/login`
```
Screen: /login — Login do Operador
  Elements:
    - Título "NEOENERGIA — BAHIA FARM 2026"
    - Subtítulo "Atendimento ao Cliente"
    - Input PIN (4 dígitos, type="password", autoFocus)
    - Button "Entrar" h-16 → RPC authenticate_operator(pin)
    - Feedback de erro "PIN inválido"
  States: idle | loading | error
```

### Screen: `/` (Dashboard Principal)
```
Screen: / — Painel do Operador
  Elements:
    - Header: nome do evento + operador logado + Button "Sair"
    - Section "Em Atendimento":
        - Badge de status (verde "Atendendo" | cinza "Aguardando")
        - Número da posição (text-7xl)
        - Nome do cliente (text-2xl)
    - ActionButtons:
        - Button "Chamar Próximo" col-span-2 h-16 bg-blue-600 → RPC call_next_in_queue
        - Button "Finalizar" h-14 bg-gray-200 → update status=finished
        - Button "Ausente" h-14 bg-amber-100 → update status=absent
        - Button "Enviar SMS" h-14 bg-green-100 → send SMS manual
    - Button "Registrar Cliente" h-14 bg-indigo-600 → navigate /register
    - Section "Fila de Espera" (lista rolável):
        - QueueCard por entry com status 'waiting'
        - QueueCard: posição, nome, horário, telefone mascarado, SmsStatusBadge, botão ações
    - Badge contagem: "X aguardando"
  States: loading | empty (fila vazia) | active | error
```

### Screen: `/register` (Cadastro)
```
Screen: /register — Cadastro de Cliente
  Elements:
    - Button "← Voltar" → navigate /
    - Form:
        - Input "Nome completo" (required, text)
        - Input "Telefone" (required, tel, placeholder "71999887766")
        - Input "Horário" (required, time)
    - Button "Confirmar Cadastro" h-16 → INSERT queue_entries
    - Button "Cancelar" h-14 → navigate /
    - Toast de sucesso "Cliente cadastrado na posição X"
  States: idle | submitting | success | error
```

### Screen: `/display` (Tela de Chamada)
```
Screen: /display — Tela de Chamada (CallingDisplay)
  Elements:
    - Fullscreen bg-green-700
    - Label "PRÓXIMO" uppercase tracking-widest
    - Número de chamada (clamp 6rem–16rem, font-black)
    - Nome do cliente (text-4xl)
    - Animação de entrada (Framer Motion AnimatePresence)
  States: idle (sem chamada) | calling (exibindo cliente)
```

---

## Test Plan

### Unit Tests (Vitest)
- `formatPhone(phone): string` — E.164 conversion
- `getQueuePosition(entries, entryId): number` — position calculation
- `queueStore.applyRealtimeEvent()` — INSERT / UPDATE / DELETE
- `smsStatusReducer` — state transitions
- `validateRegistrationForm()` — field validation

### Integration Tests (Vitest + Supabase local)
- `call_next_in_queue` RPC — concorrência SKIP LOCKED
- `notify_queue_change` trigger — broadcast emitido
- RLS: anon não pode fazer INSERT direto
- Edge Function `send-sms` — mock Zenvia, verifica sms_sent=true

### E2E Tests (Cypress)
- Fluxo completo: login → registrar cliente → chamar → finalizar
- Sync entre abas (simula 2 tablets)
- SMS manual: botão → feedback de status

---

## Implementation Waves

### Wave 1 — Foundation (sequential, blocker)
- [ ] Scaffold: `pnpm create vite fila-neoenergia --template react-ts`
- [ ] Instalar: Tailwind, shadcn/ui, Supabase client, Zustand, TanStack Query, Zenvia SDK, react-hook-form, zod, framer-motion
- [ ] Configurar Supabase local (`supabase init`)
- [ ] Migrations 001–005 (schema, RLS, RPCs, trigger, seed)
- [ ] `TabletLayout.tsx` — wrapper, safe areas, touch-manipulation
- [ ] `shared/lib/supabase.ts` — Supabase client
- [ ] `shared/types/index.ts` — Queue, QueueEntry, Operator, QueueStatus

### Wave 2 — Auth (após Wave 1)
- [ ] RPC `authenticate_operator(pin)` → SECURITY DEFINER
- [ ] `features/auth/LoginPage.tsx` — PIN input + submit
- [ ] `features/auth/authStore.ts` (Zustand) — operator state
- [ ] `features/auth/AuthGuard.tsx` — redirect se não autenticado
- [ ] Vitest: authStore, formatPin
- [ ] Cypress: fluxo login sucesso + PIN inválido

### Wave 3 — Registro (paralelo com Wave 2)
- [ ] `features/registration/RegistrationForm.tsx` — react-hook-form + zod
- [ ] `features/registration/useRegisterCustomer.ts` — TanStack Query mutation
- [ ] Validação de telefone (E.164, DDD obrigatório)
- [ ] Toast de sucesso com posição
- [ ] Vitest: validateRegistrationForm, formatPhone
- [ ] Cypress: cadastro sucesso + erros de validação

### Wave 4 — Queue + Realtime (após Wave 2 + Wave 3)
- [ ] `features/queue/queueStore.ts` (Zustand) — tickets, calledTicket, smsStatusMap
- [ ] `features/queue/useQueueRealtime.ts` — broadcast subscription
- [ ] `features/queue/useQueueData.ts` (TanStack Query) — carga inicial
- [ ] `features/queue/QueueList.tsx` — lista rolável
- [ ] `features/queue/QueueCard.tsx` — card com ações
- [ ] `features/queue/OperatorPanel.tsx` — painel completo
- [ ] `features/queue/CallingDisplay.tsx` — fullscreen + Framer Motion
- [ ] `features/queue/ActionButtons.tsx` — Chamar, Finalizar, Ausente
- [ ] Optimistic update para "Chamar Próximo"
- [ ] Vitest: queueStore (INSERT/UPDATE/DELETE), getQueuePosition
- [ ] Cypress: chamar → status muda → sync entre abas

### Wave 5 — SMS (paralelo a Wave 4, após Wave 1)
- [ ] `supabase/functions/send-sms/index.ts` — Edge Function Zenvia + idempotência
- [ ] Database Webhook: trigger on UPDATE where status='in_service' → Edge Function
- [ ] `features/sms/useSendSms.ts` — TanStack Query mutation (SMS manual)
- [ ] `features/sms/SmsStatusBadge.tsx` — sending/sent/delivered/failed
- [ ] Vitest: Edge Function mock (Zenvia), idempotência sms_sent
- [ ] Cypress: SMS manual → feedback de status

---

## Git Strategy

```bash
git checkout -b feature/fila-atendimento-neoenergia

# Wave 1
git commit -m "feat(foundation): scaffold, deps, schema, layout"

# Wave 2
git commit -m "feat(auth): PIN login, auth store, auth guard"

# Wave 3
git commit -m "feat(registration): customer form, validation, E.164 phone"

# Wave 4
git commit -m "feat(queue): realtime panel, SKIP LOCKED call, status transitions"

# Wave 5
git commit -m "feat(sms): edge function zenvia, webhook, manual SMS, status badge"

# Conclusion
git commit -m "feat(conclusion): E2E tests, QA gates, final fixes"
```

---

## Definition of Done

- [ ] Todos os BDD scenarios passando (Cucumber)
- [ ] Todos os unit tests passando (Vitest)
- [ ] Todos os E2E passando (Cypress)
- [ ] Race condition de 2 tablets validada (Cypress multi-tab)
- [ ] SMS enviado e status visível no painel
- [ ] Realtime sync < 2s entre tablets
- [ ] Touch targets ≥ 64px em todos os botões primários
- [ ] CallingDisplay funcional em fullscreen
- [ ] Funciona offline (degrada graciosamente sem SMS, não quebra a fila)
- [ ] `/login`, `/`, `/register`, `/display` navegáveis e funcionais
- [ ] Supabase local rodando via Docker
- [ ] agent-browser crawl: 0 BLOCKER / 0 MAJOR

---

## Environment Variables necessárias

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
ZENVIA_API_TOKEN=        # (apenas na Edge Function — nunca no client)
SUPABASE_SERVICE_ROLE_KEY= # (apenas na Edge Function)
```

---

## Atenção — Pré-requisito

> ⚠️ Alpha sender "BAHIAFARM" na Zenvia requer CNPJ e leva 3–10 dias úteis.
> Iniciar processo de cadastro na Zenvia imediatamente.
> Durante desenvolvimento, usar número de teste Zenvia (sandbox mode).
