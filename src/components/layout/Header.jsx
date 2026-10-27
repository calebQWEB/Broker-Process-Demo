import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { Menu } from "lucide-react";
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

export default function Header({ onMenuClick }) {
    const location = useLocation();
    const { role, setRole } = useRole();
    const title = pageTitles[location.pathname] || "BrokerProcess";

    return (
        <header className="flex items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-5 bg-white border-b border-gray-200">
            <div className="flex items-center gap-2 min-w-0">
                <button
                    onClick={onMenuClick}
                    aria-label="Open menu"
                    className="md:hidden -ml-1 p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                    <Menu size={22} />
                </button>
                <div className="min-w-0">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 truncate">
                        {title}
                    </h2>
                    <p className="hidden sm:block text-sm text-gray-400">
                        Home / {title}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <span className="hidden sm:inline text-sm text-gray-500">
                    Role:
                </span>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    aria-label="Role"
                    className="text-sm border border-gray-200 rounded-lg px-2 md:px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f3d2e]/20"
                >
                    <option>Ops Manager</option>
                    <option>Viewer</option>
                </select>
            </div>
        </header>
    );
}

Header.propTypes = {
    onMenuClick: PropTypes.func.isRequired,
};
