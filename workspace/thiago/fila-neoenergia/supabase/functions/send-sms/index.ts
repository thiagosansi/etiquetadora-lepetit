import { createClient } from 'jsr:@supabase/supabase-js@2';

const EVENT_NAME = 'BAHIA FARM 2026';

interface WebhookPayload {
  entry_id: string;
  queue_id: string;
  trigger: 'auto' | 'manual';
  target_entry_id?: string; // for manual SMS, target a specific entry
}

/**
 * Send SMS via Twilio REST API.
 * No CNPJ required — personal account works.
 * Free trial: ~US$15 credit (~50 SMS to Brazil).
 *
 * Setup:
 *   1. Create account at twilio.com
 *   2. Get a phone number (free trial number)
 *   3. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 *      in Supabase Edge Function secrets
 */
async function sendSmsViaTwilio(
  toPhone: string,
  message: string,
): Promise<boolean> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    console.error('[send-sms] Missing Twilio env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)');
    return false;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = btoa(`${accountSid}:${authToken}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: toPhone,   // E.164: +5571999999999
        Body: message,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[send-sms] Twilio error ${response.status}: ${err}`);
      return false;
    }

    const data = await response.json();
    console.log(`[send-sms] Sent to ${toPhone} — sid: ${data.sid}`);
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

  // No db.schema needed — uses public wrappers that delegate to fila schema
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let targetEntryId = payload.target_entry_id;

  if (payload.trigger === 'auto') {
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
    `Ola, ${entry.customer_name}! ` +
    `Seu atendimento acontecera em aproximadamente 5 minutos no stand da NEOENERGIA do BAHIA FARM. ` +
    `Compareca ao local dentro desse prazo para nao perder sua vez.`;

  const sent = await sendSmsViaTwilio(entry.phone, message);

  if (sent) {
    await supabase.rpc('fila_mark_sms_sent', { p_entry_id: entry.id });
  }

  return new Response(JSON.stringify({ sent, entry_id: entry.id }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
