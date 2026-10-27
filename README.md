# BrokerProcess

Policy schedule processing demo for an insurance broker: upload a messy Excel/CSV schedule, clean and normalise it, approve renewals and claim payouts, and view reports. Cleaned data and filtered views can be exported as styled Excel files.

**Stack:** React 19 + Vite + Tailwind CSS · Vercel serverless functions (Node) · Supabase (Postgres)

## How it fits together

```
Browser (React SPA)
  ├─ parses uploaded .xlsx/.xls/.csv with SheetJS
  ├─ builds Excel exports with ExcelJS
  └─ calls /api/*  ──►  api/router.js (one Vercel function)  ──►  Supabase
```

- `api/router.js`: every `/api/*` route; `vercel.json` rewrites all API paths to it
- `lib/policies.js`: route handlers (queries, approvals, report aggregation)
- `lib/cleaner.js`: data cleaning rules (premiums, dates, statuses, loss ratios, divisions, duplicates)
- `supabase/schema.sql`: database table

The Supabase secret key is only used server-side. Row Level Security is on with no policies, so the table can't be reached from the browser directly.

## Setup

1. Create a Supabase project and run `supabase/schema.sql` in the SQL Editor.
2. Copy `.env.example` to `.env` and fill in `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   The dev server also serves `/api/*` through the same handler that runs on Vercel, so no Vercel CLI is needed.

## Deploy to Vercel

1. Push the project to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repo. The Vite preset is detected automatically.
3. Under **Environment Variables**, add `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
4. Click **Deploy**.
