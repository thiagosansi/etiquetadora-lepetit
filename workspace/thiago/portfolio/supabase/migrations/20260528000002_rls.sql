-- Enable RLS
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.tags enable row level security;
alter table public.project_tags enable row level security;

-- Projects: public can read published
create policy "Published projects are publicly readable"
  on public.projects for select
  to anon
  using (status = 'published');

-- Projects: authenticated (admin) can do everything
create policy "Authenticated users can read all projects"
  on public.projects for select
  to authenticated
  using (true);

create policy "Authenticated users can insert projects"
  on public.projects for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update projects"
  on public.projects for update
  to authenticated
  using (true);

create policy "Authenticated users can delete projects"
  on public.projects for delete
  to authenticated
  using (true);

-- Project images: public can read all
create policy "Project images are publicly readable"
  on public.project_images for select
  to anon, authenticated
  using (true);

create policy "Authenticated users manage project images"
  on public.project_images for all
  to authenticated
  using (true);

-- Tags: public can read all
create policy "Tags are publicly readable"
  on public.tags for select
  to anon, authenticated
  using (true);

create policy "Authenticated users manage tags"
  on public.tags for all
  to authenticated
  using (true);

-- Project tags: public can read all
create policy "Project tags are publicly readable"
  on public.project_tags for select
  to anon, authenticated
  using (true);

create policy "Authenticated users manage project tags"
  on public.project_tags for all
  to authenticated
  using (true);
