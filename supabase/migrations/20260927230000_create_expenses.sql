create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  amount numeric(10, 2) not null check (amount > 0),
  paid_by text not null check (paid_by in ('Evan', 'Enola')),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users (id)
);

alter table public.expenses enable row level security;

drop policy if exists "Trip admins manage shared expenses" on public.expenses;
create policy "Trip admins manage shared expenses"
on public.expenses for all to authenticated
using ((select public.is_trip_admin()))
with check ((select public.is_trip_admin()) and created_by = (select auth.uid()));

revoke all on public.expenses from public, anon, authenticated;
grant select, insert, update, delete on public.expenses to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.expenses;
exception when duplicate_object then null;
end;
$$;
