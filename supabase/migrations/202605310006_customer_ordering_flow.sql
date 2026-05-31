create table public.carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references public.customers(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);
create index cart_items_cart_idx on public.cart_items (cart_id);

create trigger carts_set_updated_at before update on public.carts
  for each row execute function public.set_updated_at();
create trigger cart_items_set_updated_at before update on public.cart_items
  for each row execute function public.set_updated_at();

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

create policy "customers manage own cart" on public.carts for all
  using (customer_id = public.current_customer_id())
  with check (customer_id = public.current_customer_id());
create policy "customers manage own cart items" on public.cart_items for all
  using (exists (
    select 1 from public.carts c
    where c.id = cart_id and c.customer_id = public.current_customer_id()
  ))
  with check (exists (
    select 1 from public.carts c
    where c.id = cart_id and c.customer_id = public.current_customer_id()
  ));

create or replace function public.get_or_create_cart()
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  customer uuid := public.current_customer_id();
  cart uuid;
begin
  if customer is null then
    raise exception 'Customer account is required';
  end if;
  insert into public.carts (customer_id) values (customer)
  on conflict (customer_id) do update set updated_at = now()
  returning id into cart;
  return cart;
end;
$$;

create or replace function public.set_cart_item(product uuid, item_quantity integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  cart uuid := public.get_or_create_cart();
begin
  if item_quantity < 0 then
    raise exception 'Cart quantity cannot be negative';
  end if;
  if item_quantity = 0 then
    delete from public.cart_items where cart_id = cart and product_id = product;
    return;
  end if;
  if not exists (
    select 1 from public.products p
    join public.vendors v on v.id = p.vendor_id
    where p.id = product and p.is_active and p.deleted_at is null
      and v.approval_status = 'approved'
  ) then
    raise exception 'Product is not available';
  end if;
  insert into public.cart_items (cart_id, product_id, quantity)
  values (cart, product, item_quantity)
  on conflict (cart_id, product_id)
  do update set quantity = excluded.quantity, updated_at = now();
end;
$$;

create or replace function public.place_cart_order(delivery_address jsonb default '{}'::jsonb)
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
      subtotal_amount, total_amount, delivery_address, placed_at
    ) values (
      'SON-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
      customer, vendor_record.vendor_id, 'pending', 'INR',
      subtotal, subtotal, coalesce(delivery_address, '{}'::jsonb), now()
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
    (current_order.status = 'ready_for_pickup' and next_status = 'picked_up') or
    (current_order.status = 'picked_up' and next_status = 'out_for_delivery') or
    (current_order.status = 'out_for_delivery' and next_status = 'delivered')
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

revoke execute on function public.get_or_create_cart() from public;
revoke execute on function public.set_cart_item(uuid, integer) from public;
revoke execute on function public.place_cart_order(jsonb) from public;
revoke execute on function public.update_order_status(uuid, public.order_status) from public;
grant execute on function public.get_or_create_cart() to authenticated;
grant execute on function public.set_cart_item(uuid, integer) to authenticated;
grant execute on function public.place_cart_order(jsonb) to authenticated;
grant execute on function public.update_order_status(uuid, public.order_status) to authenticated;
