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

## UPI Payment

The customer app expects the authenticated API to expose:

```text
POST /api/v1/payments/upi/manual-confirm
```

Checkout opens the Android UPI intent with the configured merchant UPI ID. After
the user returns, the app shows a payment confirmation screen. "I have paid"
creates the order through `public.place_upi_manual_cart_order(...)` with
`payment_gateway = upi_manual` and `payment_status = pending_verification`.

Configure the Expo public payment variables before building:

```text
EXPO_PUBLIC_SONMAN_UPI_ID=yourupi@bank
EXPO_PUBLIC_PAYMENT_GATEWAY=upi
```
