# Kadoze Cloudflare Worker

Small backend for collecting onboarding submissions from the Expo app.

## Endpoints

- `GET /health`
- `POST /api/onboarding`

## Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create the D1 database:

   ```sh
   npx wrangler d1 create kadoze
   ```

3. Copy the returned `database_id` into `wrangler.toml`.

4. Apply the migration:

   ```sh
   npm run db:migrate
   ```

5. Deploy:

   ```sh
   npm run deploy
   ```

6. Add the deployed Worker URL to the Expo app env:

   ```sh
   EXPO_PUBLIC_CLOUDFLARE_WORKER_URL="https://kadoze.your-subdomain.workers.dev"
   ```
