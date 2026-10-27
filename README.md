# BrokerProcess

A demo of policy schedule processing for an insurance broker. You upload a messy Excel or CSV policy schedule. The app cleans it up, lets an operations manager approve renewals and claim payouts, and shows reports on the cleaned data. You can export the cleaned data and filtered views as styled Excel files.

**Stack:** React 19 + Vite + Tailwind CSS · Vercel serverless functions (Node) · Supabase (Postgres)

## What it does

| Page | What happens there |
|---|---|
| **Dashboard** | Summary cards (total policies, pending renewals, approved this month, pending claims) and recent renewal and claim activity. |
| **Upload Schedule** | Upload an `.xlsx`, `.xls` or `.csv` file (max 10 MB). Rows are stored exactly as they appear in the file. You can also **clear all existing data** here before uploading again. |
| **Review** | **Before** shows the raw uploaded values. Click **Clean Data** to run the cleaning rules, then see the results under **After**. |
| **Renewals → Upcoming** | Policies with status "Pending Renewal" that expire within 30, 60 or 90 days. Policies expiring within **14 days** get Approve/Reject buttons; later ones show "Not yet actionable". Policies whose expiry date couldn't be read are always listed, marked "Needs attention". |
| **Renewals → History** | Renewals filtered by status (pending, approved or rejected) and month, with an Excel export. |
| **Claims → Pending** | Claims that have both a reported claim and a claim amount, with Approve/Reject buttons. |
| **Claims → History** | Claims filtered by status and month. |
| **Reports** | Charts of loss ratio, payment status, renewals by month and claims by division, plus **Export Cleaned Schedule**. |

The **Role** selector in the header switches between **Ops Manager** and **Viewer**. Only the Ops Manager sees the Approve/Reject buttons. It's a demo toggle, not real access control.

### Expected file layout

The app reads the first row of every sheet as column headings, so put all the data on one sheet. Headings are matched without regard to case or punctuation (`Policy No.`, `POLICY NO` and `policy_no` all work). The app reads these columns and ignores any others:

`Client Name` · `Policy No` · `Division` · `Policy Type` · `Premium` · `Underwriter` · `Policy Expiry Date` · `Renewal Status` · `Payment Status` · `Claims Reported` · `Claim Amount` · `Claim Description` · `Loss Ratio`

### Cleaning rules

The rules are in [`lib/cleaner.js`](lib/cleaner.js). Raw values are kept, and cleaned values are stored in separate columns alongside them.

- **Premium and claim amount:** currency symbols, `NGN`, commas and spaces are removed (`₦1,250,000` → `1250000`). Anything that still isn't a number is left empty.
- **Expiry date:** five formats are accepted: `15/11/2026`, `11-20-2026` (month first), `5 Dec 2026`, `2026-12-31` and `10.01.27`. An impossible day rolls over into the next month (`31/02/2027` → 3 Mar 2027). Anything else is left empty.
- **Statuses:** trimmed and title-cased (`PENDING RENEWAL` → `Pending Renewal`). `N/A` is left empty.
- **Loss ratio:** `34.5%` → 34.5, and a decimal like `0.42` → 42.
- **Division:** "and" becomes "&" and variants map to the five standard divisions (`construction/engineering` → Construction & Engineering). Unknown divisions are title-cased.
- **Duplicates:** if a client name and policy number appear again (ignoring case and spaces), every repeat after the first is marked `duplicate` and left out of the approval lists.
- **Days to expiry:** calculated from **the date you click Clean Data** and saved. To bring it up to date later, click Clean Data again.

## How it fits together

```
Browser (React SPA)
  ├─ parses uploaded .xlsx/.xls/.csv with SheetJS
  ├─ builds Excel exports with ExcelJS
  └─ calls /api/*  ──►  api/router.js (one Vercel function)  ──►  Supabase
```

- `api/router.js`: handles every `/api/*` route. `vercel.json` sends all API paths to it.
- `lib/policies.js`: the route handlers (queries, approvals, report figures, keep-alive)
- `lib/cleaner.js`: the data cleaning rules
- `supabase/schema.sql`: the database table
- `test-data/brokerprocess_test_schedule.xlsx`: a sample schedule for testing (see below)

The Supabase secret key is only used on the server. Row Level Security is on with no policies, so the browser can't reach the table directly.

## Setup

1. Create a Supabase project and run `supabase/schema.sql` in the SQL Editor.
2. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   The dev server also serves `/api/*` through the same handler that runs on Vercel, so you don't need the Vercel CLI.

## How to test

### With the sample file

