create extension if not exists pgcrypto;

create table if not exists public.trip_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_trip_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.trip_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_trip_admin() from public;
grant execute on function public.is_trip_admin() to authenticated;
grant usage on schema public to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create table if not exists public.places (
  id text primary key,
  kind text not null check (kind in ('visite', 'food', 'pub')),
  name text not null check (char_length(name) between 1 and 120),
  category text not null default '',
  description text not null default '',
  address text not null default '',
  opening_hours text not null default '',
  price text not null default '',
  official_website text,
  booking_link text,
  price_range text,
  transport_details jsonb,
  travel_time text not null default '',
  map_query text not null default '',
  image_path text,
  details jsonb not null default '[]'::jsonb,
  note text not null default '',
  accent text not null default 'mint' check (accent in ('mint', 'amber', 'rose')),
  updated_at timestamptz not null default now()
);

alter table public.places
  add column if not exists official_website text,
  add column if not exists booking_link text,
  add column if not exists price_range text,
  add column if not exists transport_details jsonb;

create table if not exists public.day_schedule (
  id uuid primary key default gen_random_uuid(),
  place_id text not null unique references public.places (id) on delete cascade,
  visit_date date not null check (visit_date between date '2026-10-20' and date '2026-10-23'),
  sort_order integer not null default 0,
  visited boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.family_locations (
  id text primary key check (id = 'dublin-trip'),
  latitude numeric(7, 3) not null check (latitude between -90 and 90),
  longitude numeric(7, 3) not null check (longitude between -180 and 180),
  is_sharing boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.travel_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  slot_key text unique check (
    slot_key is null or slot_key in (
      'outbound-evan',
      'return-evan',
      'outbound-enola',
      'return-enola'
    )
  ),
  file_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  file_size bigint not null check (file_size between 1 and 15728640),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.departure_checklist (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 400),
  is_done boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_updates (
  id uuid primary key default gen_random_uuid(),
  travel_date date not null check (travel_date between date '2026-10-20' and date '2026-10-23'),
  travel_time time not null,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1200),
  image_path text,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.places
  add column if not exists image_paths text[] not null default '{}';

update public.places
set image_paths = array[image_path]
where image_path is not null and cardinality(image_paths) = 0;

alter table public.family_updates
  add column if not exists image_paths text[] not null default '{}';

update public.family_updates
set image_paths = array[image_path]
where image_path is not null and cardinality(image_paths) = 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'places_image_paths_max_count'
      and conrelid = 'public.places'::regclass
  ) then
    alter table public.places
      add constraint places_image_paths_max_count check (cardinality(image_paths) <= 8);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'family_updates_image_paths_max_count'
      and conrelid = 'public.family_updates'::regclass
  ) then
    alter table public.family_updates
      add constraint family_updates_image_paths_max_count check (cardinality(image_paths) <= 8);
  end if;
end;
$$;

drop trigger if exists places_set_updated_at on public.places;
create trigger places_set_updated_at
before insert or update on public.places
for each row execute function public.set_updated_at();

drop trigger if exists day_schedule_set_updated_at on public.day_schedule;
create trigger day_schedule_set_updated_at
before insert or update on public.day_schedule
for each row execute function public.set_updated_at();

drop trigger if exists family_locations_set_updated_at on public.family_locations;
create trigger family_locations_set_updated_at
before insert or update on public.family_locations
for each row execute function public.set_updated_at();

drop trigger if exists departure_checklist_set_updated_at on public.departure_checklist;
create trigger departure_checklist_set_updated_at
before insert or update on public.departure_checklist
for each row execute function public.set_updated_at();

drop trigger if exists family_updates_set_updated_at on public.family_updates;
create trigger family_updates_set_updated_at
before insert or update on public.family_updates
for each row execute function public.set_updated_at();

alter table public.trip_admins enable row level security;
alter table public.places enable row level security;
alter table public.day_schedule enable row level security;
alter table public.family_locations enable row level security;
alter table public.travel_documents enable row level security;
alter table public.departure_checklist enable row level security;
alter table public.family_updates enable row level security;

drop policy if exists "Trip admins can read their own membership" on public.trip_admins;
create policy "Trip admins can read their own membership"
on public.trip_admins for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Published places are readable" on public.places;
drop policy if exists "Trip admins manage places" on public.places;
drop policy if exists "Trip admins can access places" on public.places;
create policy "Trip admins can access places"
on public.places for all to authenticated
using ((select public.is_trip_admin()))
with check ((select public.is_trip_admin()));

drop policy if exists "Family can read the itinerary" on public.day_schedule;
drop policy if exists "Trip admins manage the itinerary" on public.day_schedule;
drop policy if exists "Trip admins can access the itinerary" on public.day_schedule;
create policy "Trip admins can access the itinerary"
on public.day_schedule for all to authenticated
using ((select public.is_trip_admin()))
with check ((select public.is_trip_admin()));

