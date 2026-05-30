# Sonman

Sonman is a multi-application platform organized as a monorepo. The customer
mobile application now includes its initial Expo UI. Other applications remain
configuration placeholders.

## Projects

| Path | Purpose | Planned stack |
| --- | --- | --- |
| `apps/customer-app` | Customer mobile application | React Native with Expo |
| `apps/vendor-app` | Vendor mobile application | React Native with Expo |
| `apps/delivery-app` | Delivery partner mobile application | React Native with Expo |
| `apps/admin-panel` | Administrative web application | Next.js 15 with TypeScript |
| `services/backend` | Shared API service | Node.js, Express, and TypeScript |

## Platform Services

- PostgreSQL for relational data
- Supabase Auth for identity and access management
- Supabase Storage for uploaded assets
- Firebase Cloud Messaging for push notifications

## Documentation

- [Architecture](docs/architecture.md)
- [Environment configuration](docs/environment.md)
- [Getting started](docs/getting-started.md)

## Current Scope

The customer application includes frontend-only shopping screens with dummy
data and local navigation. Database migrations, backend integrations, and
deployment manifests remain out of scope.

## Run Customer App

```bash
corepack pnpm install
corepack pnpm --filter @sonman/customer-app start
```

See [customer app instructions](apps/customer-app/README.md) for emulator and
typecheck commands.
