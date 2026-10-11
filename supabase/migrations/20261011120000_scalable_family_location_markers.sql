do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'family_location_markers'
      and column_name = 'traveler'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'family_location_markers'
      and column_name = 'display_name'
  ) then
    alter table public.family_location_markers
      drop constraint if exists family_location_markers_traveler_check,
      drop constraint if exists family_location_markers_user_id_key,
      drop constraint if exists family_location_markers_user_id_fkey;

    alter table public.family_location_markers
      rename column traveler to display_name;

    update public.family_location_markers
    set display_name = 'Voyageur'
    where display_name is null or btrim(display_name) = '';

    alter table public.family_location_markers
      drop constraint if exists family_location_markers_pkey,
      alter column display_name set default 'Voyageur',
      alter column display_name set not null,
      alter column user_id set not null,
      add constraint family_location_markers_pkey primary key (user_id),
      add constraint family_location_markers_display_name_check
        check (char_length(btrim(display_name)) between 1 and 80),
      add constraint family_location_markers_user_id_fkey
        foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
end;
$$;

drop trigger if exists family_location_markers_set_updated_at on public.family_location_markers;
create trigger family_location_markers_set_updated_at
before insert or update on public.family_location_markers
for each row execute function public.set_updated_at();

drop policy if exists "Family can read persistent location markers" on public.family_location_markers;
create policy "Family can read persistent location markers"
on public.family_location_markers for select to anon, authenticated
using (true);

drop policy if exists "Trip admins manage their own location marker" on public.family_location_markers;
drop policy if exists "Authenticated users manage their own location marker" on public.family_location_markers;
drop policy if exists "Authenticated users insert their own location marker" on public.family_location_markers;
create policy "Authenticated users insert their own location marker"
on public.family_location_markers for insert to authenticated
with check (user_id = (select auth.uid()));
drop policy if exists "Authenticated users update their own location marker" on public.family_location_markers;
create policy "Authenticated users update their own location marker"
on public.family_location_markers for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke all on public.family_location_markers from public, anon, authenticated;
grant select (user_id, display_name, latitude, longitude, updated_at)
  on public.family_location_markers to anon, authenticated;
grant insert, update on public.family_location_markers to authenticated;
