alter type public.order_status add value if not exists 'pending';
alter type public.order_status add value if not exists 'accepted';
alter type public.order_status add value if not exists 'packed';
alter type public.order_status add value if not exists 'picked_up';
