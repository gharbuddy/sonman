alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.vendors enable row level security;
alter table public.delivery_partners enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.delivery_assignments enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

create policy "users read own profile" on public.users for select using (id = auth.uid() or public.is_admin());
create policy "users update own profile" on public.users for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
create policy "customers manage own profile" on public.customers for all
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "vendors read approved or own" on public.vendors for select
  using (approval_status = 'approved' or user_id = auth.uid() or public.is_admin());
create policy "vendors update own profile" on public.vendors for update
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "delivery partners manage own profile" on public.delivery_partners for all
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "categories read active" on public.categories for select using (is_active or public.is_admin());
create policy "admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "products read active or owned" on public.products for select using (
  (is_active and deleted_at is null and exists (
    select 1 from public.vendors v where v.id = vendor_id and v.approval_status = 'approved'
  )) or vendor_id = public.current_vendor_id() or public.is_admin()
);
create policy "vendors manage own products" on public.products for all
  using (vendor_id = public.current_vendor_id() or public.is_admin())
  with check (vendor_id = public.current_vendor_id() or public.is_admin());
create policy "product images read visible products" on public.product_images for select using (
  exists (select 1 from public.products p where p.id = product_id)
);
create policy "vendors manage own product images" on public.product_images for all using (
  exists (select 1 from public.products p where p.id = product_id and (p.vendor_id = public.current_vendor_id() or public.is_admin()))
) with check (
  exists (select 1 from public.products p where p.id = product_id and (p.vendor_id = public.current_vendor_id() or public.is_admin()))
);
create policy "vendors read own inventory" on public.inventory for select using (
  exists (select 1 from public.products p where p.id = product_id and (p.vendor_id = public.current_vendor_id() or public.is_admin()))
);
create policy "vendors manage own inventory" on public.inventory for all using (
  exists (select 1 from public.products p where p.id = product_id and (p.vendor_id = public.current_vendor_id() or public.is_admin()))
) with check (
  exists (select 1 from public.products p where p.id = product_id and (p.vendor_id = public.current_vendor_id() or public.is_admin()))
);

create policy "actors read related orders" on public.orders for select using (
  customer_id = public.current_customer_id()
  or vendor_id = public.current_vendor_id()
  or exists (select 1 from public.delivery_assignments d where d.order_id = id and d.delivery_partner_id = public.current_delivery_partner_id())
  or public.is_admin()
);
create policy "actors read related order items" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id)
);
create policy "customers read own payments" on public.payments for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = public.current_customer_id() or public.is_admin()))
);
create policy "actors read related delivery assignments" on public.delivery_assignments for select using (
  delivery_partner_id = public.current_delivery_partner_id()
  or exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = public.current_customer_id() or o.vendor_id = public.current_vendor_id()))
  or public.is_admin()
);
create policy "delivery partners update own assignments" on public.delivery_assignments for update
  using (delivery_partner_id = public.current_delivery_partner_id() or public.is_admin())
  with check (delivery_partner_id = public.current_delivery_partner_id() or public.is_admin());
create policy "reviews read visible" on public.reviews for select using (is_visible or customer_id = public.current_customer_id() or public.is_admin());
create policy "customers create own reviews" on public.reviews for insert with check (customer_id = public.current_customer_id());
create policy "customers update own reviews" on public.reviews for update
  using (customer_id = public.current_customer_id() or public.is_admin())
  with check (customer_id = public.current_customer_id() or public.is_admin());
create policy "users read own notifications" on public.notifications for select using (user_id = auth.uid() or public.is_admin());
create policy "users mark own notifications read" on public.notifications for update
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('delivery-proofs', 'delivery-proofs', false),
  ('vendor-documents', 'vendor-documents', false)
on conflict (id) do update set public = excluded.public;

create policy "public reads product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "vendors manage product images" on storage.objects for all using (
  bucket_id = 'product-images'
  and (split_part(name, '/', 1) = public.current_vendor_id()::text or public.is_admin())
) with check (
  bucket_id = 'product-images'
  and (split_part(name, '/', 1) = public.current_vendor_id()::text or public.is_admin())
);
create policy "delivery partners manage own proofs" on storage.objects for all using (
  bucket_id = 'delivery-proofs'
  and (split_part(name, '/', 1) = public.current_delivery_partner_id()::text or public.is_admin())
) with check (
  bucket_id = 'delivery-proofs'
  and (split_part(name, '/', 1) = public.current_delivery_partner_id()::text or public.is_admin())
);
create policy "vendors manage own documents" on storage.objects for all using (
  bucket_id = 'vendor-documents'
  and (split_part(name, '/', 1) = public.current_vendor_id()::text or public.is_admin())
) with check (
  bucket_id = 'vendor-documents'
  and (split_part(name, '/', 1) = public.current_vendor_id()::text or public.is_admin())
);
