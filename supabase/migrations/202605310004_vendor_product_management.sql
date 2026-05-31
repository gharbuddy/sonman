create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  requested_role public.user_role;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' in ('customer', 'vendor', 'delivery_partner')
      then (new.raw_user_meta_data ->> 'role')::public.user_role
    else 'customer'::public.user_role
  end;

  insert into public.users (id, role, email, phone, full_name)
  values (
    new.id,
    requested_role,
    lower(new.email),
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );

  if requested_role = 'customer' then
    insert into public.customers (user_id) values (new.id);
  elsif requested_role = 'vendor' then
    insert into public.vendors (user_id, business_name, business_address)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'New Sonman store'),
      '{}'::jsonb
    );
  end if;

  return new;
end;
$$;

insert into public.vendors (user_id, business_name, business_address)
select u.id, coalesce(nullif(u.full_name, ''), 'New Sonman store'), '{}'::jsonb
from public.users u
left join public.vendors v on v.user_id = u.id
where u.role = 'vendor' and v.id is null;

alter table public.products alter column is_active set default false;
