phase: supabase_configured
branch: feature/fila-atendimento-neoenergia

completed:
  - Wave 1: Foundation (scaffold, deps, schema, TabletLayout, types)
  - Wave 2: Auth (PIN login, AuthGuard, authStore)
  - Wave 3: Registration (RegistrationPage, form validation, E.164 phone)
  - Wave 4: Queue + Realtime (OperatorPanel, CallingDisplay, QueueCard, hooks)
  - Wave 5: SMS (Edge Function Twilio, useSendSms, SmsStatusBadge)
  - Unit tests: 17/17 passing
  - Build: success (TypeScript clean)
  - Supabase: MatchCV project (gzulphykmkruqpsjpfen) with fila schema
  - Migrations: 001–007 applied (schema, RLS, functions, realtime, seed, grants, publication)
  - Operators seeded: Tablet 1 (PIN 1234), Tablet 2 (PIN 5678), Supervisor (PIN 0000)
  - Edge Function: send-sms deployed (ACTIVE, verify_jwt=false)
  - Frontend: supabase client uses db.schema='fila', realtime via postgres_changes
  - .env.local: created with MatchCV credentials

pending (manual — user action required):
  - Twilio secrets in Supabase dashboard:
      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      TWILIO_AUTH_TOKEN=your-auth-token
      TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
    Path: https://supabase.com/dashboard/project/gzulphykmkruqpsjpfen/settings/functions
