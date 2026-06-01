create type public.product_approval_status as enum ('draft', 'pending_review', 'approved', 'rejected');

alter table public.vendors
  add column if not exists reviewed_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz;

alter table public.delivery_partners
  add column if not exists reviewed_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz;

alter table public.products
  add column if not exists approval_status public.product_approval_status not null default 'draft',
  add column if not exists reviewed_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz;

update public.products
set approval_status = case when is_active then 'approved'::public.product_approval_status else 'draft'::public.product_approval_status end,
    reviewed_at = case when is_active then updated_at else null end,
    approved_at = case when is_active then updated_at else null end
where approval_status = 'draft';

create index products_approval_status_idx on public.products (approval_status, created_at desc) where deleted_at is null;

create or replace function public.set_approval_audit_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.approval_status is distinct from old.approval_status then
    new.reviewed_at = now();
    new.approved_at = case when new.approval_status::text = 'approved' then now() else null end;
    new.rejected_at = case when new.approval_status::text = 'rejected' then now() else null end;
  end if;
  return new;
end;
$$;

create trigger vendors_set_approval_audit_timestamps
before update of approval_status on public.vendors
for each row execute function public.set_approval_audit_timestamps();
create trigger delivery_partners_set_approval_audit_timestamps
before update of approval_status on public.delivery_partners
for each row execute function public.set_approval_audit_timestamps();
create trigger products_set_approval_audit_timestamps
before update of approval_status on public.products
for each row execute function public.set_approval_audit_timestamps();

create or replace function public.submit_product_for_review()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.approval_status = 'pending_review';
    new.is_active = false;
  elsif row(new.name, new.category_id, new.description, new.price, new.currency, new.delivery_size)
      is distinct from row(old.name, old.category_id, old.description, old.price, old.currency, old.delivery_size) then
    new.approval_status = 'pending_review';
    new.is_active = false;
    new.reviewed_at = null;
    new.approved_at = null;
    new.rejected_at = null;
  elsif new.approval_status is distinct from old.approval_status or new.is_active is distinct from old.is_active then
    raise exception 'Only administrators may change product approval status';
  end if;
  return new;
end;
$$;

create trigger products_submit_for_review
before insert or update on public.products
for each row execute function public.submit_product_for_review();

drop policy if exists "products read active or owned" on public.products;
create policy "products read approved active or owned" on public.products for select using (
  (approval_status = 'approved' and is_active and deleted_at is null and exists (
    select 1 from public.vendors v where v.id = vendor_id and v.approval_status = 'approved'
  )) or vendor_id = public.current_vendor_id() or public.is_admin()
);

create or replace function public.require_orderable_product()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.products p
    join public.vendors v on v.id = p.vendor_id
    where p.id = new.product_id
      and p.approval_status = 'approved'
      and p.is_active
      and p.deleted_at is null
      and v.approval_status = 'approved'
  ) then
    raise exception 'Product is not approved for ordering';
  end if;
  return new;
end;
$$;

create trigger cart_items_require_orderable_product
before insert or update on public.cart_items
for each row execute function public.require_orderable_product();
create trigger order_items_require_orderable_product
before insert or update of product_id on public.order_items
for each row execute function public.require_orderable_product();

create or replace function public.admin_review_vendor(target_id uuid, next_status public.approval_status)
returns public.vendors
language plpgsql
security definer set search_path = ''
as $$
declare result public.vendors;
begin
  if not public.is_admin() then raise exception 'Administrator access is required'; end if;
  if next_status not in ('pending', 'approved', 'rejected') then raise exception 'Unsupported vendor approval status'; end if;
  update public.vendors set approval_status = next_status where id = target_id returning * into result;
  if result.id is null then raise exception 'Vendor not found'; end if;
  return result;
end;
$$;

create or replace function public.admin_review_delivery_partner(target_id uuid, next_status public.approval_status)
returns public.delivery_partners
language plpgsql
security definer set search_path = ''
as $$
declare result public.delivery_partners;
begin
  if not public.is_admin() then raise exception 'Administrator access is required'; end if;
  if next_status not in ('pending', 'approved', 'rejected') then raise exception 'Unsupported delivery partner approval status'; end if;
  update public.delivery_partners set approval_status = next_status where id = target_id returning * into result;
  if result.id is null then raise exception 'Delivery partner not found'; end if;
  return result;
end;
$$;

create or replace function public.admin_review_product(target_id uuid, next_status public.product_approval_status)
returns public.products
language plpgsql
security definer set search_path = ''
as $$
declare result public.products;
begin
  if not public.is_admin() then raise exception 'Administrator access is required'; end if;
  update public.products
  set approval_status = next_status,
      is_active = next_status = 'approved'
  where id = target_id
  returning * into result;
  if result.id is null then raise exception 'Product not found'; end if;
  return result;
end;
$$;

revoke execute on function public.admin_review_vendor(uuid, public.approval_status) from public;
revoke execute on function public.admin_review_delivery_partner(uuid, public.approval_status) from public;
revoke execute on function public.admin_review_product(uuid, public.product_approval_status) from public;
grant execute on function public.admin_review_vendor(uuid, public.approval_status) to authenticated;
grant execute on function public.admin_review_delivery_partner(uuid, public.approval_status) to authenticated;
grant execute on function public.admin_review_product(uuid, public.product_approval_status) to authenticated;
