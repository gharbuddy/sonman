-- Keep applied migration history immutable while replacing the active payment
-- routines with Paytm equivalents. The API must call these routines only after
-- validating Paytm's checksum and confirming TXN_SUCCESS with Paytm.
do $$
declare
  quote_definition text;
  order_definition text;
begin
  select pg_get_functiondef('public.razorpay_cart_quote(uuid,numeric)'::regprocedure)
  into quote_definition;
  execute replace(quote_definition, 'razorpay_cart_quote', 'paytm_cart_quote');

  select pg_get_functiondef('public.place_paid_cart_order(uuid,jsonb,numeric,integer,text,text,text)'::regprocedure)
  into order_definition;
  execute replace(
    replace(order_definition, 'razorpay_', 'paytm_'),
    '''razorpay''',
    '''paytm'''
  );
end;
$$;

drop function if exists public.razorpay_cart_quote(uuid, numeric);

revoke execute on function public.paytm_cart_quote(uuid, numeric) from public, anon, authenticated;
revoke execute on function public.place_paid_cart_order(uuid, jsonb, numeric, integer, text, text, text) from public, anon, authenticated;
grant execute on function public.paytm_cart_quote(uuid, numeric) to service_role;
grant execute on function public.place_paid_cart_order(uuid, jsonb, numeric, integer, text, text, text) to service_role;
