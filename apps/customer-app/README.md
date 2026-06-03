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

## Google Sign In

Enable the Google provider in Supabase Auth and add this mobile redirect URL to
the Supabase redirect allow list:

```text
sonman-customer://auth/callback
```

For Android, configure the Google OAuth client credentials in Supabase and use
the Android package name `com.sonman.customer`. The app uses the custom scheme
declared in `app.json`, opens the Supabase OAuth URL in a browser auth session,
and exchanges the callback code for a Supabase session.

## Paytm Checkout

The customer app expects the authenticated API to expose:

```text
POST /api/v1/payments/paytm/initiate
POST /api/v1/payments/paytm/verify
```

`initiate` returns `{ orderId, checkoutUrl }`. `verify` must validate Paytm's
checksum, confirm `TXN_SUCCESS` with Paytm, and only then call
`public.place_paid_cart_order(...)` using the service role. Apply
`supabase/migrations/202606020001_paytm_payments.sql` before enabling checkout.
Keep Paytm merchant secrets on the API server; never expose them through
`EXPO_PUBLIC_*` variables.
