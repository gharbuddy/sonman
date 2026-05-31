create or replace function public.protect_managed_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if tg_table_name = 'users' then
      if new.role <> old.role or new.is_active <> old.is_active then
        raise exception 'Only administrators may change user access';
      end if;
    elsif tg_table_name = 'vendors' then
      if new.approval_status <> old.approval_status then
        raise exception 'Only administrators may change approval status';
      end if;
    elsif tg_table_name = 'delivery_partners' then
      if new.approval_status <> old.approval_status then
        raise exception 'Only administrators may change approval status';
      end if;
    end if;
  end if;
  return new;
end;
$$;