[`test-data/brokerprocess_test_schedule.xlsx`](test-data/brokerprocess_test_schedule.xlsx) has 24 policies built to exercise every cleaning rule. Its last column, **Test Note**, explains what each row checks. The app ignores that column when uploading.

1. **Start clean.** On **Upload Schedule**, click **Clear all existing data** so earlier uploads don't affect the counts.
2. **Upload** the sample file. You should see "File uploaded and parsed successfully" with **24** records.
3. **Review → Before:** the raw values appear exactly as typed, e.g. `NGN 120,500,000.00`, `11-20-2026`, `oil and gas`.
4. Click **Clean Data**, then open **After** and spot-check these rows:

   | Row | Raw value | Expected after cleaning |
   |---|---|---|
   | Seplat Energy | `NGN 120,500,000.00`, `11-20-2026`, `0.42`, `oil and gas` | 120500000, 20 Nov 2026, 42, Oil & Gas |
   | Arik Air | `10.01.27`, `0.141` | 10 Jan 2027, 14.1 |
   | Julius Berger | `31/02/2027`, `construction/engineering` | 3 Mar 2027, Construction & Engineering |
   | Total Energies | `N/A` premium, `TBC` date | both empty |
   | Lagos State Govt | `public sector` | Public Sector |
   | Notore Chemicals | `1,2,3,4` premium | 1234 |
   | Dangote Refinery (rows 19 and 20) | repeats of row 1, one in lower case with extra spaces | both marked as duplicates |
   | Transcorp Hotels | a real Excel date cell | 10 Dec 2026 |

5. **Claims → Pending:** **8** claims (Seplat, Oando, Arik Air, Julius Berger, CCECC, Nestle, MTN, Lagos State). Ocean Marine reported a claim with no amount, so it must **not** appear. Approve one and reject another. Each row turns green or red and then disappears. Both should then show up under **Claims → History** with the matching status.
6. **Renewals → Upcoming:** check that the two Dangote duplicates, the lapsed Air Peace policy and the renewed policies don't appear. Bua Cement has an invalid date (`13/13/2026`), so it always appears, marked "Needs attention". Approve or reject one of the policies that has buttons, then find it under **Renewals → History** and try **Export**.
7. **Role check:** switch the Role to **Viewer**. The Action column disappears from both approval pages.
8. **Reports:** the charts load, and **Export Cleaned Schedule** downloads an `.xlsx` file.
9. **Dashboard:** the cards reflect what you just did. Total Policies is 24, and the pending counts go down after each approval.

#### Expected numbers

The sample file's expiry dates are fixed, but days to expiry depend on when you click Clean Data. The renewal numbers below are correct when the data is cleaned on **27 Oct 2026**. On a later date, more policies fall inside each window and expired ones drop to negative days. The claim and duplicate counts don't depend on the date.

| Check | Expected |
|---|---|
| Records uploaded | 24 |
| Pending claims | 8 |
| Duplicates flagged | 2 |
| Pending renewals (Dashboard card, any date) | 17 |
| Upcoming renewals: 30 / 60 / 90 days | 5 / 12 / 15 (each includes Bua Cement) |
| Rows with Approve/Reject (14 days or fewer) | CCECC Nigeria (11 days), Zenith Bank (6 days) |

### With your own file

Any `.xlsx`, `.xls` or `.csv` file works as long as it uses the headings listed under [Expected file layout](#expected-file-layout). Clear the existing data first if you want clean numbers.

### Checking the database keep-alive

See [Keeping the Supabase project awake](#keeping-the-supabase-project-awake).

## Deploy to Vercel

1. Push the project to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repo. Vercel detects the Vite preset automatically.
3. Under **Environment Variables**, add `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `CRON_SECRET` (any long random string).
4. Click **Deploy**.

## Keeping the Supabase project awake

Supabase pauses free-tier projects after a week with no activity. A Vercel cron job (set in `vercel.json`) calls `/api/cron/keep-alive` at 09:00 UTC every 3 days. The route counts the rows in the table and changes nothing. When `CRON_SECRET` is set, Vercel sends it automatically, and any request without it gets a 401.

To check it's working:

- **In Vercel:** go to **Settings → Cron Jobs**, click **Run**, then **View Logs**. You should see a 200 status.
- **By hand:**

  ```bash
  curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/cron/keep-alive
  ```

  The response should be `{"ok":true,...}`. Without the header, the response should be 401. (On Windows PowerShell, type `curl.exe`.)
- **In Supabase:** under **Logs**, the API logs show a request to `policy_schedules` every 3 days.

If you add `CRON_SECRET` after deploying, redeploy so the new value takes effect.
