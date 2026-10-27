import { useState, useEffect, useCallback } from "react";
import { Loader2, Calendar } from "lucide-react";
import {
    getRenewalHistory,
    exportPoliciesByStatus,
} from "../api/scheduleApi.js";
import {
    formatDate,
    daysLeftBadgeClasses,
    daysLeftLabel,
} from "../utils/format.js";
import { useSearchParams } from "react-router-dom";
import { Download } from "lucide-react";

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

export default function RenewalHistory() {
    const [searchParams] = useSearchParams();
    const initialStatus = searchParams.get("status") || "pending";
    const [status, setStatus] = useState(initialStatus);
    const [month, setMonth] = useState("");
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getRenewalHistory(status, month || undefined);
            setPolicies(data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to load renewal history.",
            );
        } finally {
            setLoading(false);
        }
    }, [status, month]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const [exporting, setExporting] = useState(false);

    async function handleExport() {
        setExporting(true);
        try {
            await exportPoliciesByStatus(status, month);
        } catch {
            window.alert("Export failed. Please try again.");
        } finally {
            setExporting(false);
        }
    }

    const showReviewedDate = status !== "pending";

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

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
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
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 bg-[#0f3d2e] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#0c3225] disabled:opacity-50 transition-colors"
                    >
                        {exporting ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Download size={16} />
                        )}
                        Export
                    </button>
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
            ) : policies.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-2xl border border-gray-200">
                    No {status} renewals found{month ? " for this month" : ""}.
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
                                    Premium
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap">
                                    Expiry Date
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
                            {policies.map((row) => (
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
                                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                        {row.premium_cleaned ?? "—"}
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                        {formatDate(row.policy_expiry_cleaned)}
                                    </td>
                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                        <StatusPill
                                            status={row.approval_status}
                                        />
                                    </td>
                                    {showReviewedDate && (
                                        <td className="px-6 py-3.5 text-gray-600 whitespace-nowrap">
                                            {row.reviewed_at
                                                ? new Date(
                                                      row.reviewed_at,
                                                  ).toLocaleDateString()
                                                : "—"}
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
