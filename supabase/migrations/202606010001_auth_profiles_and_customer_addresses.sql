create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text not null,
  recipient_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index customer_addresses_one_default_idx
  on public.customer_addresses (customer_id) where is_default;
create index customer_addresses_customer_created_idx
  on public.customer_addresses (customer_id, created_at desc);
create trigger customer_addresses_set_updated_at before update on public.customer_addresses
  for each row execute function public.set_updated_at();

alter table public.customer_addresses enable row level security;
create policy "customers manage own addresses" on public.customer_addresses for all
  using (customer_id = public.current_customer_id() or public.is_admin())
  with check (customer_id = public.current_customer_id() or public.is_admin());

create or replace function public.sync_customer_default_address()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  target_customer uuid := coalesce(new.customer_id, old.customer_id);
  selected_address public.customer_addresses;
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    if new.is_default then
      update public.customer_addresses
      set is_default = false
      where customer_id = new.customer_id and id <> new.id and is_default;
    end if;
  end if;

  select * into selected_address
  from public.customer_addresses
  where customer_id = target_customer
  order by is_default desc, created_at
  limit 1;

  if selected_address.id is not null and not selected_address.is_default then
    update public.customer_addresses set is_default = true where id = selected_address.id;
    selected_address.is_default := true;
  end if;

  update public.customers
  set default_address = case when selected_address.id is null then null else jsonb_build_object(
    'id', selected_address.id,
    'label', selected_address.label,
    'recipient_name', selected_address.recipient_name,
    'line1', selected_address.line1,
    'line2', selected_address.line2,
    'city', selected_address.city,
    'state', selected_address.state,
    'postal_code', selected_address.postal_code
  ) end
  where id = target_customer;
  return coalesce(new, old);
end;
$$;

create trigger customer_addresses_sync_default
  after insert or update or delete on public.customer_addresses
  for each row execute function public.sync_customer_default_address();

create or replace function public.sync_authenticated_profile(
  profile_email text default null,
  profile_full_name text default ''
)
returns public.users
language plpgsql
security definer set search_path = ''
as $$
declare
  auth_user auth.users;
  result public.users;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  select * into auth_user from auth.users where id = auth.uid();
  if auth_user.id is null then raise exception 'Authenticated user is unavailable'; end if;

  insert into public.users (id, role, email, phone, full_name)
  values (
    auth_user.id,
    'customer',
    lower(coalesce(profile_email, auth_user.email)),
    auth_user.phone,
    coalesce(nullif(trim(profile_full_name), ''), auth_user.raw_user_meta_data ->> 'full_name', auth_user.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do update set
    email = lower(coalesce(excluded.email, public.users.email)),
    full_name = coalesce(nullif(excluded.full_name, ''), public.users.full_name)
  returning * into result;

  if result.role = 'customer' then
    insert into public.customers (user_id) values (result.id) on conflict (user_id) do nothing;
  elsif result.role = 'vendor' then
    insert into public.vendors (user_id, business_name, business_address)
    values (result.id, coalesce(nullif(result.full_name, ''), 'New Sonman store'), '{}'::jsonb)
    on conflict (user_id) do nothing;
  elsif result.role = 'delivery_partner' then
    insert into public.delivery_partners (user_id) values (result.id) on conflict (user_id) do nothing;
  end if;
  return result;
end;
$$;

revoke execute on function public.sync_authenticated_profile(text, text) from public;
grant execute on function public.sync_authenticated_profile(text, text) to authenticated;
