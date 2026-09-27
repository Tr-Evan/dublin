alter table public.expenses
  add column if not exists is_reimbursement boolean not null default false;

update public.expenses
set is_reimbursement = true
where title = 'Remboursement'
  and is_shared = true
  and is_reimbursement = false;
