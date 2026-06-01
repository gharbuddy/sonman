alter table public.users
  add column if not exists gender text,
  add column if not exists date_of_birth date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_gender_check'
  ) then
    alter table public.users
      add constraint users_gender_check
      check (gender is null or gender in ('Female', 'Male', 'Non-binary', 'Prefer not to say'));
  end if;
end $$;
