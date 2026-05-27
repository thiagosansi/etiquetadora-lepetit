# Research: Sistema de Fila de Atendimento — NEOENERGIA BAHIA FARM 2026

## Key Insights

1. **Zenvia é o provedor SMS correto para o Brasil** — infraestrutura local, latência 1–3s, SDK TypeScript nativo, compliance ANATEL/LGPD nativa e suporte em português. Alpha sender "BAHIAFARM" é possível (requer CNPJ, 3–10 dias úteis).
2. **`SELECT FOR UPDATE SKIP LOCKED` é o padrão canônico** para evitar race condition com 2 tablets chamando o próximo ao mesmo tempo — resolve silenciosamente na camada de banco, sem retry no cliente.
3. **Supabase Realtime via trigger `realtime.send()`** é mais robusto que Postgres Changes direto para esse caso: payload customizado, funciona em DELETE, sem problemas de RLS por subscriber.
4. **SMS deve ser disparado via Database Webhook → Edge Function** — assíncrono, credenciais seguras em variáveis de ambiente, retry possível sem bloquear a transação.
5. **Posição na fila: calcular dinamicamente** (COUNT com índice parcial) — para dezenas de clientes/dia, custo zero; evita UPDATE em cascata ao chamar um cliente.
6. **Auth simplificada com PIN via RPC SECURITY DEFINER** — tablets são dispositivos fixos de evento; Supabase Auth seria overkill; PIN hasheado com pgcrypto resolve sem complexidade.
7. **Zustand + TanStack Query + Supabase Realtime** é o stack de estado validado pela comunidade: Zustand para UI efêmera, TanStack Query para carga inicial, Realtime para sync entre tablets.
8. **Touch targets mínimos de 64px (h-16)** para botões primários em tablet — Apple HIG e Material Design recomendam 48px como mínimo absoluto.

---

## Business & Market Analysis

- Sistema para evento agrícola presencial (BAHIA FARM 2026) com fluxo de clientes NEOENERGIA
- Contexto: 2 tablets operacionais, duração definida de evento, volume moderado (dezenas de clientes/dia)
- Notificação SMS é transacional (cliente se cadastrou ativamente) — regime regulatório mais simples que marketing
- Concorrentes relevantes como referência: SimplQ (React, fila digital), QueueMe (React + Supabase Realtime + Expo)

---

## API & Integration Docs

### Zenvia (provedor recomendado)

**SDK:** `@zenvia/sdk` — TypeScript nativo

```bash
pnpm add @zenvia/sdk
```

**Envio de SMS:**
```typescript
import { Client, TextContent } from "@zenvia/sdk";

const zenvia = new Client(process.env.ZENVIA_API_TOKEN!);
const smsChannel = zenvia.getChannel("sms");

export async function sendQueueNotificationSms(
  toPhone: string,
  customerName: string,
  position: number,
): Promise<void> {
  const content = new TextContent(
    `BAHIA FARM 2026: Olá ${customerName}, sua vez está chegando! ` +
    `Você é o número ${position} na fila. Dirija-se ao local.`,
  );
  await smsChannel.sendMessage("BAHIAFARM", `+55${toPhone}`, content);
}
```

**Webhook de delivery:**
```typescript
messageStatusEventHandler: (event) => {
  // event.messageStatus.code: "SENT" | "DELIVERED" | "FAILED"
}
```

**REST direto (Edge Function):**
```
POST https://api.zenvia.com/v2/channels/sms/messages
X-API-TOKEN: <token>
{ "from": "BAHIAFARM", "to": "+5511...", "contents": [{ "type": "text", "text": "..." }] }
```

**Taxas de entrega BR:** Vivo 95–98%, Claro 94–97%, TIM 93–96%, Oi 90–94%
**Preço estimado:** R$ 0,12–0,25/SMS (volume moderado)

### Comparativo de provedores

| Provedor | Preço/SMS BR | SDK TS | Latência BR | Suporte PT |
|---|---|---|---|---|
| **Zenvia** ✅ | R$ 0,12–0,25 | ✅ nativo | 1–3s | ✅ |
| Twilio | ~R$ 0,30 | ✅ | 3–8s | ❌ |
| AWS SNS | ~R$ 0,11–0,14 | ✅ | Média | ❌ |
| Infobip | Sob consulta | ✅ | Baixa | Parcial |

---

## Architecture & Backend Patterns

### Schema de banco de dados

