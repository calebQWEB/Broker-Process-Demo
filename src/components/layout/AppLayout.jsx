import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";

export default function AppLayout() {
    // Only used below the md breakpoint, where the sidebar becomes a slide-in drawer
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="flex h-dvh bg-gray-50">
            <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header onMenuClick={() => setMenuOpen(true)} />
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
