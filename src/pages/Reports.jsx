import { useState, useEffect } from "react";
import {
    Loader2,
    FileText,
    Clock,
    CheckCircle2,
    DollarSign,
} from "lucide-react";
import { getSummary, exportCleanedSchedule } from "../api/scheduleApi.js";
import StatCard from "../components/reports/StatCard.jsx";
import LossRatioChart from "../components/reports/LossRatioChart.jsx";
import PaymentStatusChart from "../components/reports/PaymentStatusChart.jsx";
import RenewalsByMonthChart from "../components/reports/RenewalsByMonthChart.jsx";
import { Download } from "lucide-react";
import { ShieldAlert } from "lucide-react";
import ClaimsByDivisionChart from "../components/reports/ClaimsByDivisionChart.jsx";

export default function Reports() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    async function handleExport() {
        setExporting(true);
        try {
            await exportCleanedSchedule();
        } catch {
            window.alert("Export failed. Please try again.");
        } finally {
            setExporting(false);
        }
    }

    function formatCurrency(amount) {
        const num = Number(amount);
        if (num >= 1_000_000_000)
            return `₦${(num / 1_000_000_000).toFixed(1)}B`;
        if (num >= 1_000_000) return `₦${(num / 1_000_000).toFixed(1)}M`;
        if (num >= 1_000) return `₦${(num / 1_000).toFixed(1)}K`;
        return `₦${num.toLocaleString()}`;
    }

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
                        "Failed to load report data.",
                );
            } finally {
                setLoading(false);
            }
        }
        fetchSummary();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-16 text-gray-400">
                <Loader2 className="animate-spin" size={24} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 md:p-8 text-center py-16 text-red-500 text-sm">
                {error}
            </div>
        );
    }

    const {
        stats,
        lossRatioByDivision,
        paymentStatusBreakdown,
        renewalsByMonth,
        claimsByDivision,
    } = summary;

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                    Summary Report
                </h2>
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
                    Export Cleaned Schedule
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 md:gap-6">
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
                    label="Total Premium"
                    value={formatCurrency(stats.totalPremium)}
                    icon={DollarSign}
                    accent="bg-blue-50 text-blue-600"
                />
                <StatCard
                    label="Pending Claims Value"
                    value={formatCurrency(stats.totalClaimsValue)}
                    icon={ShieldAlert}
                    accent="bg-red-50 text-red-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <LossRatioChart data={lossRatioByDivision} />
                <PaymentStatusChart data={paymentStatusBreakdown} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <RenewalsByMonthChart data={renewalsByMonth} />
                <ClaimsByDivisionChart data={claimsByDivision} />
            </div>
        </div>
    );
}
