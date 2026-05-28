-- Create public storage bucket for portfolio assets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio',
  'portfolio',
  true,
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Allow public read access to portfolio bucket
create policy "Portfolio bucket is publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'portfolio');

-- Allow authenticated users to upload/manage files
create policy "Authenticated users can upload portfolio files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio');

create policy "Authenticated users can update portfolio files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'portfolio');

create policy "Authenticated users can delete portfolio files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio');
