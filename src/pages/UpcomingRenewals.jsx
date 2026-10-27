import { useState, useEffect, useCallback } from "react";
import { Loader2, Check, X, Clock } from "lucide-react";
import {
    getPendingRenewals,
    approvePolicy,
    rejectPolicy,
} from "../api/scheduleApi.js";
import { useRole } from "../context/RoleContext.jsx";
import {
    formatDate,
    daysLeftBadgeClasses,
    daysLeftLabel,
} from "../utils/format.js";

const DAY_OPTIONS = [30, 60, 90];
const ACTIONABLE_DAYS_THRESHOLD = 14;

export default function UpcomingRenewals() {
    const { role } = useRole();
    const [days, setDays] = useState(60);
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [confirmedIds, setConfirmedIds] = useState({}); // { [id]: 'approved' | 'rejected' }

    const fetchPolicies = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPendingRenewals(days);
            setPolicies(data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load renewals.");
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => {
        fetchPolicies();
    }, [fetchPolicies]);

    async function handleDecision(id, action) {
        setProcessingId(id);
        try {
            if (action === "approved") {
                await approvePolicy(id);
            } else {
                await rejectPolicy(id);
            }

            setConfirmedIds((prev) => ({ ...prev, [id]: action }));

            // Show confirmation briefly, then remove from list
            setTimeout(() => {
                setPolicies((prev) => prev.filter((p) => p.id !== id));
                setConfirmedIds((prev) => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
            }, 900);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Action failed. Please try again.",
            );
        } finally {
            setProcessingId(null);
        }
    }

    const isOpsManager = role === "Ops Manager";

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} className="text-gray-400" />
                    <span>Show renewals due within:</span>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                    {DAY_OPTIONS.map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                days === d
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {d} days
                        </button>
                    ))}
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
                    No renewals pending within {days} days.
                </div>
            ) : (
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
                                    Premium
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap">
                                    Expiry Date
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap">
                                    Days Left
                                </th>
                                {isOpsManager && (
                                    // Pinned so the buttons stay visible when the table scrolls sideways
                                    <th className="px-4 py-3 whitespace-nowrap sticky right-0 bg-inherit shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.12)]">
                                        Action
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {policies.map((row) => {
                                const confirmed = confirmedIds[row.id];
                                const isProcessing = processingId === row.id;

                                return (
                                    <tr
                                        key={row.id}
                                        className={`border-b border-gray-100 last:border-0 transition-colors ${
                                            confirmed === "approved"
                                                ? "bg-green-50"
                                                : confirmed === "rejected"
                                                  ? "bg-red-50"
                                                  : "bg-white hover:bg-gray-50"
                                        }`}
                                    >
                                        <td className="px-4 py-3.5 font-medium text-gray-900 whitespace-nowrap">
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
                                            {formatDate(
                                                row.policy_expiry_cleaned,
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${daysLeftBadgeClasses(row.days_to_expiry)}`}
                                                >
                                                    {daysLeftLabel(
                                                        row.days_to_expiry,
                                                    )}
                                                </span>
                                                {row.days_to_expiry !== null &&
                                                    row.days_to_expiry <=
                                                        ACTIONABLE_DAYS_THRESHOLD && (
                                                        <span className="text-xs font-medium text-[#0f3d2e] flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#0f3d2e]"></span>
                                                            Actionable
                                                        </span>
                                                    )}
                                            </div>
                                        </td>
                                        {isOpsManager && (
                                            <td className="px-4 py-3.5 whitespace-nowrap sticky right-0 bg-inherit shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.12)]">
                                                {confirmed ? (
                                                    <span
                                                        className={`text-sm font-medium ${
                                                            confirmed ===
                                                            "approved"
                                                                ? "text-green-700"
                                                                : "text-red-700"
                                                        }`}
                                                    >
                                                        {confirmed ===
                                                        "approved"
                                                            ? "Approved ✓"
                                                            : "Rejected ✕"}
                                                    </span>
                                                ) : row.days_to_expiry !==
                                                      null &&
                                                  row.days_to_expiry <=
                                                      ACTIONABLE_DAYS_THRESHOLD ? (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() =>
                                                                handleDecision(
                                                                    row.id,
                                                                    "approved",
                                                                )
                                                            }
                                                            disabled={
                                                                isProcessing
                                                            }
                                                            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-40 transition-colors"
                                                        >
                                                            <Check size={14} />{" "}
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDecision(
                                                                    row.id,
                                                                    "rejected",
                                                                )
                                                            }
                                                            disabled={
                                                                isProcessing
                                                            }
                                                            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-40 transition-colors"
                                                        >
                                                            <X size={14} />{" "}
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">
                                                        {row.days_to_expiry ===
                                                        null
                                                            ? "Needs attention"
                                                            : "Not yet actionable"}
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
