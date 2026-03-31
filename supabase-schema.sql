create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text default 'user',
  is_premium boolean default false,
  avatar_url text,
  auth_provider text default 'email',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  release_year integer not null,
  rating numeric default 0,
  genres text[] default '{}',
  poster_url text,
  video_url text,
  episode_count integer default 0,
  episodes jsonb default '[]'::jsonb,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  is_deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.movies enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "movies_public_select"
on public.movies
for select
to anon, authenticated
using (is_deleted = false);

create policy "movies_admin_insert"
on public.movies
for insert
to authenticated
with check (true);

create policy "movies_admin_update"
on public.movies
for update
to authenticated
using (true)
with check (true);
