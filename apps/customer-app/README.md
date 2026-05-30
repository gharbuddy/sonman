# Sonman Customer App

Premium shopping mobile UI for Sonman customers, built with React Native,
Expo, and TypeScript.

## Included Screens

Splash, onboarding, login, signup, home, categories, product listing, product
details, cart, checkout, orders, and profile.

The initial implementation uses dummy catalog data and local UI state only.
Backend integration is intentionally out of scope.

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
