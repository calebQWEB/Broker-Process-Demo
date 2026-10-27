import { useState } from "react";
import { Link } from "react-router-dom";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import PropTypes from "prop-types";
import { uploadSchedule } from "../../api/scheduleApi.js";

export default function UploadForm() {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState("idle"); // idle | uploading | success | error
    const [errorMessage, setErrorMessage] = useState("");
    const [result, setResult] = useState(null);

    function handleFileChange(e) {
        const selected = e.target.files[0];
        setFile(selected || null);
        setStatus("idle");
        setErrorMessage("");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!file) return;

        setStatus("uploading");
        setErrorMessage("");

        try {
            const data = await uploadSchedule(file);
            setResult(data);
            setStatus("success");
        } catch (err) {
            setErrorMessage(
                err.response?.data?.message ||
                    err.userMessage ||
                    "Upload failed. Please check the file and try again.",
            );
            setStatus("error");
        }
    }

    return (
        <div className="max-w-2xl">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Upload Policy Schedule
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                    Upload an Excel file (.xlsx, .xls) or CSV containing the
                    policy schedule.
                </p>

                <form onSubmit={handleSubmit}>
                    <label
                        htmlFor="schedule-file"
                        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-6 py-10 cursor-pointer hover:border-[#0f3d2e]/40 hover:bg-gray-50 transition-colors"
                    >
                        <UploadCloud className="text-[#0f3d2e]" size={32} />
                        <span className="text-sm text-gray-600">
                            {file
                                ? file.name
                                : "Click to select a file, or drag it here"}
                        </span>
                        <input
                            id="schedule-file"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={!file || status === "uploading"}
                        className="mt-6 w-full bg-[#0f3d2e] text-white text-sm font-medium py-3 rounded-lg hover:bg-[#0c3225] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        {status === "uploading"
                            ? "Uploading..."
                            : "Upload Schedule"}
                    </button>
                </form>

                {status === "success" && (
                    <div className="mt-6 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                        <CheckCircle2
                            className="text-green-600 shrink-0 mt-0.5"
                            size={20}
                        />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-green-800">
                                {result?.message ||
                                    "File uploaded successfully."}
                            </p>
                            <p className="text-sm text-green-700 mt-0.5">
                                {result?.count} rows imported.
                            </p>
                            <Link
                                to="/review"
                                className="inline-block mt-3 text-sm font-medium text-[#0f3d2e] underline hover:no-underline"
                            >
                                Go to Review →
                            </Link>
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="mt-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                        <AlertCircle
                            className="text-red-600 shrink-0 mt-0.5"
                            size={20}
                        />
                        <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

UploadForm.propTypes = {};