```sql
CREATE TYPE queue_status AS ENUM ('waiting', 'in_service', 'absent', 'finished');

CREATE TABLE queues (
  id         uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text  NOT NULL,
  date       date  NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, date)
);

CREATE TABLE queue_entries (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id       uuid         NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  customer_name  text         NOT NULL,
  phone          text         NOT NULL,       -- E.164: +5511999999999
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

-- Índices críticos
CREATE INDEX idx_queue_entries_next ON queue_entries (queue_id, scheduled_time ASC)
  WHERE status = 'waiting';

CREATE INDEX idx_queue_entries_sms ON queue_entries (queue_id, called_at)
  WHERE status = 'waiting' AND sms_sent = false;
```

**Máquina de estados:**
```
waiting → in_service   (chamada normal)
waiting → absent       (não compareceu)
absent  → waiting      (retornou)
in_service → finished  (concluído)
```

### Supabase Realtime — Broadcast via trigger

```sql
CREATE OR REPLACE FUNCTION notify_queue_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM realtime.send(
    jsonb_build_object('event_type', TG_OP, 'entry', row_to_json(COALESCE(NEW, OLD))),
    'queue_change',
    'queue:' || COALESCE(NEW.queue_id, OLD.queue_id)::text,
    true
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_notify_queue_change
  AFTER INSERT OR UPDATE OR DELETE ON queue_entries
  FOR EACH ROW EXECUTE FUNCTION notify_queue_change();
```

### Concorrência — SELECT FOR UPDATE SKIP LOCKED

```sql
CREATE OR REPLACE FUNCTION call_next_in_queue(p_queue_id uuid)
RETURNS SETOF queue_entries LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_entry queue_entries%ROWTYPE;
BEGIN
  SELECT * INTO v_entry
  FROM queue_entries
  WHERE queue_id = p_queue_id AND status = 'waiting'
  ORDER BY scheduled_time ASC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_entry.id IS NULL THEN RETURN; END IF;

  UPDATE queue_entries
  SET status = 'in_service', called_at = COALESCE(v_entry.called_at, now()),
      served_at = now(), version = version + 1
  WHERE id = v_entry.id
  RETURNING * INTO v_entry;

  RETURN NEXT v_entry;
END;
$$;
```

### SMS via Edge Function (assíncrono)

```
queue_entries UPDATE (status = 'in_service')
  → Database Webhook (pg_net, assíncrono)
    → Edge Function: send-sms
      → Zenvia API
        → SMS para próximo cliente da fila
```

### RLS Pattern

- Leitura: `anon` pode ler (tablets precisam ver a fila)
- Escrita: somente via RPC com `SECURITY DEFINER`
- PIN de operador: tabela `operators` com `pin_hash` via pgcrypto

---

## Domain Rules & Terminology

- **Fila (Queue):** sessão de atendimento do dia
- **Entrada (Entry):** cliente na fila com posição, status e dados de contato
- **Chamada (Call):** ação de chamar o próximo cliente
- **Status:** waiting | in_service | absent | finished
- **SMS Transacional:** notificação de serviço (não marketing) — ANATEL regime simples
- **Alpha Sender:** nome de remetente SMS (ex: "BAHIAFARM") — requer cadastro CNPJ na Zenvia

**Regulatório (ANATEL + LGPD):**
- Mensagens transacionais: consentimento implícito no cadastro da fila
- Incluir identificação do evento no texto do SMS
- Manter logs de envio (LGPD)
- Horário do evento diurno: sem restrição aplicável

---

## Implementation Patterns

### Stack de estado (UI)

```typescript
// Zustand: estado UI efêmero
// TanStack Query: carga inicial + cache do servidor
// Supabase Realtime: sincronização entre tablets

// stores/queueStore.ts
const useQueueStore = create<QueueState>()((set) => ({
  tickets: [],
  calledTicket: null,
  smsStatusMap: {},
  actions: {
    setTickets: (tickets) => set({ tickets }),
    applyRealtimeEvent: (event) => set((state) => { /* INSERT/UPDATE/DELETE */ }),
    callTicket: (ticketId) => set((state) => ({
      calledTicket: state.tickets.find(t => t.id === ticketId) ?? null,
    })),
    setSmsStatus: (ticketId, status) => set((state) => ({
      smsStatusMap: { ...state.smsStatusMap, [ticketId]: status },
    })),
  },
}));
```

### Hook Realtime

```typescript
export function useQueueRealtime(queueId: string) {
  const { applyRealtimeEvent } = useQueueActions();
  useEffect(() => {
    const channel = supabase
      .channel(`queue:${queueId}`)
      .on('broadcast', { event: 'queue_change' }, ({ payload }) =>
        applyRealtimeEvent(payload))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queueId, applyRealtimeEvent]);
}
```

### Estrutura de componentes

