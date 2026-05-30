# Getting Started

## Prerequisites

- Node.js 22 or newer
- pnpm 10
- PostgreSQL
- Supabase project
- Firebase project with Cloud Messaging enabled

## Initial Setup

1. Enable the Node.js version declared in `.nvmrc`.
2. Install pnpm 10 if it is not already available.
3. Create local environment files from the relevant `.env.example` templates.
4. Provision PostgreSQL, Supabase, and Firebase development resources.

## Implementation Bootstrap

Application code has intentionally not been generated. When implementation
starts:

1. Bootstrap each mobile directory with the current Expo tooling and keep the
   Expo-supported React and React Native dependency versions together.
2. Bootstrap the admin panel as a Next.js 15 TypeScript application.
3. Add Express and TypeScript dependencies to the backend service.
4. Select a PostgreSQL migration tool before creating the database schema.
5. Commit lockfile changes after dependency versions are selected.
