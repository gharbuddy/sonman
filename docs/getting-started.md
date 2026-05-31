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

## Implementation Bootstrap

The Supabase schema and initial backend API have been generated. Continue by:

1. Bootstrap each mobile directory with the current Expo tooling and keep the
   Expo-supported React and React Native dependency versions together.
2. Bootstrap the admin panel as a Next.js 15 TypeScript application.
3. Connect client screens to the shared backend routes.
4. Add payment-provider webhooks and server-owned checkout transactions.
5. Add Firebase device-token registration and notification delivery.
