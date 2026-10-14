# ASUR — storefront + admin

Next.js 16 storefront for ASUR gym apparel, with an admin portal for managing the catalogue and stock. Data lives in SQLite via Prisma.

## Setup

```bash
npm install
cp .env.example .env        # then set ADMIN_PASSWORD and SESSION_SECRET (openssl rand -hex 32)
npm run db:migrate          # creates prisma/dev.db
npm run db:seed             # Oversized Tees + Sleeveless sample catalogue (wipes catalogue tables)
npm run dev
```

- Store: http://localhost:3000
- Admin: http://localhost:3000/admin (sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

## Admin portal

| Page | What it does |
| --- | --- |
| **Products → Add product** | Name, description, specs, images (upload or URL, drag to reorder, first = cover), then pick colours × sizes and **Generate variants** — each variant gets an auto SKU and a unique EAN-13 barcode. Save as draft or publish. |
| **Categories** | Create / edit / delete categories with a cover image. Categories with products can't be deleted. |
| **Inventory → Stock levels** | Every variant with on-hand stock, low/sold-out filters, quick ±1, and an **Adjust** drawer (restock, return, sale, damage, count correction) that logs a reason. Scan a barcode to jump straight to a variant. Full history per variant. |
| **Inventory → Barcodes & labels** | Choose label quantities (or "qty = stock"), preview, and print 50×30 mm labels (A4 sheet or thermal printer). Includes a scan-to-check box. |

Barcodes use the GS1 restricted-circulation prefix `2xx`, meant for in-store use. Replace them with GS1-issued codes if you sell through retailers who require them.

## Notes

- Uploaded images are saved to `storage/uploads/` and served from `/media/…`. On serverless hosting (e.g. Vercel) the filesystem isn't persistent — swap `src/lib/server/storage.ts` + the upload route for S3/R2/Cloudinary, and SQLite for Postgres.
- Orders, dispatch and the dashboard metrics still use mock data in `src/lib/data.ts`.
