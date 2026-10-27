import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
    Loader2,
    FileText,
    Clock,
    CheckCircle2,
    ShieldAlert,
    Upload,
    BarChart3,
    ArrowRight,
} from "lucide-react";
import {
    getSummary,
    getRenewalHistory,
    getPendingClaims,
} from "../api/scheduleApi.js";
import StatCard from "../components/reports/StatCard.jsx";
import {
    formatDate,
    daysLeftBadgeClasses,
    daysLeftLabel,
} from "../utils/format.js";

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

export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Renewals vs Claims top-level toggle
    const [recordType, setRecordType] = useState("renewals");

    // Renewals state
    const [activeTab, setActiveTab] = useState("pending");
    const [renewals, setRenewals] = useState([]);
    const [renewalsLoading, setRenewalsLoading] = useState(true);

    // Claims state
    const [claims, setClaims] = useState([]);
    const [claimsLoading, setClaimsLoading] = useState(true);

    useEffect(() => {
        async function fetchSummary() {
            setLoading(true);
            setError(null);
            try {
                const data = await getSummary();
                setSummary(data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                        "Failed to load dashboard data.",
                );
            } finally {
                setLoading(false);
            }
        }
        fetchSummary();
    }, []);

    const fetchRenewals = useCallback(async () => {
        setRenewalsLoading(true);
        try {
            const data = await getRenewalHistory(activeTab);
            setRenewals(data.slice(0, 5));
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load renewals.");
        } finally {
            setRenewalsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchRenewals();
    }, [fetchRenewals]);

    useEffect(() => {
        async function fetchClaims() {
            setClaimsLoading(true);
            try {
                const data = await getPendingClaims();
                setClaims(data.slice(0, 5));
            } catch (err) {
                setError(
                    err.response?.data?.message || "Failed to load claims.",
                );
            } finally {
                setClaimsLoading(false);
            }
        }
        fetchClaims();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-16 text-gray-400">
                <Loader2 className="animate-spin" size={24} />
            </div>
        );
    }

    if (error && !summary) {
        return (
            <div className="p-8 text-center py-16 text-red-500 text-sm">
                {error}
            </div>
        );
    }

    const { stats } = summary;
    const showReviewedDate = activeTab !== "pending";

    return (
        <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    label="Total Policies"
                    value={stats.totalPolicies}
                    icon={FileText}
                    accent="bg-[#0f3d2e]/10 text-[#0f3d2e]"
                />
                <StatCard
                    label="Pending Renewals"
                    value={stats.pendingRenewals}
                    icon={Clock}
                    accent="bg-amber-50 text-amber-600"
                />
                <StatCard
                    label="Approved This Month"
                    value={stats.approvedThisMonth}
                    icon={CheckCircle2}
                    accent="bg-green-50 text-green-600"
                />
                <StatCard
                    label="Pending Claims"
                    value={stats.pendingClaims}
                    icon={ShieldAlert}
                    accent="bg-red-50 text-red-600"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                    to="/upload"
                    className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-between hover:border-[#0f3d2e]/30 hover:shadow-sm transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-[#0f3d2e]/10 text-[#0f3d2e] flex items-center justify-center">
                            <Upload size={20} />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">
                                Upload New Schedule
                            </p>
                            <p className="text-sm text-gray-500">
                                Import and clean a policy schedule file
                            </p>
                        </div>
                    </div>
                    <ArrowRight
                        size={18}
                        className="text-gray-300 group-hover:text-[#0f3d2e] transition-colors"
                    />
                </Link>

                <Link
                    to="/reports"
                    className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-between hover:border-[#0f3d2e]/30 hover:shadow-sm transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">
                                View Reports
                            </p>
                            <p className="text-sm text-gray-500">
                                See loss ratios, payments & renewal trends
                            </p>
                        </div>
                    </div>
                    <ArrowRight
                        size={18}
                        className="text-gray-300 group-hover:text-[#0f3d2e] transition-colors"
                    />
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                        <button
                            onClick={() => setRecordType("renewals")}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                recordType === "renewals"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            Renewals
                        </button>
                        <button
                            onClick={() => setRecordType("claims")}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                recordType === "claims"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            Claims
                        </button>
                    </div>
                    <Link
                        to={
                            recordType === "renewals"
                                ? `/renewals/history?status=${activeTab}`
                                : "/claims/history?status=pending"
                        }
                        className="text-sm font-medium text-[#0f3d2e] hover:underline flex items-center gap-1"
                    >
                        View All <ArrowRight size={14} />
                    </Link>
                </div>

                {recordType === "renewals" ? (
                    <>
                        <div className="flex items-center gap-1 px-6 pt-4">
                            {STATUS_TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        activeTab === tab.key
                                            ? "bg-gray-100 text-gray-900"
                                            : "text-gray-400 hover:text-gray-600"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {renewalsLoading ? (
                            <div className="flex justify-center py-12 text-gray-400">
                                <Loader2 className="animate-spin" size={20} />
                            </div>
                        ) : renewals.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 text-sm">
                                No {activeTab} renewals found.
                            </div>
                        ) : (
                            <table className="w-full text-sm mt-2">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide">
                                        <th className="px-6 py-3">
                                            Client Name
                                        </th>
                                        <th className="px-4 py-3">
                                            Policy No.
                                        </th>
                                        <th className="px-4 py-3">Division</th>
                                        <th className="px-4 py-3">
                                            Expiry Date
                                        </th>
                                        {activeTab === "pending" ? (
                                            <th className="px-6 py-3">
                                                Days Left
                                            </th>
                                        ) : (
                                            <>
                                                <th className="px-4 py-3">
                                                    Status
                                                </th>
                                                {showReviewedDate && (
                                                    <th className="px-6 py-3">
                                                        Reviewed On
                                                    </th>
                                                )}
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {renewals.map((row) => (
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
                                                {formatDate(
                                                    row.policy_expiry_cleaned,
                                                )}
                                            </td>
                                            {activeTab === "pending" ? (
                                                <td className="px-6 py-3.5 whitespace-nowrap">
                                                    <span
                                                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${daysLeftBadgeClasses(row.days_to_expiry)}`}
                                                    >
                                                        {daysLeftLabel(
                                                            row.days_to_expiry,
                                                        )}
                                                    </span>
                                                </td>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                                        <StatusPill
                                                            status={
                                                                row.approval_status
                                                            }
                                                        />
                                                    </td>
                                                    {showReviewedDate && (
                                                        <td className="px-6 py-3.5 text-gray-600 whitespace-nowrap">
                                                            {formatDate(
                                                                row.reviewed_at,
                                                            )}
                                                        </td>
                                                    )}
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                ) : (
                    <>
                        {claimsLoading ? (
                            <div className="flex justify-center py-12 text-gray-400">
                                <Loader2 className="animate-spin" size={20} />
                            </div>
                        ) : claims.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 text-sm">
                                No pending claims.
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide">
                                        <th className="px-6 py-3">
                                            Client Name
                                        </th>
                                        <th className="px-4 py-3">
                                            Policy No.
                                        </th>
                                        <th className="px-4 py-3">Division</th>
                                        <th className="px-6 py-3">
                                            Claim Amount
                                        </th>
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
                                            <td className="px-6 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                                                ₦
                                                {Number(
                                                    row.claim_amount_cleaned,
                                                ).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
