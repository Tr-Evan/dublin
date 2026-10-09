create table if not exists public.family_location_markers (
  traveler text primary key check (traveler in ('Evan', 'Enola')),
  user_id uuid not null unique references public.trip_admins (user_id) on delete cascade,
  latitude numeric(7, 3) not null check (latitude between -90 and 90),
  longitude numeric(7, 3) not null check (longitude between -180 and 180),
  updated_at timestamptz not null default now()
);

alter table public.family_location_markers enable row level security;

drop policy if exists "Family can read active location" on public.family_locations;
drop policy if exists "Only enabled approximate location is public" on public.family_locations;
drop policy if exists "Trip admins manage location sharing" on public.family_locations;
drop policy if exists "Trip admins can access location sharing" on public.family_locations;
create policy "Trip admins can access location sharing"
on public.family_locations for all to authenticated
using ((select public.is_trip_admin()))
with check ((select public.is_trip_admin()));

drop policy if exists "Family can read persistent location markers" on public.family_location_markers;
create policy "Family can read persistent location markers"
on public.family_location_markers for select to anon, authenticated
using (true);

drop policy if exists "Trip admins manage their own location marker" on public.family_location_markers;
create policy "Trip admins manage their own location marker"
on public.family_location_markers for all to authenticated
using ((select public.is_trip_admin()) and user_id = (select auth.uid()))
with check ((select public.is_trip_admin()) and user_id = (select auth.uid()));

revoke all on public.family_locations from public, anon, authenticated;
grant select, insert, update, delete on public.family_locations to authenticated;

revoke all on public.family_location_markers from public, anon, authenticated;
grant select (traveler, latitude, longitude, updated_at) on public.family_location_markers to anon;
grant select (traveler, user_id, latitude, longitude, updated_at) on public.family_location_markers to authenticated;
grant insert, update on public.family_location_markers to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.family_location_markers;
exception when duplicate_object then null;
end;
$$;