drop policy if exists "Only enabled approximate location is public" on public.family_locations;
drop policy if exists "Trip admins manage location sharing" on public.family_locations;
drop policy if exists "Trip admins can access location sharing" on public.family_locations;
create policy "Trip admins can access location sharing"
on public.family_locations for all to authenticated
using ((select public.is_trip_admin()))
with check ((select public.is_trip_admin()));

drop policy if exists "Only trip admins can access document metadata" on public.travel_documents;
create policy "Only trip admins can access document metadata"
on public.travel_documents for all to authenticated
using ((select public.is_trip_admin()))
with check ((select public.is_trip_admin()));

drop policy if exists "Only trip admins manage the departure checklist" on public.departure_checklist;
create policy "Only trip admins manage the departure checklist"
on public.departure_checklist for all to authenticated
using ((select public.is_trip_admin()))
with check ((select public.is_trip_admin()));

drop policy if exists "Family can read travel updates" on public.family_updates;
create policy "Family can read travel updates"
on public.family_updates for select to anon, authenticated
using (true);

drop policy if exists "Trip admins publish travel updates" on public.family_updates;
create policy "Trip admins publish travel updates"
on public.family_updates for insert to authenticated
with check ((select public.is_trip_admin()) and created_by = (select auth.uid()));

drop policy if exists "Trip admins update travel updates" on public.family_updates;
create policy "Trip admins update travel updates"
on public.family_updates for update to authenticated
using ((select public.is_trip_admin()))
with check ((select public.is_trip_admin()));

drop policy if exists "Trip admins delete travel updates" on public.family_updates;
create policy "Trip admins delete travel updates"
on public.family_updates for delete to authenticated
using ((select public.is_trip_admin()));

revoke all on public.trip_admins, public.places, public.day_schedule, public.family_locations,
  public.travel_documents, public.departure_checklist, public.family_updates
from public, anon, authenticated;

grant select on public.trip_admins to authenticated;
grant select, insert, update, delete on public.places, public.day_schedule, public.family_locations,
  public.travel_documents, public.departure_checklist to authenticated;
grant select, insert, update, delete on public.family_updates to authenticated;
grant select on public.family_updates to anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('place-covers', 'place-covers', true, 8388608, array['image/jpeg', 'image/png', 'image/webp']),
  ('travel-documents', 'travel-documents', false, 15728640, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('family-updates', 'family-updates', true, 5242880, array['image/jpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Place cover images are public" on storage.objects;
create policy "Place cover images are public"
on storage.objects for select to anon, authenticated
using (bucket_id = 'place-covers');

drop policy if exists "Trip admins upload place covers" on storage.objects;
create policy "Trip admins upload place covers"
on storage.objects for insert to authenticated
with check (bucket_id = 'place-covers' and (select public.is_trip_admin()));

drop policy if exists "Trip admins update place covers" on storage.objects;
create policy "Trip admins update place covers"
on storage.objects for update to authenticated
using (bucket_id = 'place-covers' and (select public.is_trip_admin()))
with check (bucket_id = 'place-covers' and (select public.is_trip_admin()));

drop policy if exists "Trip admins delete place covers" on storage.objects;
create policy "Trip admins delete place covers"
on storage.objects for delete to authenticated
using (bucket_id = 'place-covers' and (select public.is_trip_admin()));

drop policy if exists "Trip admins can read private travel documents" on storage.objects;
create policy "Trip admins can read private travel documents"
on storage.objects for select to authenticated
using (bucket_id = 'travel-documents' and (select public.is_trip_admin()));

drop policy if exists "Trip admins upload private travel documents" on storage.objects;
create policy "Trip admins upload private travel documents"
on storage.objects for insert to authenticated
with check (bucket_id = 'travel-documents' and (select public.is_trip_admin()));

drop policy if exists "Trip admins delete private travel documents" on storage.objects;
create policy "Trip admins delete private travel documents"
on storage.objects for delete to authenticated
using (bucket_id = 'travel-documents' and (select public.is_trip_admin()));

drop policy if exists "Family can read shared travel photos" on storage.objects;
create policy "Family can read shared travel photos"
on storage.objects for select to anon, authenticated
using (bucket_id = 'family-updates');

drop policy if exists "Trip admins upload shared travel photos" on storage.objects;
create policy "Trip admins upload shared travel photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'family-updates' and (select public.is_trip_admin()));

drop policy if exists "Trip admins delete shared travel photos" on storage.objects;
create policy "Trip admins delete shared travel photos"
on storage.objects for delete to authenticated
using (bucket_id = 'family-updates' and (select public.is_trip_admin()));

do $$
begin
  alter publication supabase_realtime add table public.places;
exception when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.day_schedule;
exception when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.family_locations;
exception when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.family_updates;
exception when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.departure_checklist;
exception when duplicate_object then null;
end;
$$;
