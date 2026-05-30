# Backend

Shared API service for Sonman applications.

## Planned Responsibilities

- Validate authenticated requests using Supabase Auth
- Read and write PostgreSQL data
- Coordinate Supabase Storage operations
- Send push notifications through Firebase Cloud Messaging
- Expose APIs consumed by mobile applications and the admin panel

## Configuration

Use `.env.example` as the template for local environment values. Keep privileged
credentials such as the Supabase service role key and Firebase private key only
in server-side environments.
