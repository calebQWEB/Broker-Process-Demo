// Port of the Laravel PolicyScheduleController.

import { TABLE, db, fetchAll, unwrap } from "./supabase.js";
import { cleanRows, round } from "./cleaner.js";
import { HttpError } from "./http.js";

const UPLOAD_COLUMNS = {
    client_name: "client_name",
    policy_no: "policy_no",
    division: "division",
    policy_type: "policy_type",
    premium_raw: "premium",
    underwriter: "underwriter",
    policy_expiry_raw: "policy_expiry_date",
    renewal_status_raw: "renewal_status",
    payment_status_raw: "payment_status",
    claims_reported: "claims_reported",
    loss_ratio_raw: "loss_ratio",
    claim_amount_raw: "claim_amount",
    claim_description: "claim_description",
};

const DECIMAL_FIELDS = ["premium_cleaned", "loss_ratio_cleaned", "claim_amount_cleaned"];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Insert parsed spreadsheet rows. The browser parses the file and sends rows
 * keyed by slugged headings (e.g. "Policy Expiry Date" → policy_expiry_date).
 */
export async function upload({ body }) {
    if (!Array.isArray(body.rows) || body.rows.length === 0) {
        throw new HttpError(422, "The file has no data rows.");
    }

    const records = body.rows
        .map((row) =>
            Object.fromEntries(
                Object.entries(UPLOAD_COLUMNS).map(([column, heading]) => [
                    column,
                    toText(row[heading]),
                ]),
            ),
        )
        .filter((record) => Object.values(record).some((value) => value !== null));

    for (let i = 0; i < records.length; i += 500) {
        unwrap(await db().from(TABLE).insert(records.slice(i, i + 500)));
    }

    return {
        message: "File uploaded and parsed successfully.",
        count: await countAll(),
    };
}

/**
 * Return all rows (used for both the raw "Before" and cleaned "After" views).
 */
export async function listAll() {
    return serialize(await fetchAll(() => db().from(TABLE).select("*").order("id")));
}

/**
 * Run cleanup logic on all rows.
 */
export async function clean() {
    const rows = await fetchAll(() => db().from(TABLE).select("*").order("id"));
    const updates = cleanRows(rows);
    const now = new Date().toISOString();

    // Update in parallel batches to stay well inside the function time limit
    for (let i = 0; i < updates.length; i += 25) {
        await Promise.all(
            updates.slice(i, i + 25).map(async ({ id, changes }) =>
                unwrap(await db().from(TABLE).update({ ...changes, updated_at: now }).eq("id", id)),
            ),
        );
    }

    return { message: "Data cleaned successfully.", count: updates.length };
}

/**
 * Return cleaned policies pending renewal within a given day threshold.
 * Rows with an unparseable expiry date are always included (flagged),
 * since we can't judge them against a day threshold but they still need attention.
 */
export async function pendingRenewal({ query }) {
    const days = parseInt(query.days ?? "60", 10) || 0;

    const rows = await fetchAll(() =>
        db()
            .from(TABLE)
            .select("*")
            .eq("renewal_status_cleaned", "Pending Renewal")
            .eq("approval_status", "pending")
            .or(`days_to_expiry.is.null,days_to_expiry.lte.${days}`)
            .order("days_to_expiry", { ascending: true, nullsFirst: false })
            .order("id"),
    );

    return serialize(rows).map((policy) => ({
        ...policy,
        needs_attention: policy.days_to_expiry === null,
    }));
}

/**
 * Approve or reject a policy renewal.
 */
export async function reviewPolicy({ params: [id, action] }) {
    const policy = await updateById(id, {
        approval_status: action === "approve" ? "approved" : "rejected",
        reviewed_at: new Date().toISOString(),
    });

    return {
        message: action === "approve" ? "Policy approved." : "Policy rejected.",
        policy,
    };
}

/**
 * Return aggregated summary data for the reports page.
 */
