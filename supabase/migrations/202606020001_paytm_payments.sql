drop function if exists public.razorpay_cart_quote(uuid, numeric);
drop function if exists public.place_paid_cart_order(uuid, jsonb, numeric, integer, text, text, text);

drop function if exists public.paytm_cart_quote(uuid, numeric);
drop function if exists public.place_paid_cart_order(uuid, jsonb, numeric, integer, text, text, text);

create or replace function public.paytm_cart_quote(
  target_customer_id uuid,
  checkout_distance_km numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select public.razorpay_cart_quote(target_customer_id, checkout_distance_km)
  into result;

  return result;
end;
$$;

create or replace function public.place_paid_cart_order(
  target_customer_id uuid,
  delivery_address jsonb,
  checkout_distance_km numeric,
  payment_amount integer,
  paytm_order_id text,
  paytm_txn_id text,
  payment_method text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
begin
  select public.place_razorpay_cart_order(
    target_customer_id,
    delivery_address,
    checkout_distance_km,
    payment_amount,
    paytm_order_id,
    paytm_txn_id,
    payment_method
  )
  into new_order_id;

  update public.payments
  set
    payment_gateway = 'paytm',
    paytm_order_id = place_paid_cart_order.paytm_order_id,
    paytm_txn_id = place_paid_cart_order.paytm_txn_id
  where order_id = new_order_id;

  return new_order_id;
end;
$$;

revoke execute on function public.paytm_cart_quote(uuid, numeric) from public, anon, authenticated;
revoke execute on function public.place_paid_cart_order(uuid, jsonb, numeric, integer, text, text, text) from public, anon, authenticated;

grant execute on function public.paytm_cart_quote(uuid, numeric) to service_role;
grant execute on function public.place_paid_cart_order(uuid, jsonb, numeric, integer, text, text, text) to service_role;
