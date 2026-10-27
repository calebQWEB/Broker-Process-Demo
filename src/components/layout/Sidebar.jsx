import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { ShieldCheck } from "lucide-react";
import {
    LayoutDashboard,
    Upload,
    ClipboardList,
    RefreshCw,
    ChevronDown,
    BarChart3,
    X,
} from "lucide-react";

const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/upload", label: "Upload Schedule", icon: Upload },
    { to: "/review", label: "Review", icon: ClipboardList },
    { to: "/reports", label: "Reports", icon: BarChart3 },
];

const renewalSubItems = [
    { to: "/renewals/pending", label: "Upcoming" },
    { to: "/renewals/history", label: "History" },
];

const claimsSubItems = [
    { to: "/claims/pending", label: "Pending" },
    { to: "/claims/history", label: "History" },
];

export default function Sidebar({ open, onClose }) {
    const location = useLocation();
    const isRenewalsActive = location.pathname.startsWith("/renewals");
    const [renewalsOpen, setRenewalsOpen] = useState(isRenewalsActive);
    const isClaimsActive = location.pathname.startsWith("/claims");
    const [claimsOpen, setClaimsOpen] = useState(isClaimsActive);

    // On mobile, close the drawer after navigating to a page
    useEffect(() => {
        onClose();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    useEffect(() => {
        if (!open) return;
        const closeOnEscape = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [open, onClose]);

    const navLinkClasses = ({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive
                ? "bg-white/10 text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white"
        }`;

    return (
        <>
            {/* Backdrop behind the mobile drawer */}
            <div
                onClick={onClose}
                className={`fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden ${
                    open ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            />

            {/* Slide-in drawer below md, fixed column from md up */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0f3d2e] text-white flex flex-col shrink-0 overflow-y-auto transition-transform md:static md:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="px-6 py-6 border-b border-white/10 flex items-start justify-between">
                    <div>
                        <h1 className="text-lg font-bold">BrokerProcess</h1>
                        <p className="text-xs text-white/50 uppercase tracking-wide mt-1">
                            Policy Schedule Portal
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close menu"
                        className="md:hidden -mr-2 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1">
                    <NavLink to="/" end className={navLinkClasses}>
                        <LayoutDashboard size={18} />
                        Dashboard
                    </NavLink>
                    <NavLink to="/upload" className={navLinkClasses}>
                        <Upload size={18} />
                        Upload Schedule
                    </NavLink>
                    <NavLink to="/review" className={navLinkClasses}>
                        <ClipboardList size={18} />
                        Review
                    </NavLink>
                    <div>
                        <button
                            onClick={() => setClaimsOpen(!claimsOpen)}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                isClaimsActive
                                    ? "bg-white/10 text-white"
                                    : "text-white/70 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <ShieldCheck size={18} />
                                Claims
                            </span>
                            <ChevronDown
                                size={16}
                                className={`transition-transform ${claimsOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        {claimsOpen && (
                            <div className="mt-1 ml-6 space-y-1 border-l border-white/10 pl-4">
                                {claimsSubItems.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        className={({ isActive }) =>
                                            `block px-3 py-2 rounded-lg text-sm transition-colors ${
                                                isActive
                                                    ? "text-white font-medium"
                                                    : "text-white/60 hover:text-white"
                                            }`
                                        }
                                    >
                                        {item.label}
                                    </NavLink>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <button
                            onClick={() => setRenewalsOpen(!renewalsOpen)}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                isRenewalsActive
                                    ? "bg-white/10 text-white"
                                    : "text-white/70 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <RefreshCw size={18} />
                                Renewals
                            </span>
                            <ChevronDown
                                size={16}
                                className={`transition-transform ${renewalsOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        {renewalsOpen && (
                            <div className="mt-1 ml-6 space-y-1 border-l border-white/10 pl-4">
                                {renewalSubItems.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        className={({ isActive }) =>
                                            `block px-3 py-2 rounded-lg text-sm transition-colors ${
                                                isActive
                                                    ? "text-white font-medium"
                                                    : "text-white/60 hover:text-white"
                                            }`
                                        }
                                    >
                                        {item.label}
                                    </NavLink>
                                ))}
                            </div>
                        )}
                    </div>

                    <NavLink to="/reports" className={navLinkClasses}>
                        <BarChart3 size={18} />
                        Reports
                    </NavLink>
                </nav>
            </aside>
        </>
    );
}

Sidebar.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
