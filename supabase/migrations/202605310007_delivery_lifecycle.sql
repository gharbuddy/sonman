alter table public.delivery_assignments
  add column if not exists otp_verified boolean not null default false;

insert into public.delivery_partners (user_id)
select u.id
from public.users u
left join public.delivery_partners d on d.user_id = u.id
where u.role = 'delivery_partner' and d.id is null;

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
  elsif requested_role = 'delivery_partner' then
    insert into public.delivery_partners (user_id) values (new.id);
  end if;

  return new;
end;
$$;

create or replace function public.has_active_delivery_assignment(target_order_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.delivery_assignments d
    where d.order_id = target_order_id and d.status in ('assigned', 'accepted', 'picked_up')
  );
$$;

create or replace function public.is_order_delivery_partner(target_order_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.delivery_assignments d
    where d.order_id = target_order_id and d.delivery_partner_id = public.current_delivery_partner_id()
  );
$$;

drop policy if exists "actors read related orders" on public.orders;
create policy "actors read related orders" on public.orders for select using (
  customer_id = public.current_customer_id()
  or vendor_id = public.current_vendor_id()
  or public.is_order_delivery_partner(id)
  or public.is_admin()
);

drop policy if exists "delivery partners read ready orders" on public.orders;
create policy "delivery partners read ready orders" on public.orders for select using (
  public.current_user_role() = 'delivery_partner'
  and status = 'ready_for_pickup'
  and not public.has_active_delivery_assignment(id)
);

create or replace function public.accept_delivery_order(target_order_id uuid)
returns public.delivery_assignments
language plpgsql
security definer set search_path = ''
as $$
declare
  partner public.delivery_partners;
  current_order public.orders;
  assignment public.delivery_assignments;
begin
  select * into partner
  from public.delivery_partners
  where user_id = auth.uid()
  for update;
  if partner.id is null then raise exception 'Delivery partner account is required'; end if;
  if partner.approval_status <> 'approved' then raise exception 'Delivery partner approval is required'; end if;

  select * into current_order from public.orders where id = target_order_id for update;
  if current_order.id is null then raise exception 'Order not found'; end if;
  if current_order.status <> 'ready_for_pickup' then raise exception 'Order is not ready for pickup'; end if;
  if exists (
    select 1 from public.delivery_assignments d
    where d.order_id = target_order_id and d.status in ('assigned', 'accepted', 'picked_up')
  ) then
    raise exception 'Order already has an active delivery assignment';
  end if;

  insert into public.delivery_assignments (order_id, delivery_partner_id, status, accepted_at)
  values (target_order_id, partner.id, 'accepted', now())
  returning * into assignment;
  update public.delivery_partners set availability_status = 'busy' where id = partner.id;
  return assignment;
end;
$$;

create or replace function public.admin_assign_delivery_partner(target_order_id uuid, target_delivery_partner_id uuid)
returns public.delivery_assignments
language plpgsql
security definer set search_path = ''
as $$
declare
  current_order public.orders;
  partner public.delivery_partners;
  assignment public.delivery_assignments;
begin
  if not public.is_admin() then raise exception 'Administrator access is required'; end if;
  select * into current_order from public.orders where id = target_order_id for update;
  if current_order.id is null then raise exception 'Order not found'; end if;
  if current_order.status <> 'ready_for_pickup' then raise exception 'Order is not ready for pickup'; end if;
  select * into partner from public.delivery_partners where id = target_delivery_partner_id;
  if partner.id is null or partner.approval_status <> 'approved' then
    raise exception 'Approved delivery partner is required';
  end if;
  if exists (
    select 1 from public.delivery_assignments d
    where d.order_id = target_order_id and d.status in ('assigned', 'accepted', 'picked_up')
  ) then
    raise exception 'Order already has an active delivery assignment';
  end if;
  insert into public.delivery_assignments (order_id, delivery_partner_id, status)
  values (target_order_id, target_delivery_partner_id, 'assigned')
  returning * into assignment;
  update public.delivery_partners set availability_status = 'busy' where id = target_delivery_partner_id;
  return assignment;
