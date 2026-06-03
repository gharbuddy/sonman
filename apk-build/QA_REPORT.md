# Customer App Final MVP QA Report

Date: 2026-06-01

## Completed Fixes

- Google login now completes through the customer deep-link callback flow.
- Email signup passes the verification redirect and handles callback links.
- Push notification registration failures no longer surface as startup errors on unsupported devices.
- The home avatar opens the profile screen.
- Profile editing includes mobile number, gender, and date of birth.
- The profile overview and edit form use cleaner account-detail presentation.
- The Kashmir-themed splash screen shows the Sonman logo for at least three seconds.
- Splash copy includes "Vocal for Local" and "Support Kashmir Businesses".
- Product details use all configured product images in a swipeable carousel.
- Hard-coded S/M/L/XL options were removed.
- Variants only display when configured by a vendor; the vendor product form accepts optional comma-separated variants.
- Address entry uses state and district dropdowns.
- MVP delivery selection is limited to Jammu and Kashmir, Kulgam district.
- Help Centre opens a working support FAQ screen.
- Order History separates active and past delivered orders with working tabs.
- Customer UI received modernized typography, product discovery content, spacing, cards, search styling, buttons, and floating bottom navigation.

## Verification

Passed:

```text
corepack pnpm typecheck
corepack pnpm build
corepack pnpm --filter @sonman/customer-app exec expo export --platform android --output-dir .expo-export-check
git diff --check
```

## Deployment Note

Apply `supabase/migrations/202606010005_customer_mvp_profile_and_variants.sql` before releasing the updated apps. The linked Supabase CLI migration status check timed out in the QA environment, so remote application could not be confirmed here.

