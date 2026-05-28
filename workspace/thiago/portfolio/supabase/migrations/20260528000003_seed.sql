-- Seed: 7 real projects
-- NOTE: This seed already applied to remote. Re-running will fail due to unique slug constraint.
-- To reset: DELETE FROM public.projects; then run this.

insert into public.projects (slug, title, tagline, description, target_audience, objective, metrics, built_with, status, featured, sort_order, live_url)
values
  (
    'matchcv',
    'MatchCV',
    'Plataforma de matching inteligente entre currículos e vagas',
    'Plataforma que usa IA para fazer o matching automático entre currículos de candidatos e vagas de emprego. Recrutadores ganham um ranking dos melhores candidatos com score de compatibilidade, economizando horas de triagem manual.',
    'Recrutadores e gestores de RH de empresas de médio e grande porte',
    'Reduzir o tempo de triagem de currículos em até 80% usando IA para matching automático e scoring de compatibilidade',
    'Plataforma em produção com análise de currículos por IA',
    ARRAY['Next.js', 'TypeScript', 'Supabase', 'OpenAI', 'Tailwind CSS'],
    'published', true, 1,
    'https://matchcv-drab.vercel.app/'
  ),
  (
    'adframe',
    'Adframe',
    'Adequador de imagens para anúncios em múltiplos formatos',
    'Ferramenta SaaS para adequar imagens automaticamente nos formatos exigidos pelas principais plataformas de anúncios (Meta, Google, TikTok). Upload uma vez, exporta em todos os tamanhos. Planos pagos via Stripe.',
    'Agências de marketing, gestores de tráfego e anunciantes que precisam adaptar criativos para diferentes plataformas',
    'Eliminar o trabalho manual de redimensionar imagens para cada formato de anúncio, economizando tempo e garantindo conformidade',
    'Plataforma com planos pagos via Stripe em produção',
    ARRAY['Next.js', 'TypeScript', 'Supabase', 'Stripe', 'Tailwind CSS'],
    'published', true, 2,
    'https://adframe.com.br'
  ),
  (
    'erp-lepetit',
    'ERP Le Petit',
    'Sistema de gestão completo para restaurante',
    'ERP desenvolvido sob medida para a Le Petit Quicheria. Gestão de pedidos, cardápio, estoque, financeiro e relatórios operacionais em um único sistema. Painel administrativo separado para gestão interna.',
    'Equipe operacional e administrativa da Le Petit Quicheria',
    'Digitalizar e centralizar toda a operação do restaurante, eliminando planilhas e processos manuais',
    'Sistema em uso diário pela operação do restaurante',
    ARRAY['React', 'TypeScript', 'Supabase', 'Vite', 'Tailwind CSS'],
    'published', false, 3,
    'https://erplepetit.vercel.app/'
  ),
  (
    'manutech',
    'Manutech',
    'Plataforma de gestão de ordens de serviço para técnicos',
    'Sistema de gestão de manutenção que conecta técnicos de campo com ordens de serviço. Técnicos visualizam, aceitam e encerram chamados pelo app. Gestores acompanham status em tempo real e geram relatórios em PDF.',
    'Empresas com equipes de técnicos de manutenção em campo',
    'Digitalizar o processo de abertura, atribuição e encerramento de ordens de serviço com visibilidade total da operação',
    'Sistema com geração de relatórios em PDF e painel de gestão em produção',
    ARRAY['Next.js', 'TypeScript', 'Tailwind CSS', 'NextAuth', 'React PDF'],
    'published', false, 4,
    'https://meu-app-one-liart.vercel.app/tecnicos'
  ),
  (
    'cardapio-digital',
    'Cardápio Digital Le Petit',
    'Cardápio digital com QR Code para restaurante',
    'Cardápio digital acessível por QR Code para a Le Petit Quicheria. Clientes visualizam o cardápio completo pelo celular com fotos, descrições e preços atualizados em tempo real. Sem app necessário.',
    'Clientes da Le Petit Quicheria',
    'Substituir cardápios físicos por uma experiência digital atualizada em tempo real, reduzindo custos de impressão',
    'Cardápio em uso ativo no restaurante',
    ARRAY['Next.js', 'TypeScript', 'Radix UI', 'Tailwind CSS'],
    'published', false, 5,
    'https://cardapio.lepetitquicheria.com.br'
  ),
  (
    'etiquetadora',
    'Etiquetadora Le Petit',
    'Gerador de etiquetas de produtos para impressão',
    'Ferramenta para criação e impressão de etiquetas de produtos da Le Petit Quicheria. Define modelos com campos dinâmicos (nome, peso, validade, ingredientes) e imprime direto para a cozinha ou embalagem.',
    'Equipe de produção e embalagem da Le Petit Quicheria',
    'Padronizar e agilizar a geração de etiquetas garantindo conformidade com informações obrigatórias',
    'Em uso diário na produção do restaurante',
    ARRAY['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
    'published', false, 6,
    'https://etiquetadora-lepetit.vercel.app/'
  ),
  (
    'fila-neoenergia',
    'Fila Virtual NeoEnergia',
    'Sistema de filas para atendimento presencial com SMS automático',
    'Sistema de fila virtual para unidades de atendimento da NeoEnergia. Clientes se registram no tablet na entrada, recebem SMS quando é a vez deles e são chamados pelo display. Operadores gerenciam a fila em tempo real.',
    'Operadores e gestores de unidades presenciais da NeoEnergia',
    'Reduzir o tempo de espera percebido e melhorar a experiência de atendimento presencial com notificação SMS automática',
    'Sistema com Supabase Realtime + Twilio SMS em produção',
    ARRAY['React', 'TypeScript', 'Supabase', 'Tailwind CSS', 'Twilio', 'Vite'],
    'published', true, 7,
    'https://fila-neoenergia.vercel.app/'
  );
