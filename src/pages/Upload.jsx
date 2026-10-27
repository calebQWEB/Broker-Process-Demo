import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import UploadForm from "../components/upload/UploadForm.jsx";
import { clearAllSchedules } from "../api/scheduleApi.js";

export default function Upload() {
    const [confirming, setConfirming] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [clearMessage, setClearMessage] = useState("");

    async function handleClear() {
        setClearing(true);
        setClearMessage("");
        try {
            const result = await clearAllSchedules();
            setClearMessage(
                `Cleared ${result.count} records. You can now upload a fresh schedule.`,
            );
            setConfirming(false);
        } catch (err) {
            setClearMessage(
                err.response?.data?.message || "Failed to clear data.",
            );
        } finally {
            setClearing(false);
        }
    }

    return (
        <div className="p-4 md:p-8 flex flex-col items-center gap-6">
            <UploadForm />

            <div className="max-w-2xl w-full border-t border-gray-200 pt-6">
                {!confirming ? (
                    <button
                        onClick={() => setConfirming(true)}
                        className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                        <Trash2 size={15} />
                        Clear all existing data
                    </button>
                ) : (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm text-red-800 font-medium mb-1">
                            This will permanently delete all uploaded policy
                            data.
                        </p>
                        <p className="text-sm text-red-700 mb-3">
                            This cannot be undone. Are you sure?
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleClear}
                                disabled={clearing}
                                className="flex items-center gap-2 bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {clearing ? (
                                    <Loader2
                                        size={14}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Trash2 size={14} />
                                )}
                                {clearing
                                    ? "Clearing..."
                                    : "Yes, clear everything"}
                            </button>
                            <button
                                onClick={() => setConfirming(false)}
                                disabled={clearing}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {clearMessage && (
                    <p className="text-sm text-gray-600 mt-3">{clearMessage}</p>
                )}
            </div>
        </div>
    );
}
