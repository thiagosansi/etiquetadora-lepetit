import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  entry_id: string;
  queue_id: string;
  trigger: 'auto' | 'manual';
  target_entry_id?: string;
}

interface SmsResult {
  sent: boolean;
  error?: string;
  twilio_status?: number;
  twilio_body?: unknown;
}

async function sendSmsViaTwilio(toPhone: string, message: string): Promise<SmsResult> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    const missing = [
      !accountSid && 'TWILIO_ACCOUNT_SID',
      !authToken && 'TWILIO_AUTH_TOKEN',
      !fromNumber && 'TWILIO_PHONE_NUMBER',
    ].filter(Boolean).join(', ');
    console.error(`[send-sms] Missing env vars: ${missing}`);
    return { sent: false, error: `missing_env_vars: ${missing}` };
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
        To: toPhone,
        Body: message,
      }),
    });

    const body = await response.json();

    if (!response.ok) {
      console.error(`[send-sms] Twilio error ${response.status}:`, JSON.stringify(body));
      return { sent: false, error: 'twilio_error', twilio_status: response.status, twilio_body: body };
    }

    console.log(`[send-sms] Sent to ${toPhone} — sid: ${body.sid}`);
    return { sent: true };
  } catch (err) {
    console.error('[send-sms] Network error:', err);
    return { sent: false, error: String(err) };
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400, headers: CORS_HEADERS });
  }

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
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (!nextEntry) {
      return new Response(JSON.stringify({ sent: false, reason: 'no_next_customer' }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (nextEntry.sms_sent) {
      return new Response(JSON.stringify({ sent: false, reason: 'already_sent' }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    targetEntryId = nextEntry.id;
  }

  if (!targetEntryId) {
    return new Response('Missing target_entry_id for manual trigger', {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const { data: entry, error } = await supabase
    .from('queue_entries')
    .select('id, customer_name, phone, sms_sent')
    .eq('id', targetEntryId)
    .single();

  if (error || !entry) {
    return new Response(JSON.stringify({ sent: false, reason: 'entry_not_found' }), {
      status: 404,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  if (entry.sms_sent && payload.trigger === 'auto') {
    return new Response(JSON.stringify({ sent: false, reason: 'already_sent' }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const message =
    `Ola, ${entry.customer_name}! ` +
    `Seu atendimento sera realizado em ate 5 minutos no estande da Neoenergia Coelba, na Bahia Farm. ` +
    `Compareca dentro desse prazo para nao perder sua vez.`;

  const result = await sendSmsViaTwilio(entry.phone, message);

  if (result.sent) {
    await supabase.rpc('fila_mark_sms_sent', { p_entry_id: entry.id });
  }

  return new Response(JSON.stringify({ ...result, entry_id: entry.id }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
