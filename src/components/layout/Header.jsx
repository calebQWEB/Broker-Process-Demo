import { useLocation } from "react-router-dom";
import { useRole } from "../../context/RoleContext.jsx";

const pageTitles = {
    "/": "Dashboard",
    "/upload": "Upload Schedule",
    "/review": "Review",
    "/renewals/pending": "Upcoming Renewals",
    "/renewals/history": "Renewal History",
    "/claims/pending": "Pending Claims",
    "/claims/history": "Claims History",
    "/reports": "Reports",
};

export default function Header() {
    const location = useLocation();
    const { role, setRole } = useRole();
    const title = pageTitles[location.pathname] || "BrokerProcess";

    return (
        <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-200">
            <div>
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-400">Home / {title}</p>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Role:</span>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f3d2e]/20"
                >
                    <option>Ops Manager</option>
                    <option>Viewer</option>
                </select>
            </div>
        </header>
    );
}
