import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Calendar, Download } from "lucide-react";
import { getClaimsHistory } from "../api/scheduleApi.js";
import { formatDate } from "../utils/format.js";

const STATUS_TABS = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
];

function StatusPill({ status }) {
    const styles = {
        pending: "bg-amber-50 text-amber-700 border border-amber-200",
        approved: "bg-green-50 text-green-700 border border-green-200",
        rejected: "bg-red-50 text-red-700 border border-red-200",
    };
    return (
        <span
            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-gray-100 text-gray-600"}`}
        >
            {status}
        </span>
    );
}

export default function ClaimsHistory() {
    const [searchParams] = useSearchParams();
    const initialStatus = searchParams.get("status") || "pending";
    const [status, setStatus] = useState(initialStatus);
    const [month, setMonth] = useState("");
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchClaims = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getClaimsHistory(status, month || undefined);
            setClaims(data);
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to load claims history.",
            );
        } finally {
            setLoading(false);
        }
    }, [status, month]);

    useEffect(() => {
        fetchClaims();
    }, [fetchClaims]);

    const showReviewedDate = status !== "pending";
    const isPending = status === "pending";

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setStatus(tab.key)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                status === tab.key
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {!isPending && (
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f3d2e]/20"
                            />
                            {month && (
                                <button
                                    onClick={() => setMonth("")}
                                    className="text-sm text-gray-400 hover:text-gray-600"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-16 text-gray-400">
                    <Loader2 className="animate-spin" size={24} />
                </div>
            ) : claims.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-2xl border border-gray-200">
                    No {status} claims found{month ? " for this month" : ""}.
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto scrollbar-hide">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wide">
                                <th className="px-6 py-3 whitespace-nowrap">
                                    Client Name
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap">
                                    Policy No.
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap">
                                    Division
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap">
                                    Claim Description
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap">
                                    Claim Amount
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap">
                                    Status
                                </th>
                                {showReviewedDate && (
                                    <th className="px-6 py-3 whitespace-nowrap">
                                        Reviewed On
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {claims.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                                        {row.client_name || "—"}
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                        {row.policy_no || "—"}
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                        {row.division || "—"}
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-600 max-w-xs truncate">
                                        {row.claim_description || "—"}
                                    </td>
                                    <td className="px-4 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                                        ₦
                                        {Number(
                                            row.claim_amount_cleaned,
                                        ).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                        <StatusPill
                                            status={row.claim_approval_status}
                                        />
                                    </td>
                                    {showReviewedDate && (
                                        <td className="px-6 py-3.5 text-gray-600 whitespace-nowrap">
                                            {formatDate(row.claim_reviewed_at)}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
