# Supabase Setup

The migration files in `migrations/` are the source of truth for the initial
Sonman database. Apply them to a Supabase project with the Supabase CLI or from
CI.

```bash
supabase link --project-ref your-project-ref
supabase db push
```

## Authentication

Enable Email authentication in the Supabase dashboard. A database trigger
creates the matching `public.users` row after signup. New accounts may request
`customer`, `vendor`, or `delivery_partner`; `admin` can only be assigned from
a privileged server environment.

Vendor and delivery-partner accounts must submit their role-specific profile
to the backend after signup. Approval remains an admin-only operation.

## Storage

The migrations provision:

- `product-images`: public reads, vendor-owned writes
- `delivery-proofs`: private, delivery-partner-owned objects
- `vendor-documents`: private, vendor-owned objects

Object names must begin with the owning vendor or delivery-partner UUID:
`<owner-id>/<filename>`.
