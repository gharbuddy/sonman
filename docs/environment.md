# Environment Configuration

Each project owns an `.env.example` file containing only names and development
defaults. Create local `.env` or `.env.local` files as required by each
framework. Do not commit secrets.

## Client-Safe Values

Values prefixed with `EXPO_PUBLIC_` or `NEXT_PUBLIC_` are embedded in client
applications and must be treated as public. Use them only for public endpoints
and Supabase publishable configuration.

| Value | Used by |
| --- | --- |
| API URL | All applications |
| Supabase URL | All applications |
| Supabase anonymous key | All applications |
| Firebase project ID | Expo mobile applications |

## Server-Only Values

The backend environment contains privileged values:

| Value | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged Supabase operations |
| `FCM_CLIENT_EMAIL` | Firebase service account identity |
| `FCM_PRIVATE_KEY` | Firebase service account private key |

Never copy server-only values into an application environment file.

## Firebase Private Key Formatting

Environment providers often store multiline private keys with escaped newline
characters. Normalize the value in backend code when Firebase initialization is
implemented.
