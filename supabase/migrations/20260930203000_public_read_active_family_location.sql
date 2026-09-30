drop policy if exists "Only enabled approximate location is public" on public.family_locations;
drop policy if exists "Trip admins manage location sharing" on public.family_locations;
drop policy if exists "Trip admins can access location sharing" on public.family_locations;
drop policy if exists "Family can read active location" on public.family_locations;

create policy "Family can read active location"
on public.family_locations for select to anon, authenticated
using (
  is_sharing
  and updated_at > now() - interval '5 minutes'
);

create policy "Trip admins can access location sharing"
on public.family_locations for all to authenticated
using ((select public.is_trip_admin()))
with check ((select public.is_trip_admin()));

revoke all on public.family_locations from public, anon, authenticated;
grant select on public.family_locations to anon, authenticated;
grant insert, update, delete on public.family_locations to authenticated;
