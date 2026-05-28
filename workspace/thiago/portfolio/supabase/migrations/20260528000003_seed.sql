-- Seed 3 example projects
insert into public.projects (slug, title, tagline, description, target_audience, objective, built_with, status, sort_order, featured)
values
  (
    'fila-atendimento-neoenergia',
    'Fila de Atendimento NeoEnergia',
    'Sistema de gerenciamento de filas para atendimento presencial com SMS automático',
    'Sistema completo de fila de atendimento para unidades de atendimento da NeoEnergia. Operadores gerenciam a fila via tablets, clientes recebem SMS quando é a vez deles.',
    'Operadores de atendimento e gestores de unidades de atendimento da NeoEnergia',
    'Reduzir o tempo de espera percebido e melhorar a experiência de atendimento presencial',
    ARRAY['React', 'TypeScript', 'Supabase', 'Tailwind CSS', 'Twilio', 'Vite'],
    'published',
    1,
    true
  ),
  (
    'etiquetadora',
    'Etiquetadora',
    'Gerador de etiquetas para produtos com IA',
    'Ferramenta para geração automática de etiquetas de produtos usando IA para sugerir conteúdo, formatação e impressão.',
    'Pequenos comerciantes e lojistas que precisam gerar etiquetas de produtos rapidamente',
    'Automatizar e acelerar o processo de criação de etiquetas de produtos',
    ARRAY['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
    'published',
    2,
    false
  ),
  (
    'matchcv',
    'MatchCV',
    'Plataforma de matching entre currículos e vagas com IA',
    'Plataforma que usa IA para fazer o matching entre currículos de candidatos e vagas de emprego, identificando os melhores candidatos automaticamente.',
    'Recrutadores e gestores de RH de empresas de médio e grande porte',
    'Reduzir o tempo de triagem de currículos em 80% usando IA para matching automático',
    ARRAY['Next.js', 'TypeScript', 'Supabase', 'OpenAI', 'Tailwind CSS'],
    'published',
    3,
    false
  );
