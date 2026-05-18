
-- Roles
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can view all roles"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Auto-grant admin to designated email on signup
create or replace function public.handle_new_user_admin_grant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.email = 'sean.mahlanza@gmail.com' then
    insert into public.user_roles (user_id, role)
    values (NEW.id, 'admin')
    on conflict do nothing;
  end if;
  return NEW;
end;
$$;

create trigger on_auth_user_created_grant_admin
after insert on auth.users
for each row execute function public.handle_new_user_admin_grant();

-- Recaps
create table public.recaps (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  talk_date date not null,
  poster_url text,
  content text not null check (char_length(content) between 1 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recaps enable row level security;

create policy "Public can read recaps"
on public.recaps for select
to anon, authenticated
using (true);

create policy "Admins can insert recaps"
on public.recaps for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update recaps"
on public.recaps for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete recaps"
on public.recaps for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Current/upcoming poster (singleton)
create table public.current_poster (
  id uuid primary key default gen_random_uuid(),
  title text,
  talk_date date,
  poster_url text,
  updated_at timestamptz not null default now()
);

alter table public.current_poster enable row level security;

create policy "Public can read current poster"
on public.current_poster for select
to anon, authenticated
using (true);

create policy "Admins can insert current poster"
on public.current_poster for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update current poster"
on public.current_poster for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete current poster"
on public.current_poster for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Seed one empty current_poster row so admin can just update it
insert into public.current_poster (title) values (null);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin NEW.updated_at = now(); return NEW; end;
$$;

create trigger recaps_touch before update on public.recaps
for each row execute function public.touch_updated_at();
create trigger current_poster_touch before update on public.current_poster
for each row execute function public.touch_updated_at();

-- Storage bucket for posters
insert into storage.buckets (id, name, public)
values ('bible-talk-assets', 'bible-talk-assets', true);

create policy "Public can read bible talk assets"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'bible-talk-assets');

create policy "Admins can upload bible talk assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'bible-talk-assets' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can update bible talk assets"
on storage.objects for update
to authenticated
using (bucket_id = 'bible-talk-assets' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete bible talk assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'bible-talk-assets' and public.has_role(auth.uid(), 'admin'));
