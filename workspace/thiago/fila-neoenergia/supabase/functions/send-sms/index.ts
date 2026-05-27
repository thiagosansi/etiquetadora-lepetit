import { createClient } from 'jsr:@supabase/supabase-js@2';

const EVENT_NAME = 'BAHIA FARM 2026';
const TEXTBEE_API_URL = 'https://api.textbee.dev/api/v1/gateway/devices';

interface WebhookPayload {
  entry_id: string;
  queue_id: string;
  trigger: 'auto' | 'manual';
  target_entry_id?: string; // for manual SMS, target a specific entry
}

/**
 * Send SMS via TextBee (https://textbee.dev)
 * TextBee uses an Android phone as SMS gateway — SMS is sent from the device's SIM card.
 * No CNPJ required. Free within the carrier plan.
 *
 * Setup:
 *   1. Create account at textbee.dev
 *   2. Install TextBee app on Android phone, grant SMS permissions
 *   3. Register device and generate API key in dashboard
 *   4. Set TEXTBEE_API_KEY and TEXTBEE_DEVICE_ID in Supabase Edge Function secrets
 */
async function sendSmsViaTextBee(
  toPhone: string,
  message: string,
): Promise<boolean> {
  const apiKey = Deno.env.get('TEXTBEE_API_KEY');
  const deviceId = Deno.env.get('TEXTBEE_DEVICE_ID');

  if (!apiKey || !deviceId) {
    console.error('[send-sms] Missing TextBee env vars (TEXTBEE_API_KEY, TEXTBEE_DEVICE_ID)');
    return false;
  }

  try {
    const response = await fetch(
      `${TEXTBEE_API_URL}/${deviceId}/send-sms`,
      {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: [toPhone],
          message,
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      console.error(`[send-sms] TextBee error ${response.status}: ${err}`);
      return false;
    }

    const data = await response.json();
    console.log(`[send-sms] Sent to ${toPhone} via TextBee`, data);
    return true;
  } catch (err) {
    console.error('[send-sms] Network error:', err);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Determine which entry to notify
  let targetEntryId = payload.target_entry_id;

  if (payload.trigger === 'auto') {
    // Auto: notify the NEXT customer in line (not the one currently called)
    const { data: nextEntry } = await supabase
      .from('queue_entries')
      .select('id, customer_name, phone, sms_sent')
      .eq('queue_id', payload.queue_id)
      .eq('status', 'waiting')
      .eq('sms_sent', false)
      .order('scheduled_time', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (!nextEntry) {
      return new Response(JSON.stringify({ sent: false, reason: 'no_next_customer' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (nextEntry.sms_sent) {
      return new Response(JSON.stringify({ sent: false, reason: 'already_sent' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    targetEntryId = nextEntry.id;
  }

  if (!targetEntryId) {
    return new Response('Missing target_entry_id for manual trigger', { status: 400 });
  }

  // Fetch target entry details
  const { data: entry, error } = await supabase
    .from('queue_entries')
    .select('id, customer_name, phone, sms_sent')
    .eq('id', targetEntryId)
    .single();

  if (error || !entry) {
    return new Response(JSON.stringify({ sent: false, reason: 'entry_not_found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (entry.sms_sent && payload.trigger === 'auto') {
    return new Response(JSON.stringify({ sent: false, reason: 'already_sent' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const message =
    `${EVENT_NAME}: Ola ${entry.customer_name}! ` +
    `Voce e o proximo na fila de atendimento NEOENERGIA. ` +
    `Por favor, dirija-se ao local.`;

  const sent = await sendSmsViaTextBee(entry.phone, message);

  if (sent) {
    // Mark as sent atomically to prevent duplicates
    await supabase
      .from('queue_entries')
      .update({ sms_sent: true })
      .eq('id', entry.id);
  }

  return new Response(JSON.stringify({ sent, entry_id: entry.id }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
