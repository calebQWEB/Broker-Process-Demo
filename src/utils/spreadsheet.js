const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["xlsx", "xls", "csv"];

function uploadError(message) {
    const error = new Error(message);
    error.userMessage = message;
    return error;
}

// Same as Laravel Excel's heading row formatter: "Policy Expiry Date" → "policy_expiry_date"
function slugHeading(heading) {
    return String(heading ?? "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/@/g, "_at_")
        .replace(/[^a-z0-9\s_-]/g, "")
        .replace(/[\s_-]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

/**
 * Parse an uploaded .xlsx/.xls/.csv into row objects keyed by slugged heading.
 * Cell values are kept as the text shown in the sheet, so messy formatting survives
 * for the cleanup step.
 */
export async function parseScheduleFile(file) {
    const extension = file.name.split(".").pop().toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        throw uploadError("The file must be an .xlsx, .xls or .csv file.");
    }
    if (file.size > MAX_FILE_SIZE) {
        throw uploadError("The file may not be larger than 10MB.");
    }

    // Loaded on demand so the parser isn't in the main bundle
    const XLSX = await import("xlsx");

    const workbook =
        extension === "csv"
            ? XLSX.read(await file.text(), { type: "string", dateNF: "dd/mm/yyyy" })
            : XLSX.read(await file.arrayBuffer(), { dateNF: "dd/mm/yyyy" });

    const rows = [];

    for (const sheetName of workbook.SheetNames) {
        const [headings = [], ...body] = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheetName],
            { header: 1, raw: false, defval: null, blankrows: false },
        );
        const keys = headings.map(slugHeading);

        for (const cells of body) {
            const row = {};
            keys.forEach((key, i) => {
                if (key) row[key] = cells[i] ?? null;
            });

            if (Object.values(row).some((value) => value !== null && String(value).trim() !== "")) {
                rows.push(row);
            }
        }
    }

    if (rows.length === 0) {
        throw uploadError("The file has no data rows.");
    }

    return rows;
}
