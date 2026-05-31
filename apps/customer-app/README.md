# Sonman Customer App

Premium shopping mobile UI for Sonman customers, built with React Native,
Expo, and TypeScript.

## Included Screens

Splash, onboarding, login, signup, home, categories, product listing, product
details, cart, checkout, orders, and profile.

The initial UI remains available without fabricated catalog records. Connect
the screens to the shared backend API for live Supabase data.

## Run Locally

From the repository root:

```bash
corepack pnpm install
corepack pnpm --filter @sonman/customer-app start
```

Scan the QR code with Expo Go, or press `a` for an Android emulator. On macOS,
press `i` for the iOS simulator.

Run the TypeScript check with:

```bash
corepack pnpm --filter @sonman/customer-app typecheck
```