end;
$$;

create or replace function public.advance_delivery_order(
  target_order_id uuid,
  next_status public.order_status,
  delivery_otp_input text default null,
  proof_path_input text default null
)
returns public.orders
language plpgsql
security definer set search_path = ''
as $$
declare
  partner_id uuid := public.current_delivery_partner_id();
  assignment public.delivery_assignments;
  current_order public.orders;
begin
  if partner_id is null then raise exception 'Delivery partner account is required'; end if;
  select * into current_order from public.orders where id = target_order_id for update;
  select * into assignment
  from public.delivery_assignments d
  where d.order_id = target_order_id and d.delivery_partner_id = partner_id
    and d.status in ('assigned', 'accepted', 'picked_up')
  order by d.created_at desc
  limit 1
  for update;
  if assignment.id is null then raise exception 'Active delivery assignment not found'; end if;

  if current_order.status = 'ready_for_pickup' and next_status = 'picked_up' then
    update public.delivery_assignments set status = 'picked_up', picked_up_at = now()
    where id = assignment.id;
  elsif current_order.status = 'picked_up' and next_status = 'out_for_delivery' then
    null;
  elsif current_order.status = 'out_for_delivery' and next_status = 'delivered' then
    if delivery_otp_input is null or delivery_otp_input !~ '^[0-9]{4}$' then
      raise exception 'A 4-digit delivery OTP is required';
    end if;
    if proof_path_input is null or btrim(proof_path_input) = '' then
      raise exception 'Delivery proof image is required';
    end if;
    update public.delivery_assignments
    set status = 'delivered', otp_verified = true, proof_path = proof_path_input, delivered_at = now()
    where id = assignment.id;
    update public.delivery_partners set availability_status = 'available' where id = partner_id;
  else
    raise exception 'Invalid delivery status transition';
  end if;

  update public.orders
  set status = next_status,
      delivered_at = case when next_status = 'delivered' then now() else delivered_at end
  where id = target_order_id
  returning * into current_order;
  return current_order;
end;
$$;

create or replace function public.update_order_status(order_id uuid, next_status public.order_status)
returns public.orders
language plpgsql
security definer set search_path = ''
as $$
declare
  current_order public.orders;
begin
  select * into current_order from public.orders where id = order_id for update;
  if current_order.id is null then raise exception 'Order not found'; end if;
  if not (public.is_admin() or current_order.vendor_id = public.current_vendor_id()) then
    raise exception 'Order access denied';
  end if;
  if not (
    (current_order.status = 'pending' and next_status = 'accepted') or
    (current_order.status = 'accepted' and next_status = 'packed') or
    (current_order.status = 'packed' and next_status = 'ready_for_pickup') or
    (public.is_admin() and current_order.status = 'ready_for_pickup' and next_status = 'picked_up') or
    (public.is_admin() and current_order.status = 'picked_up' and next_status = 'out_for_delivery') or
    (public.is_admin() and current_order.status = 'out_for_delivery' and next_status = 'delivered')
  ) then
    raise exception 'Invalid order status transition';
  end if;
  update public.orders
  set status = next_status,
      delivered_at = case when next_status = 'delivered' then now() else delivered_at end
  where id = order_id
  returning * into current_order;
  return current_order;
end;
$$;

revoke execute on function public.accept_delivery_order(uuid) from public;
revoke execute on function public.admin_assign_delivery_partner(uuid, uuid) from public;
revoke execute on function public.advance_delivery_order(uuid, public.order_status, text, text) from public;
grant execute on function public.accept_delivery_order(uuid) to authenticated;
grant execute on function public.admin_assign_delivery_partner(uuid, uuid) to authenticated;
grant execute on function public.advance_delivery_order(uuid, public.order_status, text, text) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'delivery_assignments'
  ) then
    alter publication supabase_realtime add table public.delivery_assignments;
  end if;
end;
$$;
