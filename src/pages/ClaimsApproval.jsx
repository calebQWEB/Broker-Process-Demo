import { useState, useEffect, useCallback } from "react";
import { Loader2, Check, X } from "lucide-react";
import {
    getPendingClaims,
    approveClaim,
    rejectClaim,
} from "../api/scheduleApi.js";
import { useRole } from "../context/RoleContext.jsx";
import { formatDate } from "../utils/format.js";

export default function ClaimsApproval() {
    const { role } = useRole();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [confirmedIds, setConfirmedIds] = useState({});

    const fetchClaims = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPendingClaims();
            setClaims(data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load claims.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClaims();
    }, [fetchClaims]);

    async function handleDecision(id, action) {
        setProcessingId(id);
        try {
            if (action === "approved") {
                await approveClaim(id);
            } else {
                await rejectClaim(id);
            }

            setConfirmedIds((prev) => ({ ...prev, [id]: action }));

            setTimeout(() => {
                setClaims((prev) => prev.filter((c) => c.id !== id));
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
                    No pending claim payouts.
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
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
                                    Claims Reported
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap">
                                    Claim Amount
                                </th>
                                {isOpsManager && (
                                    // Pinned so the buttons stay visible when the table scrolls sideways
                                    <th className="px-6 py-3 whitespace-nowrap sticky right-0 bg-inherit shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.12)]">
                                        Action
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {claims.map((row) => {
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
                                        <td className="px-6 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                                            {row.client_name || "—"}
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                            {row.policy_no || "—"}
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                            {row.division || "—"}
                                        </td>
                                        {/* max-width is ignored on table cells, so truncate an inner div instead */}
                                        <td className="px-4 py-3.5 text-gray-600">
                                            <div
                                                className="max-w-xs truncate"
                                                title={row.claim_description || ""}
                                            >
                                                {row.claim_description || "—"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                            {row.claims_reported || "—"}
                                        </td>
                                        <td className="px-4 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                                            ₦
                                            {Number(
                                                row.claim_amount_cleaned,
                                            ).toLocaleString()}
                                        </td>
                                        {isOpsManager && (
                                            <td className="px-6 py-3.5 whitespace-nowrap sticky right-0 bg-inherit shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.12)]">
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
                                                ) : (
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
