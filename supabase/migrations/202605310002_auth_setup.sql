create function public.handle_new_auth_user()
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
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create function public.current_user_role()
returns public.user_role
language sql
stable
security definer set search_path = ''
as $$
  select role from public.users where id = auth.uid() and is_active;
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create function public.current_vendor_id()
returns uuid
language sql
stable
security definer set search_path = ''
as $$
  select id from public.vendors where user_id = auth.uid();
$$;

create function public.current_delivery_partner_id()
returns uuid
language sql
stable
security definer set search_path = ''
as $$
  select id from public.delivery_partners where user_id = auth.uid();
$$;

create function public.current_customer_id()
returns uuid
language sql
stable
security definer set search_path = ''
as $$
  select id from public.customers where user_id = auth.uid();
$$;

create function public.protect_managed_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if tg_table_name = 'users' and (new.role <> old.role or new.is_active <> old.is_active) then
      raise exception 'Only administrators may change user access';
    end if;
    if tg_table_name in ('vendors', 'delivery_partners') and new.approval_status <> old.approval_status then
      raise exception 'Only administrators may change approval status';
    end if;
  end if;
  return new;
end;
$$;

create trigger users_protect_managed_fields before update on public.users
  for each row execute function public.protect_managed_profile_fields();
create trigger vendors_protect_managed_fields before update on public.vendors
  for each row execute function public.protect_managed_profile_fields();
create trigger delivery_partners_protect_managed_fields before update on public.delivery_partners
  for each row execute function public.protect_managed_profile_fields();
