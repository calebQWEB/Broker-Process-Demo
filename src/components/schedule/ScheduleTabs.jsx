import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import ScheduleTable from "./ScheduleTable.jsx";
import useSchedules from "../../hooks/useSchedules.js";
import { cleanSchedules } from "../../api/scheduleApi.js";

export default function ScheduleTabs() {
    const [activeTab, setActiveTab] = useState("before");
    const [cleaning, setCleaning] = useState(false);
    const [cleanError, setCleanError] = useState("");

    const before = useSchedules("raw");
    const after = useSchedules("cleaned");

    async function handleClean() {
        setCleaning(true);
        setCleanError("");

        try {
            await cleanSchedules();
            await after.refetch();
            setActiveTab("after");
        } catch (err) {
            setCleanError(
                err.response?.data?.message ||
                    "Failed to clean data. Please try again.",
            );
        } finally {
            setCleaning(false);
        }
    }

    const active = activeTab === "before" ? before : after;

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                    <button
                        onClick={() => setActiveTab("before")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === "before"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Before
                    </button>
                    <button
                        onClick={() => setActiveTab("after")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === "after"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        After
                    </button>
                </div>

                <button
                    onClick={handleClean}
                    disabled={cleaning || before.data.length === 0}
                    className="flex items-center gap-2 bg-[#0f3d2e] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#0c3225] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    {cleaning ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Cleaning...
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} />
                            Clean Data
                        </>
                    )}
                </button>
            </div>

            {cleanError && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                    {cleanError}
                </div>
            )}

            {active.loading ? (
                <div className="flex justify-center py-16 text-gray-400">
                    <Loader2 className="animate-spin" size={24} />
                </div>
            ) : active.error ? (
                <div className="text-center py-16 text-red-500 text-sm">
                    {active.error}
                </div>
            ) : (
                <ScheduleTable
                    rows={active.data}
                    variant={activeTab === "before" ? "raw" : "cleaned"}
                />
            )}
        </div>
    );
}
