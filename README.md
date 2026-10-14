# ASUR — storefront + admin

Next.js 16 storefront for ASUR gym apparel, with an admin portal for managing the catalogue and stock. Data lives in Supabase Postgres via Prisma; images in Supabase Storage.

## Setup (Supabase)

The app uses **Supabase Postgres** (via Prisma) for all data and **Supabase Storage** for uploaded images. Requires Node 20+ (`nvm use` reads `.nvmrc`).

1. **Create a Supabase project** at supabase.com.
2. **Database URLs** — Dashboard → **Connect** → **ORMs → Prisma**. Copy both into `.env`:
   - `DATABASE_URL` — the pooled URL (port **6543**), keep `?pgbouncer=true&connection_limit=1`
   - `DIRECT_URL` — the direct/session URL (port **5432**), used only for migrations
3. **Storage** — Dashboard → **Storage** → **New bucket** named `media`, set it to **Public**.
   Then Settings → **API Keys** → copy the **secret** key into `SUPABASE_SECRET_KEY`, and the project URL into `SUPABASE_URL`.
   *(Leave these empty in local dev to save uploads to `./storage/uploads` instead.)*
4. **Admin login** — set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET` (`openssl rand -hex 32`).
5. Install, migrate, seed, run:

```bash
nvm use
npm install
npm run db:deploy     # creates all tables in Supabase (+ locks down the public API with RLS)
npm run db:seed       # sample catalogue + starter pages (dev/staging only — wipes the catalogue)
npm run dev
```

- Store: http://localhost:3000 · Admin: http://localhost:3000/admin

### Security notes
- The migration **enables Row Level Security on every table with no policies**. Supabase's auto-generated REST/GraphQL API (anon key) therefore can't read or write anything; the app talks to Postgres directly through Prisma as the database owner, which bypasses RLS. Don't add RLS policies unless you intend to expose a table publicly.
- `SUPABASE_SECRET_KEY` and the database password are **server-only**. Never prefix them with `NEXT_PUBLIC_`.

### Deploying (e.g. Vercel)
- Add every variable from `.env.example` to the host's environment settings.
- Run `npm run db:deploy` once per release (or as a build step) to apply new migrations.
- Changing the schema: edit `prisma/schema.prisma`, then `npm run db:migrate -- --name <change>` against a dev/branch database, commit the generated migration, and deploy.

## Admin portal

| Page | What it does |
| --- | --- |
| **Products → Add product** | Name, description, specs, images (upload or URL, drag to reorder, first = cover), then pick colours × sizes and **Generate variants** — each variant gets an auto SKU and a unique EAN-13 barcode. Save as draft or publish. |
| **Categories** | Create / edit / delete categories with a cover image. Categories with products can't be deleted. |
| **Inventory → Stock levels** | Every variant with on-hand stock, low/sold-out filters, quick ±1, and an **Adjust** drawer (restock, return, sale, damage, count correction) that logs a reason. Scan a barcode to jump straight to a variant. Full history per variant. |
| **Inventory → Barcodes & labels** | Choose label quantities (or "qty = stock"), preview, and print 50×30 mm labels (A4 sheet or thermal printer). Includes a scan-to-check box. |

Barcodes use the GS1 restricted-circulation prefix `2xx`, meant for in-store use. Replace them with GS1-issued codes if you sell through retailers who require them.

## Notes

- Orders, dispatch and the dashboard metrics still use mock data in `src/lib/data.ts`.