export async function summary() {
    const all = await fetchAll(() => db().from(TABLE).select("*").order("id"));
    const now = new Date();

    const pendingClaimRows = all.filter((p) => p.claim_approval_status === "pending");

    const lossRatioByDivision = groupBy(
        all.filter((p) => p.division !== null),
        (p) => p.division,
    ).map(([division, group]) => ({
        division,
        avgLossRatio: round(average(group.map((p) => p.loss_ratio_cleaned)) ?? 0, 1),
    }));

    const paymentStatusBreakdown = groupBy(
        all.filter((p) => p.payment_status_cleaned !== null),
        (p) => p.payment_status_cleaned,
    ).map(([status, group]) => ({ status, count: group.length }));

    const renewalsByMonth = groupBy(
        all.filter(
            (p) => p.policy_expiry_cleaned !== null && p.renewal_status_cleaned === "Pending Renewal",
        ),
        (p) => {
            const [year, month] = p.policy_expiry_cleaned.split("-");
            return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
        },
    ).map(([month, group]) => ({ month, count: group.length }));

    const claimsByDivision = groupBy(
        all.filter((p) => p.claim_approval_status !== "not_applicable" && p.division !== null),
        (p) => p.division,
    )
        .map(([division, group]) => ({
            division,
            totalClaims: round(sum(group, "claim_amount_cleaned"), 2),
        }))
        .filter((entry) => entry.totalClaims > 0);

    return {
        stats: {
            totalPolicies: all.length,
            pendingRenewals: all.filter(
                (p) => p.renewal_status_cleaned === "Pending Renewal" && p.approval_status === "pending",
            ).length,
            approvedThisMonth: all.filter(
                (p) => p.approval_status === "approved" && p.reviewed_at && isSameUtcMonth(new Date(p.reviewed_at), now),
            ).length,
            totalPremium: round(sum(all, "premium_cleaned"), 2),
            pendingClaims: pendingClaimRows.length,
            totalClaimsValue: round(sum(pendingClaimRows, "claim_amount_cleaned"), 2),
        },
        lossRatioByDivision,
        paymentStatusBreakdown,
        renewalsByMonth,
        claimsByDivision,
    };
}

export async function renewalHistory({ query }) {
    const status = query.status ?? "pending";
    const range = monthRange(query.month);
    if (range === false) return [];

    const rows = await fetchAll(() => {
        let q = db().from(TABLE).select("*").eq("approval_status", status);

        if (status === "pending") {
            q = q.eq("renewal_status_cleaned", "Pending Renewal");

            if (range) {
                q = q.gte("policy_expiry_cleaned", range.start).lt("policy_expiry_cleaned", range.end);
            }

            return q.order("days_to_expiry", { ascending: true, nullsFirst: false }).order("id");
        }

        q = q.not("reviewed_at", "is", null);

        if (range) {
            q = q.gte("reviewed_at", `${range.start}T00:00:00Z`).lt("reviewed_at", `${range.end}T00:00:00Z`);
        }

        return q.order("reviewed_at", { ascending: false }).order("id");
    });

    return serialize(rows);
}

/**
 * Rows for the status export (the spreadsheet itself is built in the browser).
 */
export async function exportByStatus({ query }) {
    const status = query.status ?? "pending";
    const range = monthRange(query.month);
    if (range === false) return [];

    const rows = await fetchAll(() => {
        let q = db().from(TABLE).select("*").eq("approval_status", status);

        if (range) {
            q = status === "pending"
                ? q.gte("policy_expiry_cleaned", range.start).lt("policy_expiry_cleaned", range.end)
                : q.gte("reviewed_at", `${range.start}T00:00:00Z`).lt("reviewed_at", `${range.end}T00:00:00Z`);
        }

        return q.order("policy_expiry_cleaned", { ascending: true, nullsFirst: true }).order("id");
    });

    return serialize(rows);
}

/**
 * Delete all policy schedule data (full reset).
 */
export async function clearAll() {
    const count = await countAll();
    unwrap(await db().from(TABLE).delete().not("id", "is", null));

    return { message: "All data cleared successfully.", count };
}