```
src/
  components/
    queue/
      QueueList.tsx       # lista rolável da fila
      QueueCard.tsx       # card de cliente com ações
      CallingDisplay.tsx  # tela fullscreen de chamada
    operator/
      OperatorPanel.tsx   # painel principal tablet
      ActionButtons.tsx   # Chamar / Finalizar / Pular
      SmsStatusBadge.tsx  # indicador sent/delivered/failed
    registration/
      RegistrationForm.tsx # cadastro de cliente na fila
    layout/
      TabletLayout.tsx    # wrapper touch-friendly
```

### Touch targets (tablet)

- Botões primários: `h-16 px-8` (64px)
- Botões secundários: `h-14` (56px)
- Gap entre botões: `gap-4`
- Senha em chamada: `text-8xl font-bold`

---

## Pitfalls & Lessons Learned

1. **Não usar Postgres Changes direto para DELETE** — filtros não funcionam; usar Broadcast via trigger
2. **Não armazenar posição na fila** — UPDATE em cascata cria contenção; calcular com COUNT indexado
3. **Não chamar SMS do cliente** — credenciais da API ficariam expostas; usar Edge Function
4. **Não usar optimistic locking para "próximo"** — exige retry no cliente; SKIP LOCKED resolve silenciosamente
5. **Registrar alpha sender com antecedência** — processo Zenvia leva 3–10 dias úteis; iniciar imediatamente
6. **Formatar telefone em E.164** antes de salvar (`+55` + DDD + número sem espaços/traços)
7. **Marcar `sms_sent = true` atomicamente** após envio — evitar SMS duplicado em caso de retry do webhook

---

## Autonomous Decisions

### Decisão 1 — Provedor SMS: Zenvia
**Evidência:** Menor latência no Brasil (1–3s vs 3–8s Twilio), SDK TypeScript nativo, suporte em PT, compliance ANATEL nativa, alpha sender. Preço competitivo para volume de evento.
**Alternativa descartada:** Twilio — custo 2–3x maior, suporte em inglês, maior latência BR.

### Decisão 2 — Auth: PIN via RPC (sem Supabase Auth)
**Evidência:** Tablets são dispositivos fixos de evento, não usuários finais. Supabase Auth exigiria fluxo OAuth/email desnecessário. PIN hasheado com pgcrypto + função SECURITY DEFINER é mais simples, seguro e adequado ao contexto.
**Alternativa descartada:** Supabase Auth — overkill para 2 tablets operacionais de evento.

### Decisão 3 — Realtime: Broadcast via trigger `realtime.send()`
**Evidência:** Postgres Changes não filtra em DELETE corretamente. Trigger permite payload customizado (apenas campos relevantes) e não depende de RLS por subscriber. Documentação Supabase 2025 recomenda este padrão para payloads customizados.
**Alternativa descartada:** Postgres Changes direto — limitação em DELETE, payload fixo de linha completa.

### Decisão 4 — Concorrência: SELECT FOR UPDATE SKIP LOCKED em RPC
**Evidência:** Padrão canônico PostgreSQL para filas com múltiplos consumidores. Dois tablets podem chamar simultaneamente sem race condition, sem retry, sem erro — o banco serializa silenciosamente. Documentação SupaExplorer e comunidade PostgreSQL confirmam como melhor prática.
**Alternativa descartada:** Optimistic locking com `version` — exige retry no cliente, mais complexidade.

### Decisão 5 — State management: Zustand + TanStack Query + Supabase Realtime
**Evidência:** Stack validado pelo ecossistema Makerkit/Supabase 2025. Zustand para UI efêmera (qual ticket está sendo chamado), TanStack Query para carga inicial com cache, Realtime para sync entre tablets. Sem duplicidade de responsabilidades.
**Alternativa descartada:** Apenas React Query + Supabase — sem estado UI local estruturado para o CallingDisplay.

---

## References

- [Zenvia SDK TypeScript](https://zenvia.github.io/zenvia-nodejs-sdk/)
- [Supabase Realtime: Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Supabase Realtime: Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Database Webhooks | Supabase](https://supabase.com/docs/guides/database/webhooks)
- [SKIP LOCKED for Queue Processing](https://supaexplorer.com/best-practices/supabase-postgres/lock-skip-locked/)
- [Edge Functions | Supabase](https://supabase.com/docs/guides/functions)
- [Working with Zustand (tkdodo)](https://tkdodo.eu/blog/working-with-zustand)
- [TanStack Query + Supabase (Makerkit)](https://makerkit.dev/blog/saas/supabase-react-query)
- [QueueMe — React + Supabase Realtime](https://github.com/MatthewKim07/QueueMe)
- [Twilio Send SMS — Supabase Blog](https://www.twilio.com/en-us/blog/send-sms-notifications-supabase-users-node-js-twilio-messaging)
- [Tablet UI Design Guide](https://www.koombea.com/blog/tablet-ui/)
