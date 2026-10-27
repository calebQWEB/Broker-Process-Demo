import { createClient } from "@supabase/supabase-js";

export const TABLE = "policy_schedules";

let client;

export function db() {
    if (!client) {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SECRET_KEY;

        if (!url || !key) {
            throw new Error(
                "Missing SUPABASE_URL or SUPABASE_SECRET_KEY environment variables.",
            );
        }

        client = createClient(url, key, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
    }

    return client;
}

/**
 * Unwrap a Supabase response, throwing on error.
 */
export function unwrap({ data, error, count }) {
    if (error) throw new Error(error.message);
    return count ?? data;
}

/**
 * Fetch every row matching a query, paging past PostgREST's 1000-row limit.
 * `build` must return a fresh query builder each time.
 */
export async function fetchAll(build) {
    const pageSize = 1000;
    const rows = [];

    for (let from = 0; ; from += pageSize) {
        const page = unwrap(await build().range(from, from + pageSize - 1));
        rows.push(...page);
        if (page.length < pageSize) return rows;
    }
}
