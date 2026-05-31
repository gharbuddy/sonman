create type public.push_platform as enum ('android', 'ios', 'web');
create type public.push_app as enum ('customer', 'vendor', 'delivery');

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null,
  platform public.push_platform not null,
  app public.push_app not null,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (token, app)
);
create index push_tokens_user_active_idx on public.push_tokens (user_id, is_active);

create table public.notification_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  push_enabled boolean not null default true,
  order_updates_enabled boolean not null default true,
  new_orders_enabled boolean not null default true,
  delivery_assignments_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger push_tokens_set_updated_at before update on public.push_tokens
for each row execute function public.set_updated_at();
create trigger notification_preferences_set_updated_at before update on public.notification_preferences
for each row execute function public.set_updated_at();

alter table public.push_tokens enable row level security;
alter table public.notification_preferences enable row level security;

create policy "users read own push tokens" on public.push_tokens for select
  using (user_id = auth.uid() or public.is_admin());
create policy "users manage own notification preferences" on public.notification_preferences for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create or replace function public.register_push_token(
  device_token text,
  token_platform public.push_platform,
  token_app public.push_app
)
returns public.push_tokens
language plpgsql
security definer set search_path = ''
as $$
declare
  saved_token public.push_tokens;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  if device_token is null or btrim(device_token) = '' then raise exception 'Push token is required'; end if;

  insert into public.notification_preferences (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  insert into public.push_tokens (user_id, token, platform, app)
  values (auth.uid(), device_token, token_platform, token_app)
  on conflict (token, app) do update
  set user_id = excluded.user_id,
      platform = excluded.platform,
      is_active = true,
      last_seen_at = now()
  returning * into saved_token;

  return saved_token;
end;
$$;

create or replace function public.deactivate_push_token(device_token text, token_app public.push_app)
returns void
language sql
security definer set search_path = ''
as $$
  update public.push_tokens
  set is_active = false
  where user_id = auth.uid() and token = device_token and app = token_app;
$$;

revoke execute on function public.register_push_token(text, public.push_platform, public.push_app) from public;
revoke execute on function public.deactivate_push_token(text, public.push_app) from public;
grant execute on function public.register_push_token(text, public.push_platform, public.push_app) to authenticated;
grant execute on function public.deactivate_push_token(text, public.push_app) to authenticated;

create or replace function public.create_order_notifications()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  customer_user_id uuid;
  vendor_user_id uuid;
  notification_title text;
  notification_body text;
begin
  select user_id into customer_user_id from public.customers where id = new.customer_id;
  select user_id into vendor_user_id from public.vendors where id = new.vendor_id;

  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, type, title, body, data, channel)
    values (
      customer_user_id, 'customer.order_placed', 'Order placed',
      'Your order ' || new.order_number || ' has been placed.',
      jsonb_build_object('order_id', new.id, 'order_number', new.order_number, 'status', new.status),
      'both'
    );
    insert into public.notifications (user_id, type, title, body, data, channel)
    values (
      vendor_user_id, 'vendor.new_order', 'New order received',
      'A new order ' || new.order_number || ' is ready for review.',
      jsonb_build_object('order_id', new.id, 'order_number', new.order_number, 'status', new.status),
      'both'
    );
    return new;
  end if;

  if old.status = new.status then return new; end if;
  notification_title := case new.status
    when 'accepted' then 'Order accepted'
    when 'packed' then 'Order packed'
    when 'ready_for_pickup' then 'Ready for pickup'
    when 'out_for_delivery' then 'Out for delivery'
    when 'delivered' then 'Delivered'
    else null
  end;
  notification_body := case new.status
    when 'accepted' then 'Your order ' || new.order_number || ' has been accepted.'
    when 'packed' then 'Your order ' || new.order_number || ' has been packed.'
    when 'ready_for_pickup' then 'Your order ' || new.order_number || ' is ready for pickup.'
    when 'out_for_delivery' then 'Your order ' || new.order_number || ' is out for delivery.'
    when 'delivered' then 'Your order ' || new.order_number || ' has been delivered.'
    else null
  end;
  if notification_title is not null then
    insert into public.notifications (user_id, type, title, body, data, channel)
    values (
      customer_user_id, 'customer.order_' || new.status, notification_title, notification_body,
      jsonb_build_object('order_id', new.id, 'order_number', new.order_number, 'status', new.status),
      'both'
    );
  end if;
  return new;
end;
$$;

create or replace function public.create_delivery_assignment_notification()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  delivery_user_id uuid;
  assigned_order public.orders;
begin
  select user_id into delivery_user_id from public.delivery_partners where id = new.delivery_partner_id;
  select * into assigned_order from public.orders where id = new.order_id;
  insert into public.notifications (user_id, type, title, body, data, channel)
  values (
    delivery_user_id, 'delivery.new_assignment', 'New order assigned',
    'Order ' || assigned_order.order_number || ' has been assigned to you.',
    jsonb_build_object('order_id', assigned_order.id, 'order_number', assigned_order.order_number, 'assignment_id', new.id),
    'both'
  );
  return new;
end;
$$;

create trigger orders_create_notifications
after insert or update of status on public.orders
for each row execute function public.create_order_notifications();

create trigger delivery_assignments_create_notification
after insert on public.delivery_assignments
for each row execute function public.create_delivery_assignment_notification();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
