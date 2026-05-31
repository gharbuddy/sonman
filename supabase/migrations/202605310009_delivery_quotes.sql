create type public.delivery_zone as enum ('A', 'B', 'C');
create type public.delivery_size as enum ('small', 'medium', 'large', 'heavy');

alter table public.products
  add column if not exists delivery_size public.delivery_size not null default 'small';

alter table public.orders
  add column if not exists delivery_zone public.delivery_zone not null default 'A',
  add column if not exists delivery_distance_km numeric(8, 2) not null default 0 check (delivery_distance_km >= 0),
  add column if not exists expected_delivery_date date not null default ((now() at time zone 'Asia/Kolkata')::date + 1),
  add column if not exists delivery_quote_required boolean not null default false,
  add column if not exists delivery_fee_overridden boolean not null default false;

alter table public.order_items
  add column if not exists delivery_size public.delivery_size not null default 'small';

create or replace function public.delivery_zone_for_distance(distance_km numeric)
returns public.delivery_zone
language sql
immutable
set search_path = ''
as $$
  select case
    when distance_km <= 10 then 'A'::public.delivery_zone
    when distance_km <= 30 then 'B'::public.delivery_zone
    else 'C'::public.delivery_zone
  end;
$$;

create or replace function public.standard_expected_delivery_date(ordered_at timestamptz default now())
returns date
language sql
stable
set search_path = ''
as $$
  select (ordered_at at time zone 'Asia/Kolkata')::date
    + case when (ordered_at at time zone 'Asia/Kolkata')::time < time '18:00' then 1 else 2 end;
$$;

create or replace function public.delivery_fee_for(size public.delivery_size, zone public.delivery_zone)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case
    when size = 'small' and zone = 'A' then 50
    when size = 'small' and zone = 'B' then 100
    when size = 'medium' and zone = 'A' then 100
    when size = 'medium' and zone = 'B' then 180
    else null
  end::numeric;
$$;

drop function if exists public.place_cart_order(jsonb, boolean);

create function public.place_cart_order(
  delivery_address jsonb default '{}'::jsonb,
  policy_acknowledged boolean default false,
  delivery_distance_km numeric default 0
)
returns setof public.orders
language plpgsql
security definer set search_path = ''
as $$
declare
  customer uuid := public.current_customer_id();
  cart uuid;
  vendor_record record;
  item_record record;
  new_order public.orders;
  subtotal numeric(12, 2);
  zone public.delivery_zone;
  shipment_size public.delivery_size;
  delivery_fee numeric(12, 2);
  quote_required boolean;
begin
  if customer is null then
    raise exception 'Customer account is required';
  end if;
  if not policy_acknowledged then
    raise exception 'Prepaid cancellation and replacement policy acknowledgement is required';
  end if;
  if delivery_distance_km is null or delivery_distance_km < 0 then
    raise exception 'Delivery distance must be zero or greater';
  end if;
  zone := public.delivery_zone_for_distance(delivery_distance_km);

  select id into cart
  from public.carts
  where customer_id = customer
  for update;
  if not exists (
    select 1 from public.cart_items ci
    where ci.cart_id = cart
  ) then
    raise exception 'Cart is empty';
  end if;

  perform 1
  from public.inventory i
  join public.cart_items ci on ci.product_id = i.product_id
  where ci.cart_id = cart
  order by i.product_id
  for update of i;

  if exists (
    select 1
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    join public.vendors v on v.id = p.vendor_id
    left join public.inventory i on i.product_id = ci.product_id
    where ci.cart_id = cart
      and (not p.is_active or p.deleted_at is not null or v.approval_status <> 'approved' or i.product_id is null or i.quantity_available < ci.quantity)
  ) then
    raise exception 'One or more cart items are out of stock';
  end if;

  for vendor_record in
    select distinct p.vendor_id
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.cart_id = cart
  loop
    select
      sum(ci.quantity * p.price),
      case max(case p.delivery_size when 'small' then 1 when 'medium' then 2 when 'large' then 3 else 4 end)
        when 1 then 'small'::public.delivery_size
        when 2 then 'medium'::public.delivery_size
        when 3 then 'large'::public.delivery_size
        else 'heavy'::public.delivery_size
      end
    into subtotal, shipment_size
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.cart_id = cart and p.vendor_id = vendor_record.vendor_id;

    delivery_fee := public.delivery_fee_for(shipment_size, zone);
    quote_required := delivery_fee is null;

    insert into public.orders (
      order_number, customer_id, vendor_id, status, currency,
      subtotal_amount, delivery_fee_amount, total_amount, delivery_address, placed_at,
      payment_method, payment_status, cancellation_allowed_until_status,
      replacement_eligible, policy_acknowledged_at, delivery_zone, delivery_distance_km,
      expected_delivery_date, delivery_quote_required
    ) values (
      'SON-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
      customer, vendor_record.vendor_id, 'pending', 'INR',
      subtotal, coalesce(delivery_fee, 0), subtotal + coalesce(delivery_fee, 0),
      coalesce(delivery_address, '{}'::jsonb), now(),
      'online', 'pending', 'pending', true, now(), zone, delivery_distance_km,
      public.standard_expected_delivery_date(), quote_required
    ) returning * into new_order;

    for item_record in
      select p.id, p.name, p.price, p.delivery_size, ci.quantity
      from public.cart_items ci
      join public.products p on p.id = ci.product_id
      where ci.cart_id = cart and p.vendor_id = vendor_record.vendor_id
    loop
      insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, line_total, delivery_size)
      values (new_order.id, item_record.id, item_record.name, item_record.price, item_record.quantity, item_record.price * item_record.quantity, item_record.delivery_size);
      update public.inventory
      set quantity_available = quantity_available - item_record.quantity
      where product_id = item_record.id;
    end loop;

    insert into public.payments (order_id, provider, status, amount, currency, metadata)
    values (new_order.id, 'placeholder', 'pending', new_order.total_amount, new_order.currency, '{"mode":"placeholder"}'::jsonb);

    return next new_order;
  end loop;

  delete from public.cart_items where cart_id = cart;
end;
$$;

create or replace function public.admin_override_delivery_fee(target_order_id uuid, delivery_fee numeric)
returns public.orders
language plpgsql
security definer set search_path = ''
as $$
declare
  current_order public.orders;
begin
  if not public.is_admin() then raise exception 'Administrator access is required'; end if;
  if delivery_fee is null or delivery_fee < 0 then raise exception 'Delivery fee must be zero or greater'; end if;
  select * into current_order from public.orders where id = target_order_id for update;
  if current_order.id is null then raise exception 'Order not found'; end if;
  if current_order.status in ('picked_up', 'out_for_delivery', 'delivered') then
    raise exception 'Delivery fee cannot be changed after dispatch';
  end if;

  update public.orders
  set delivery_fee_amount = delivery_fee,
      total_amount = subtotal_amount - discount_amount + delivery_fee,
      delivery_quote_required = false,
      delivery_fee_overridden = true
  where id = target_order_id
  returning * into current_order;

  update public.payments
  set amount = current_order.total_amount
  where order_id = target_order_id and status = 'pending';
  return current_order;
end;
$$;

revoke execute on function public.place_cart_order(jsonb, boolean, numeric) from public;
revoke execute on function public.admin_override_delivery_fee(uuid, numeric) from public;
grant execute on function public.place_cart_order(jsonb, boolean, numeric) to authenticated;
grant execute on function public.admin_override_delivery_fee(uuid, numeric) to authenticated;
