alter table public.users
  add column gender text,
  add column date_of_birth date,
  add constraint users_gender_check check (gender is null or gender in ('Female', 'Male', 'Non-binary', 'Prefer not to say'));

alter table public.products
  add column variants text[] not null default '{}';