/**
 * Called by Vercel Cron (see vercel.json). A light query every few days stops
 * Supabase pausing the free-tier project after a week of inactivity.
 * When CRON_SECRET is set, Vercel sends it as a Bearer token; reject anything else.
 */
export async function keepAlive({ headers }) {
    const secret = process.env.CRON_SECRET;
    if (secret && headers.authorization !== `Bearer ${secret}`) {
        throw new HttpError(401, "Unauthorized.");
    }

    return { ok: true, count: await countAll(), at: new Date().toISOString() };
}

/**
 * Return policies with a pending claim payout decision.
 */
export async function pendingClaims() {
    const rows = await fetchAll(() =>
        db()
            .from(TABLE)
            .select("*")
            .eq("claim_approval_status", "pending")
            .order("claim_amount_cleaned", { ascending: false, nullsFirst: false })
            .order("id"),
    );

    return serialize(rows);
}

/**
 * Approve or reject a claim payout.
 */
export async function reviewClaim({ params: [id, action] }) {
    const policy = await updateById(id, {
        claim_approval_status: action === "approve" ? "approved" : "rejected",
        claim_reviewed_at: new Date().toISOString(),
    });

    return {
        message: action === "approve" ? "Claim approved." : "Claim rejected.",
        policy,
    };
}

/**
 * Return claims filtered by status and optional month, for browsing/history.
 */
export async function claimsHistory({ query }) {
    const status = query.status ?? "pending";
    const range = monthRange(query.month);
    if (range === false && status !== "pending") return [];

    const rows = await fetchAll(() => {
        const q = db().from(TABLE).select("*").eq("claim_approval_status", status);

        // Pending claims haven't been reviewed yet, so there's no date to filter them by month
        if (status === "pending") {
            return q.order("claim_amount_cleaned", { ascending: false, nullsFirst: false }).order("id");
        }

        let reviewed = q.not("claim_reviewed_at", "is", null);

        if (range) {
            reviewed = reviewed
                .gte("claim_reviewed_at", `${range.start}T00:00:00Z`)
                .lt("claim_reviewed_at", `${range.end}T00:00:00Z`);
        }

        return reviewed.order("claim_reviewed_at", { ascending: false }).order("id");
    });

    return serialize(rows);
}

async function updateById(id, changes) {
    const policy = unwrap(
        await db()
            .from(TABLE)
            .update({ ...changes, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .maybeSingle(),
    );

    if (!policy) throw new HttpError(404, "Policy not found.");

    return serialize([policy])[0];
}

async function countAll() {
    return unwrap(await db().from(TABLE).select("*", { count: "exact", head: true }));
}

/**
 * Match Laravel's JSON output: decimal columns as 2dp strings.
 */
function serialize(rows) {
    return rows.map((row) => {
        const out = { ...row };
        for (const field of DECIMAL_FIELDS) {
            if (out[field] !== null && out[field] !== undefined) {
                out[field] = Number(out[field]).toFixed(2);
            }
        }
        return out;
    });
}

/**
 * "2026-05" → { start: "2026-05-01", end: "2026-06-01" }.
 * Returns null when no month is given and false when it's malformed.
 */
function monthRange(month) {
    if (!month) return null;

    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (!match) return false;

    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    if (monthIndex < 0 || monthIndex > 11) return false;

    const iso = (y, m) => new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);

    return { start: iso(year, monthIndex), end: iso(year, monthIndex + 1) };
}

// Groups preserving first-seen order, like Laravel's Collection::groupBy
function groupBy(rows, keyFn) {
    const groups = new Map();
    for (const row of rows) {
        const key = keyFn(row);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
    }
    return [...groups.entries()];
}

function sum(rows, field) {
    return rows.reduce((total, row) => total + (Number(row[field]) || 0), 0);
}

function average(values) {
    const present = values.filter((value) => value !== null && value !== undefined).map(Number);
    return present.length ? present.reduce((a, b) => a + b, 0) / present.length : null;
}

function isSameUtcMonth(a, b) {
    return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}

function toText(value) {
    if (value === null || value === undefined) return null;
    const text = String(value);
    return text.trim() === "" ? null : text;
}
