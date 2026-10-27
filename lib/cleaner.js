// Port of the Laravel ScheduleCleanerService.

const MONTHS = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

const DIVISION_MAP = {
    "oil & gas": "Oil & Gas",
    "marine & aviation": "Marine & Aviation",
    "construction & engineering": "Construction & Engineering",
    "construction/engineering": "Construction & Engineering",
    "industrial & commercial": "Industrial & Commercial",
    "reinsurance & multinational risks": "Reinsurance & Multinational Risks",
    "reinsurance & multinational": "Reinsurance & Multinational Risks",
};

/**
 * Compute the cleaned values for every row (in id order).
 * Returns [{ id, changes }] where `changes` is the set of columns to persist.
 */
export function cleanRows(rows, today = todayUtc()) {
    const seen = new Set();

    return rows.map((row) => {
        const changes = {
            premium_cleaned: cleanPremium(row.premium_raw),
            policy_expiry_cleaned: cleanDate(row.policy_expiry_raw),
            renewal_status_cleaned: cleanStatus(row.renewal_status_raw),
            payment_status_cleaned: cleanStatus(row.payment_status_raw),
            loss_ratio_cleaned: cleanLossRatio(row.loss_ratio_raw),
            division: cleanDivision(row.division),
            claim_amount_cleaned: cleanPremium(row.claim_amount_raw),
        };

        // A claim only becomes "pending" for approval if there's an actual reported claim with an amount
        const claims = row.claims_reported?.trim() ?? "";
        const hasClaim = claims !== "" && claims !== "0" && !!changes.claim_amount_cleaned;
        changes.claim_approval_status = hasClaim ? "pending" : "not_applicable";

        changes.days_to_expiry = changes.policy_expiry_cleaned
            ? Math.round((Date.parse(changes.policy_expiry_cleaned) - today) / 86_400_000)
            : null;

        // Flag exact duplicates (same client + policy no.) after the first occurrence
        const dupKey = `${(row.client_name ?? "").trim().toLowerCase()}|${(row.policy_no ?? "").trim().toLowerCase()}`;
        if (seen.has(dupKey)) {
            changes.approval_status = "duplicate";
        } else {
            seen.add(dupKey);
        }

        return { id: row.id, changes };
    });
}

function todayUtc() {
    const now = new Date();
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

// PHP treats null, "" and "0" as falsy; the original cleaners bail out early on all three
function isBlank(raw) {
    return raw === null || raw === undefined || raw === "" || raw === "0";
}

function cleanPremium(raw) {
    if (isBlank(raw)) return null;

    // Strip currency symbols, "NGN", commas, whitespace — anything that isn't a digit or dot
    const value = String(raw).replace(/[^0-9.]/g, "");

    return /^(\d+\.?\d*|\.\d+)$/.test(value) ? parseFloat(value) : null;
}

const DATE_FORMATS = [
    // d/m/Y
    [/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, (m) => [m[3], m[2], m[1]]],
    // m-d-Y
    [/^(\d{1,2})-(\d{1,2})-(\d{4})$/, (m) => [m[3], m[1], m[2]]],
    // d M Y
    [/^(\d{1,2}) ([A-Za-z]+) (\d{4})$/, (m) => [m[3], monthFromName(m[2]), m[1]]],
    // Y-m-d
    [/^(\d{4})-(\d{1,2})-(\d{1,2})$/, (m) => [m[1], m[2], m[3]]],
    // d.m.y
    [/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/, (m) => [twoDigitYear(m[3]), m[2], m[1]]],
];

function cleanDate(raw) {
    if (isBlank(raw)) return null;

    const value = String(raw).trim();

    for (const [pattern, parts] of DATE_FORMATS) {
        const match = value.match(pattern);
        if (!match) continue;

        const [year, month, day] = parts(match).map(Number);
        if (!month || month > 12 || day < 1 || day > 31) continue;

        // Like PHP, out-of-range days roll over (31/02 → 03/03)
        return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
    }

    return null;
}

function monthFromName(name) {
    const lower = name.toLowerCase();
    return MONTHS[lower] ?? MONTHS[lower.slice(0, 3)] ?? null;
}

// Same pivot as PHP's "y": 70–99 → 19xx, 00–69 → 20xx
function twoDigitYear(yy) {
    const n = Number(yy);
    return n >= 70 ? 1900 + n : 2000 + n;
}

function cleanStatus(raw) {
    if (isBlank(raw)) return null;

    const value = String(raw).trim();
    if (value === "" || value.toUpperCase() === "N/A") return null;

    return ucwords(value.toLowerCase());
}

function cleanLossRatio(raw) {
    if (isBlank(raw)) return null;

    const value = String(raw).trim();

    if (value.endsWith("%")) {
        return phpFloat(value.replace(/%/g, ""));
    }

    const number = phpFloat(value);

    // If it's a decimal like 0.345, convert to percentage (34.5)
    if (number > 0 && number < 1) {
        return round(number * 100, 1);
    }

    return number;
}

function cleanDivision(raw) {
    if (isBlank(raw)) return null;

    const normalized = String(raw).trim().toLowerCase().replaceAll(" and ", " & ");

    return DIVISION_MAP[normalized] ?? ucwords(normalized);
}

function ucwords(value) {
    return value.replace(/(^|\s)(\S)/g, (_, space, char) => space + char.toUpperCase());
}

// PHP (float) cast: leading numeric portion of the string, or 0
function phpFloat(value) {
    const match = String(value).trim().match(/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i);
    return match ? parseFloat(match[0]) : 0;
}

// PHP-style round (half away from zero)
export function round(value, precision) {
    const factor = 10 ** precision;
    return (Math.sign(value) * Math.round(Math.abs(value) * factor)) / factor;
}
