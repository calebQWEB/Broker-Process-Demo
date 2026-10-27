import PropTypes from "prop-types";

function StatusBadge({ value }) {
    if (!value) return <span className="text-gray-300">—</span>;

    const normalized = value.toLowerCase();
    let classes = "bg-gray-100 text-gray-600";

    if (normalized.includes("pending"))
        classes = "bg-amber-50 text-amber-700 border border-amber-200";
    else if (normalized.includes("renewed") || normalized.includes("paid"))
        classes = "bg-green-50 text-green-700 border border-green-200";
    else if (
        normalized.includes("lapsed") ||
        normalized.includes("outstanding")
    )
        classes = "bg-red-50 text-red-700 border border-red-200";

    return (
        <span
            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${classes}`}
        >
            {value}
        </span>
    );
}

StatusBadge.propTypes = {
    value: PropTypes.string,
};

export default function ScheduleTable({ rows, variant }) {
    const isCleaned = variant === "cleaned";

    function field(row, rawKey, cleanedKey) {
        return isCleaned ? row[cleanedKey] : row[rawKey];
    }

    if (!rows || rows.length === 0) {
        return (
            <div className="text-center py-16 text-gray-400 text-sm">
                No data to display yet.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wide">
                        <th className="px-4 py-3 whitespace-nowrap">
                            Client Name
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                            Policy No.
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                            Division
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                            Policy Type
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">Premium</th>
                        <th className="px-4 py-3 whitespace-nowrap">
                            Underwriter
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                            Expiry Date
                        </th>
                        {isCleaned && (
                            <th className="px-4 py-3 whitespace-nowrap">
                                Days to Expiry
                            </th>
                        )}
                        <th className="px-4 py-3 whitespace-nowrap">
                            Renewal Status
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                            Payment Status
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                            Claims Reported
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                            Loss Ratio
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const isDuplicate = row.approval_status === "duplicate";

                        return (
                            <tr
                                key={row.id}
                                className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${
                                    isDuplicate ? "bg-red-50/40" : ""
                                }`}
                            >
                                <td className="px-4 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                                    {row.client_name || (
                                        <span className="text-gray-300">—</span>
                                    )}
                                    {isDuplicate && (
                                        <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                            Duplicate
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                    {row.policy_no || "—"}
                                </td>
                                <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                    {row.division || "—"}
                                </td>
                                <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                    {row.policy_type || "—"}
                                </td>
                                <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                    {field(
                                        row,
                                        "premium_raw",
                                        "premium_cleaned",
                                    ) || "—"}
                                </td>
                                <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                    {row.underwriter || "—"}
                                </td>
                                <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                    {field(
                                        row,
                                        "policy_expiry_raw",
                                        "policy_expiry_cleaned",
                                    ) || "—"}
                                </td>
                                {isCleaned && (
                                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                        {row.days_to_expiry ?? "—"}
                                    </td>
                                )}
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                    {isCleaned ? (
                                        <StatusBadge
                                            value={row.renewal_status_cleaned}
                                        />
                                    ) : (
                                        row.renewal_status_raw || "—"
                                    )}
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                    {isCleaned ? (
                                        <StatusBadge
                                            value={row.payment_status_cleaned}
                                        />
                                    ) : (
                                        row.payment_status_raw || "—"
                                    )}
                                </td>
                                <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                    {row.claims_reported || "—"}
                                </td>
                                <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                    {field(
                                        row,
                                        "loss_ratio_raw",
                                        "loss_ratio_cleaned",
                                    ) || "—"}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

ScheduleTable.propTypes = {
    rows: PropTypes.arrayOf(PropTypes.object).isRequired,
    variant: PropTypes.oneOf(["raw", "cleaned"]).isRequired,
};
