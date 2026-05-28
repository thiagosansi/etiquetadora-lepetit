-- Projects table
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  tagline     text,
  description text,
  target_audience text,
  objective   text,
  metrics     text,
  cover_image text,
  built_with  text[] default '{}',
  status      text not null default 'draft'
               check (status in ('draft', 'published')),
  featured    boolean not null default false,
  sort_order  int not null default 0,
  live_url    text,
  repo_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Project images
create table public.project_images (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  alt_text     text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

-- Tags
create table public.tags (
  id   uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null
);

-- Project tags junction
create table public.project_tags (
  project_id uuid not null references public.projects(id) on delete cascade,
  tag_id     uuid not null references public.tags(id) on delete cascade,
  primary key (project_id, tag_id)
);

-- Indexes
create index idx_projects_slug on public.projects(slug);
create index idx_projects_status_sort on public.projects(status, sort_order);
create index idx_projects_featured on public.projects(featured) where featured = true;
create index idx_project_images_project_id on public.project_images(project_id, sort_order);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
