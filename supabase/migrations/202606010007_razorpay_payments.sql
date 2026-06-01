alter table public.payments
  add column if not exists provider_order_id text,
  add column if not exists payment_method text;

drop index if exists public.payments_provider_id_unique;
create index if not exists payments_provider_payment_idx
  on public.payments (provider, provider_payment_id)
  where provider_payment_id is not null;
create index if not exists payments_provider_order_idx
  on public.payments (provider, provider_order_id)
  where provider_order_id is not null;

create or replace function public.razorpay_cart_quote(
  target_customer uuid,
  delivery_distance_km numeric default 0
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  cart uuid;
  zone public.delivery_zone;
  total numeric(12, 2);
  quote_required boolean;
begin
  if target_customer is null then raise exception 'Customer account is required'; end if;
  if delivery_distance_km is null or delivery_distance_km < 0 then
    raise exception 'Delivery distance must be zero or greater';
  end if;
  select id into cart from public.carts where customer_id = target_customer;
  if cart is null or not exists (select 1 from public.cart_items where cart_id = cart) then
    raise exception 'Cart is empty';
  end if;
  if exists (
    select 1
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    join public.vendors v on v.id = p.vendor_id
    left join public.inventory i on i.product_id = ci.product_id
    where ci.cart_id = cart
      and (not p.is_active or p.deleted_at is not null or v.approval_status <> 'approved'
        or i.product_id is null or i.quantity_available < ci.quantity)
  ) then
    raise exception 'One or more cart items are out of stock';
  end if;

  zone := public.delivery_zone_for_distance(delivery_distance_km);
  select sum(vendor_subtotal + coalesce(delivery_fee, 0)), bool_or(delivery_fee is null)
  into total, quote_required
  from (
    select
      sum(ci.quantity * p.price) as vendor_subtotal,
      public.delivery_fee_for(
        case max(case p.delivery_size when 'small' then 1 when 'medium' then 2 when 'large' then 3 else 4 end)
          when 1 then 'small'::public.delivery_size
          when 2 then 'medium'::public.delivery_size
          when 3 then 'large'::public.delivery_size
          else 'heavy'::public.delivery_size
        end,
        zone
      ) as delivery_fee
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.cart_id = cart
    group by p.vendor_id
  ) vendor_quotes;

  return jsonb_build_object(
    'total_amount', total,
    'currency', 'INR',
    'delivery_quote_required', coalesce(quote_required, false)
  );
end;
$$;

create or replace function public.place_paid_cart_order(
  target_customer uuid,
  delivery_address jsonb,
  delivery_distance_km numeric,
  paid_amount_paise integer,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_payment_method text default null
)
returns setof public.orders
language plpgsql
security definer set search_path = ''
as $$
declare
  cart uuid;
  vendor_record record;
  item_record record;
  new_order public.orders;
  subtotal numeric(12, 2);
  zone public.delivery_zone;
  shipment_size public.delivery_size;
  delivery_fee numeric(12, 2);
  quote_required boolean;
  quote jsonb;
begin
  if exists (
    select 1 from public.payments
    where provider = 'razorpay' and provider_payment_id = razorpay_payment_id
  ) then
    return query
      select o.* from public.orders o
      join public.payments p on p.order_id = o.id
      where p.provider = 'razorpay' and p.provider_payment_id = razorpay_payment_id
      order by o.created_at;
    return;
  end if;
  if razorpay_order_id is null or razorpay_payment_id is null then
    raise exception 'Razorpay payment identifiers are required';
  end if;

  zone := public.delivery_zone_for_distance(delivery_distance_km);
  select id into cart from public.carts where customer_id = target_customer for update;

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
      and (not p.is_active or p.deleted_at is not null or v.approval_status <> 'approved'
        or i.product_id is null or i.quantity_available < ci.quantity)
  ) then
    raise exception 'One or more cart items are out of stock';
  end if;
  quote := public.razorpay_cart_quote(target_customer, delivery_distance_km);
  if paid_amount_paise <> round((quote->>'total_amount')::numeric * 100) then
    raise exception 'Paid amount does not match the current cart total';
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
      target_customer, vendor_record.vendor_id, 'pending', 'INR',
      subtotal, coalesce(delivery_fee, 0), subtotal + coalesce(delivery_fee, 0),
      coalesce(delivery_address, '{}'::jsonb), now(),
      'online', 'paid', 'pending', true, now(), zone, delivery_distance_km,
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
      update public.inventory set quantity_available = quantity_available - item_record.quantity where product_id = item_record.id;
    end loop;

    insert into public.payments (
      order_id, provider, provider_order_id, provider_payment_id, payment_method,
      status, amount, currency, paid_at, metadata
    ) values (
      new_order.id, 'razorpay', razorpay_order_id, razorpay_payment_id, razorpay_payment_method,
      'paid', new_order.total_amount, new_order.currency, now(),
      jsonb_build_object('commission_rate_percent', 10, 'vendor_settlement', 'manual')
    );
    return next new_order;
  end loop;

  delete from public.cart_items where cart_id = cart;
end;
$$;

revoke execute on function public.razorpay_cart_quote(uuid, numeric) from public, anon, authenticated;
revoke execute on function public.place_paid_cart_order(uuid, jsonb, numeric, integer, text, text, text) from public, anon, authenticated;
grant execute on function public.razorpay_cart_quote(uuid, numeric) to service_role;
grant execute on function public.place_paid_cart_order(uuid, jsonb, numeric, integer, text, text, text) to service_role;
