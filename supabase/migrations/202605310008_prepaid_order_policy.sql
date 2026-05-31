alter table public.orders
  add column if not exists payment_method text not null default 'online'
    check (payment_method = 'online'),
  add column if not exists payment_status public.payment_status not null default 'pending',
  add column if not exists cancellation_allowed_until_status public.order_status not null default 'pending',
  add column if not exists replacement_eligible boolean not null default true,
  add column if not exists replacement_reported_at timestamptz,
  add column if not exists policy_acknowledged_at timestamptz not null default now();

drop function if exists public.place_cart_order(jsonb);

create function public.place_cart_order(
  delivery_address jsonb default '{}'::jsonb,
  policy_acknowledged boolean default false
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
begin
  if customer is null then
    raise exception 'Customer account is required';
  end if;
  if not policy_acknowledged then
    raise exception 'Prepaid cancellation and replacement policy acknowledgement is required';
  end if;
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
    select sum(ci.quantity * p.price)
    into subtotal
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.cart_id = cart and p.vendor_id = vendor_record.vendor_id;

    insert into public.orders (
      order_number, customer_id, vendor_id, status, currency,
      subtotal_amount, total_amount, delivery_address, placed_at,
      payment_method, payment_status, cancellation_allowed_until_status,
      replacement_eligible, policy_acknowledged_at
    ) values (
      'SON-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
      customer, vendor_record.vendor_id, 'pending', 'INR',
      subtotal, subtotal, coalesce(delivery_address, '{}'::jsonb), now(),
      'online', 'pending', 'pending', true, now()
    ) returning * into new_order;

    for item_record in
      select p.id, p.name, p.price, ci.quantity
      from public.cart_items ci
      join public.products p on p.id = ci.product_id
      where ci.cart_id = cart and p.vendor_id = vendor_record.vendor_id
    loop
      insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
      values (new_order.id, item_record.id, item_record.name, item_record.price, item_record.quantity, item_record.price * item_record.quantity);
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

revoke execute on function public.place_cart_order(jsonb, boolean) from public;
grant execute on function public.place_cart_order(jsonb, boolean) to authenticated;
