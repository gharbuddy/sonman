# Getting Started

## Prerequisites

- Node.js 22 or newer
- pnpm 10
- Supabase project
- Firebase project with Cloud Messaging enabled

## Initial Setup

1. Enable the Node.js version declared in `.nvmrc`.
2. Install pnpm 10 if it is not already available.
3. Create local environment files from the relevant `.env.example` templates.
4. Provision Supabase and Firebase development resources.
5. Link the Supabase CLI and apply migrations with `supabase db push`.

## Remaining Integrations

The Supabase schema, authentication service, role-protected clients, and initial
backend API are in place. Continue by:

1. Connect operational client screens to the shared backend routes.
2. Add payment-provider webhooks and server-owned checkout transactions.
3. Add Firebase device-token registration and notification delivery.
