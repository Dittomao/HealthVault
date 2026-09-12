create extension if not exists pgcrypto;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('jargon', 'prescription', 'bill', 'report')),
  storage_path text,
  file_url text,
  ai_summary text not null,
  flagged_charges jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.family_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 1 and 200),
  relationship text not null check (length(trim(relationship)) between 1 and 50),
  date_of_birth date not null check (date_of_birth <= current_date),
  blood_group text,
  created_at timestamptz not null default now()
);

create table if not exists public.insurance_policies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_name text not null check (length(trim(provider_name)) between 1 and 200),
  policy_number text not null check (length(trim(policy_number)) between 1 and 200),
  storage_path text,
  document_url text,
  created_at timestamptz not null default now()
);

alter table public.documents add column if not exists storage_path text;
alter table public.documents add column if not exists file_url text;
alter table public.documents alter column file_url drop not null;
alter table public.insurance_policies add column if not exists storage_path text;
alter table public.insurance_policies add column if not exists document_url text;
alter table public.insurance_policies alter column document_url drop not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'documents_storage_path_owner_check' and conrelid = 'public.documents'::regclass) then
    alter table public.documents add constraint documents_storage_path_owner_check
      check (storage_path is null or split_part(storage_path, '/', 1) = user_id::text) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'insurance_storage_path_owner_check' and conrelid = 'public.insurance_policies'::regclass) then
    alter table public.insurance_policies add constraint insurance_storage_path_owner_check
      check (storage_path is null or split_part(storage_path, '/', 1) = user_id::text) not valid;
  end if;
end $$;

update public.documents
set storage_path = split_part(file_url, '/storage/v1/object/public/documents/', 2)
where storage_path is null
  and file_url like '%/storage/v1/object/public/documents/%'
  and split_part(file_url, '/storage/v1/object/public/documents/', 2) <> '';

update public.insurance_policies
set storage_path = split_part(document_url, '/storage/v1/object/public/documents/', 2)
where storage_path is null
  and document_url like '%/storage/v1/object/public/documents/%'
  and split_part(document_url, '/storage/v1/object/public/documents/', 2) <> '';

create index if not exists documents_user_created_idx on public.documents (user_id, created_at desc);
create index if not exists family_profiles_user_created_idx on public.family_profiles (user_id, created_at desc);
create index if not exists insurance_policies_user_created_idx on public.insurance_policies (user_id, created_at desc);

alter table public.documents enable row level security;
alter table public.family_profiles enable row level security;
alter table public.insurance_policies enable row level security;

revoke all on public.documents from anon;
revoke all on public.family_profiles from anon;
revoke all on public.insurance_policies from anon;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.family_profiles to authenticated;
grant select, insert, update, delete on public.insurance_policies to authenticated;

drop policy if exists "documents_owner_select" on public.documents;
drop policy if exists "documents_owner_insert" on public.documents;
drop policy if exists "documents_owner_update" on public.documents;
drop policy if exists "documents_owner_delete" on public.documents;
create policy "documents_owner_select" on public.documents for select to authenticated using ((select auth.uid()) = user_id);
create policy "documents_owner_insert" on public.documents for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "documents_owner_update" on public.documents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "documents_owner_delete" on public.documents for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "family_profiles_owner_select" on public.family_profiles;
drop policy if exists "family_profiles_owner_insert" on public.family_profiles;
drop policy if exists "family_profiles_owner_update" on public.family_profiles;
drop policy if exists "family_profiles_owner_delete" on public.family_profiles;
create policy "family_profiles_owner_select" on public.family_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "family_profiles_owner_insert" on public.family_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "family_profiles_owner_update" on public.family_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "family_profiles_owner_delete" on public.family_profiles for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "insurance_policies_owner_select" on public.insurance_policies;
drop policy if exists "insurance_policies_owner_insert" on public.insurance_policies;
drop policy if exists "insurance_policies_owner_update" on public.insurance_policies;
drop policy if exists "insurance_policies_owner_delete" on public.insurance_policies;
create policy "insurance_policies_owner_select" on public.insurance_policies for select to authenticated using ((select auth.uid()) = user_id);
create policy "insurance_policies_owner_insert" on public.insurance_policies for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "insurance_policies_owner_update" on public.insurance_policies for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "insurance_policies_owner_delete" on public.insurance_policies for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "documents_objects_owner_select" on storage.objects;
drop policy if exists "documents_objects_owner_insert" on storage.objects;
drop policy if exists "documents_objects_owner_update" on storage.objects;
drop policy if exists "documents_objects_owner_delete" on storage.objects;
create policy "documents_objects_owner_select" on storage.objects for select to authenticated using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "documents_objects_owner_insert" on storage.objects for insert to authenticated with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "documents_objects_owner_update" on storage.objects for update to authenticated using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "documents_objects_owner_delete" on storage.objects for delete to authenticated using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
