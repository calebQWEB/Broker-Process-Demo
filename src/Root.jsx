import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProvider } from "./context/RoleContext.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Upload from "./pages/Upload.jsx";
import Review from "./pages/Review.jsx";
import UpcomingRenewals from "./pages/UpcomingRenewals.jsx";
import ClaimsApproval from "./pages/ClaimsApproval.jsx";
import RenewalHistory from "./pages/RenewalHistory.jsx";
import ClaimsHistory from "./pages/ClaimsHistory.jsx";
import Reports from "./pages/Reports.jsx";

export default function Root() {
    return (
        <RoleProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/upload" element={<Upload />} />
                        <Route path="/review" element={<Review />} />
                        <Route
                            path="/renewals/pending"
                            element={<UpcomingRenewals />}
                        />
                        <Route
                            path="/renewals/history"
                            element={<RenewalHistory />}
                        />
                        <Route path="/reports" element={<Reports />} />
                        <Route
                            path="/claims/pending"
                            element={<ClaimsApproval />}
                        />
                        <Route
                            path="/claims/history"
                            element={<ClaimsHistory />}
                        />
                    </Route>
                </Routes>
            </BrowserRouter>
        </RoleProvider>
    );
}
