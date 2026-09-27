drop policy if exists "Trip admins update shared travel photos" on storage.objects;
create policy "Trip admins update shared travel photos"
on storage.objects for update to authenticated
using (bucket_id = 'family-updates' and (select public.is_trip_admin()))
with check (bucket_id = 'family-updates' and (select public.is_trip_admin()));
