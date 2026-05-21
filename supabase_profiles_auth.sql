-- Rode este arquivo no Supabase SQL Editor antes de usar /cadastrar, /login e /perfil.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default 'Usuário Ipixuna',
  role text,
  bio text,
  region text not null default 'AM',
  image_url text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.reports
  add column if not exists user_id uuid references public.profiles (id) on delete set null;

create index if not exists reports_user_id_idx on public.reports (user_id);
create index if not exists profiles_email_idx on public.profiles (email);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Usuário Ipixuna')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mantém leitura pública do mapa e permite que usuários autenticados criem seus próprios reports.
alter table public.reports enable row level security;

drop policy if exists "Allow public read" on public.reports;
create policy "Allow public read"
  on public.reports for select
  using (true);

drop policy if exists "Allow public insert" on public.reports;

drop policy if exists "Users can insert own reports" on public.reports;
create policy "Users can insert own reports"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own reports" on public.reports;
create policy "Users can update own reports"
  on public.reports for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reports" on public.reports;
create policy "Users can delete own reports"
  on public.reports for delete
  to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Profile images are publicly readable" on storage.objects;
create policy "Profile images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'profile-images');

drop policy if exists "Users can upload own profile images" on storage.objects;
create policy "Users can upload own profile images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update own profile images" on storage.objects;
create policy "Users can update own profile images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own profile images" on storage.objects;
create policy "Users can delete own profile images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
