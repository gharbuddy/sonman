create extension if not exists pgcrypto;

create type public.user_role as enum ('customer', 'vendor', 'delivery_partner', 'admin');
create type public.approval_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.delivery_availability as enum ('offline', 'available', 'busy');
create type public.order_status as enum (
  'pending', 'accepted', 'packed', 'ready_for_pickup',
  'picked_up', 'out_for_delivery', 'delivered'
);
create type public.payment_status as enum ('pending', 'authorized', 'captured', 'failed', 'cancelled', 'refunded');
create type public.delivery_assignment_status as enum ('assigned', 'accepted', 'picked_up', 'delivered', 'rejected', 'cancelled');
create type public.notification_channel as enum ('in_app', 'push', 'both');
create type public.notification_delivery_status as enum ('pending', 'sent', 'failed');

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'customer',
  email text,
  phone text,
  full_name text not null default '',
  avatar_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_contact_required check (email is not null or phone is not null)
);
create unique index users_email_unique on public.users (lower(email)) where email is not null;
create unique index users_phone_unique on public.users (phone) where phone is not null;
create index users_active_role_idx on public.users (role) where is_active;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  default_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  business_name text not null,
  description text,
  business_address jsonb not null,
  approval_status public.approval_status not null default 'pending',
  is_open boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vendors_operational_idx on public.vendors (approval_status, is_open);
create index vendors_business_name_idx on public.vendors (lower(business_name));

create table public.delivery_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  vehicle_type text,
  vehicle_number text,
  approval_status public.approval_status not null default 'pending',
  availability_status public.delivery_availability not null default 'offline',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index delivery_partners_operational_idx on public.delivery_partners (approval_status, availability_status);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_parent_sort_idx on public.categories (parent_id, sort_order);
create index categories_active_idx on public.categories (is_active);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id),
  category_id uuid not null references public.categories(id),
  name text not null,
  slug text not null,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  currency char(3) not null,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index products_vendor_slug_unique on public.products (vendor_id, slug) where deleted_at is null;
create index products_vendor_active_idx on public.products (vendor_id, is_active) where deleted_at is null;
create index products_category_active_idx on public.products (category_id, is_active) where deleted_at is null;

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index product_images_product_sort_idx on public.product_images (product_id, sort_order);
create unique index product_images_one_primary_idx on public.product_images (product_id) where is_primary;

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references public.products(id) on delete cascade,
  quantity_available integer not null default 0 check (quantity_available >= 0),
  quantity_reserved integer not null default 0 check (quantity_reserved >= 0),
  low_stock_threshold integer not null default 0 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now(),
  constraint inventory_reserved_within_available check (quantity_reserved <= quantity_available)
);
create index inventory_quantity_available_idx on public.inventory (quantity_available);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.customers(id),
  vendor_id uuid not null references public.vendors(id),
  status public.order_status not null default 'pending',
  currency char(3) not null,
  subtotal_amount numeric(12, 2) not null check (subtotal_amount >= 0),
  delivery_fee_amount numeric(12, 2) not null default 0 check (delivery_fee_amount >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  delivery_address jsonb not null,
  customer_notes text,
  placed_at timestamptz,
  cancelled_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_customer_created_idx on public.orders (customer_id, created_at desc);
create index orders_vendor_status_created_idx on public.orders (vendor_id, status, created_at desc);
create index orders_status_created_idx on public.orders (status, created_at);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  provider text not null,
  provider_payment_id text,
  status public.payment_status not null default 'pending',
  amount numeric(12, 2) not null check (amount >= 0),
  currency char(3) not null,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_created_idx on public.payments (order_id, created_at desc);
create unique index payments_provider_id_unique on public.payments (provider, provider_payment_id) where provider_payment_id is not null;
create index payments_status_idx on public.payments (status);

create table public.delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  delivery_partner_id uuid not null references public.delivery_partners(id),
  status public.delivery_assignment_status not null default 'assigned',
  proof_path text,
  assigned_at timestamptz not null default now(),
  accepted_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index delivery_assignments_order_created_idx on public.delivery_assignments (order_id, created_at desc);
create index delivery_assignments_partner_status_idx on public.delivery_assignments (delivery_partner_id, status, assigned_at desc);
create unique index delivery_assignments_active_order_idx on public.delivery_assignments (order_id)
where status in ('assigned', 'accepted', 'picked_up');

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  order_item_id uuid not null unique references public.order_items(id),
  product_id uuid not null references public.products(id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reviews_product_visible_created_idx on public.reviews (product_id, is_visible, created_at desc);
create index reviews_customer_created_idx on public.reviews (customer_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  channel public.notification_channel not null default 'in_app',
  delivery_status public.notification_delivery_status not null default 'pending',
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
create index notifications_delivery_idx on public.notifications (delivery_status, created_at);

create trigger users_set_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger vendors_set_updated_at before update on public.vendors for each row execute function public.set_updated_at();
create trigger delivery_partners_set_updated_at before update on public.delivery_partners for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger inventory_set_updated_at before update on public.inventory for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger delivery_assignments_set_updated_at before update on public.delivery_assignments for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews for each row execute function public.set_updated_at();
