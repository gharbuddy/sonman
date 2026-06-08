do $$
begin
  if not exists (select 1 from pg_type where typname = 'coupon_discount_type') then
    create type public.coupon_discount_type as enum ('fixed', 'percentage');
  end if;
end $$;

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type public.coupon_discount_type not null,
  discount_value numeric(12, 2) not null,
  minimum_order_amount numeric(12, 2) not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_code_uppercase check (code = upper(code) and length(trim(code)) between 3 and 40),
  constraint coupons_minimum_order_amount_nonnegative check (minimum_order_amount >= 0),
  constraint coupons_discount_value_valid check (
    (discount_type = 'fixed' and discount_value > 0)
    or
    (discount_type = 'percentage' and discount_value > 0 and discount_value <= 100)
  )
);

create index if not exists coupons_active_code_idx on public.coupons (code) where is_active = true;
create index if not exists coupons_expires_at_idx on public.coupons (expires_at);

create or replace function public.set_coupons_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists coupons_set_updated_at on public.coupons;
create trigger coupons_set_updated_at
before update on public.coupons
for each row execute function public.set_coupons_updated_at();

create or replace function public.validate_coupon(input_code text, order_subtotal numeric)
returns table (
  id uuid,
  code text,
  discount_type public.coupon_discount_type,
  discount_value numeric,
  minimum_order_amount numeric,
  expires_at timestamptz,
  discount_amount numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_coupon public.coupons%rowtype;
  normalized_code text := upper(trim(input_code));
  safe_subtotal numeric := greatest(coalesce(order_subtotal, 0), 0);
begin
  if normalized_code = '' then
    raise exception 'Enter a coupon code.';
  end if;

  select *
    into selected_coupon
    from public.coupons c
    where c.code = normalized_code
    limit 1;

  if selected_coupon.id is null then
    raise exception 'Coupon code was not found.';
  end if;

  if not selected_coupon.is_active then
    raise exception 'This coupon is not active.';
  end if;

  if selected_coupon.expires_at is not null and selected_coupon.expires_at < now() then
    raise exception 'This coupon has expired.';
  end if;

  if safe_subtotal < selected_coupon.minimum_order_amount then
    raise exception 'Minimum order amount for this coupon is Rs %.', selected_coupon.minimum_order_amount;
  end if;

  return query
  select
    selected_coupon.id,
    selected_coupon.code,
    selected_coupon.discount_type,
    selected_coupon.discount_value,
    selected_coupon.minimum_order_amount,
    selected_coupon.expires_at,
    case
      when selected_coupon.discount_type = 'percentage'
        then least(safe_subtotal, round((safe_subtotal * selected_coupon.discount_value) / 100))
      else least(safe_subtotal, round(selected_coupon.discount_value))
    end as discount_amount;
end;
$$;

alter table public.coupons enable row level security;

revoke all on public.coupons from anon, authenticated;
grant execute on function public.validate_coupon(text, numeric) to authenticated;

alter table if exists public.orders
  add column if not exists coupon_id uuid references public.coupons(id),
  add column if not exists coupon_code text,
  add column if not exists discount_amount numeric(12, 2) not null default 0;

create index if not exists orders_coupon_id_idx on public.orders (coupon_id);
