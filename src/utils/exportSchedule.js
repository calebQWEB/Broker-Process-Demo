// Port of the Laravel PolicyScheduleExport, built in the browser with ExcelJS.

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const COLUMNS = [
    { header: "Client Name", width: 26 },
    { header: "Policy No.", width: 16 },
    { header: "Division", width: 26 },
    { header: "Policy Type", width: 20 },
    { header: "Premium (₦)", width: 16 },
    { header: "Underwriter", width: 20 },
    { header: "Policy Expiry Date", width: 18 },
    { header: "Days to Expiry", width: 14 },
    { header: "Renewal Status", width: 16 },
    { header: "Payment Status", width: 15 },
    { header: "Claims Reported", width: 14 },
    { header: "Loss Ratio (%)", width: 14 },
    { header: "Approval Status", width: 15 },
    { header: "Reviewed On", width: 15 },
];

const STATUS_FILLS = {
    approved: "E8F5EE",
    rejected: "FDECEC",
    duplicate: "FFF4E5",
};

// "2026-05-01" or an ISO timestamp → "01 May 2026"
function formatDay(value) {
    if (!value) return null;
    const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
    if (isNaN(date.getTime())) return null;
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${day} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function toNumber(value) {
    return value === null || value === undefined ? null : Number(value);
}

function ucfirst(value) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function solidFill(rgb) {
    return { type: "pattern", pattern: "solid", fgColor: { argb: `FF${rgb}` } };
}

export async function downloadScheduleExport(rows, filename) {
    // Loaded on demand so ExcelJS isn't in the main bundle
    const { default: ExcelJS } = await import("exceljs");

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Worksheet");

    sheet.columns = COLUMNS;

    for (const row of rows) {
        sheet.addRow([
            row.client_name,
            row.policy_no,
            row.division,
            row.policy_type,
            toNumber(row.premium_cleaned),
            row.underwriter,
            formatDay(row.policy_expiry_cleaned),
            row.days_to_expiry,
            row.renewal_status_cleaned,
            row.payment_status_cleaned,
            row.claims_reported,
            toNumber(row.loss_ratio_cleaned),
            ucfirst(row.approval_status),
            formatDay(row.reviewed_at),
        ]);
    }

    // Header row styling
    const header = sheet.getRow(1);
    header.height = 24;
    header.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
        cell.fill = solidFill("0F3D2E");
        cell.alignment = { vertical: "middle" };
    });

    // Zebra striping + approval status coloring
    const lastRow = rows.length + 1;
    for (let r = 2; r <= lastRow; r++) {
        const status = String(sheet.getCell(r, 13).value ?? "").toLowerCase();
        const fill = STATUS_FILLS[status] ?? (r % 2 === 0 ? "F8F9FA" : "FFFFFF");

        for (let c = 1; c <= COLUMNS.length; c++) {
            const cell = sheet.getCell(r, c);
            cell.fill = solidFill(fill);
            cell.border = { bottom: { style: "thin", color: { argb: "FFEEEEEE" } } };
        }
    }

    // Freeze header row and add an auto filter
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = `A1:N${lastRow}`;

    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(
        new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
