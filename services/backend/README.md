# Backend

Shared API service for Sonman applications.

## Responsibilities

- Validate authenticated requests using Supabase Auth
- Read and write PostgreSQL data
- Coordinate Supabase Storage operations
- Send push notifications through Firebase Cloud Messaging
- Expose APIs consumed by mobile applications and the admin panel

## API Structure

All application routes are versioned under `/api/v1`.

| Route | Purpose |
| --- | --- |
| `POST /auth/register` | Create customer, vendor, or delivery-partner Auth accounts |
| `POST /auth/login` | Create a role-qualified Supabase session |
| `GET /me` | Read the authenticated application profile |
| `POST /profiles/vendor` | Complete a vendor profile |
| `POST /profiles/delivery-partner` | Complete a delivery-partner profile |
| `GET /catalog/categories` | Read active categories |
| `GET /catalog/products` | Read live approved-vendor products |
| `GET /orders` | Read role-scoped orders |
| `GET /notifications` | Read the authenticated user's notifications |
| `PATCH /notifications/:id/read` | Mark a notification as read |
| `PATCH /admin/users/:id/role` | Privileged role assignment |

## Configuration

Use `.env.example` as the template for local environment values. Keep privileged
credentials such as the Supabase service role key and Firebase private key only
in server-side environments.

Login requests include `email`, `password`, and the target application `role`.
The API rejects valid credentials when the active profile does not match that
role.

## Push Notifications

The backend polls pending Supabase notification rows and sends Android push
notifications through Firebase Cloud Messaging. Configure `FCM_PROJECT_ID`,
`FCM_CLIENT_EMAIL`, and `FCM_PRIVATE_KEY` from a Firebase service account.
The worker remains disabled when credentials are absent, while in-app
notification history continues to work.

Each Expo app also needs its Firebase Android config file:

- `apps/customer-app/google-services.json`
- `apps/vendor-app/google-services.json`
- `apps/delivery-app/google-services.json`

These files are ignored by Git. Register the Android package names
`com.sonman.customer`, `com.sonman.vendor`, and `com.sonman.delivery` in the
Firebase project before creating development or production builds.
