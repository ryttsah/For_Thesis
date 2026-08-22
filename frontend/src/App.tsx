import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import OfficerLayout from "./layouts/OfficerLayout";
import LoginPage from "./pages/LoginPage";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminFarms from "./pages/admin/AdminFarms";
import AdminOfficers from "./pages/admin/AdminOfficers";
import AdminReports from "./pages/admin/AdminReports";
import AdminSurveys from "./pages/admin/AdminSurveys";
import FarmerPortal from "./pages/farmer/FarmerPortal";
import OfficerAnalytics from "./pages/officer/OfficerAnalytics";
import OfficerDashboard from "./pages/officer/OfficerDashboard";
import OfficerFarms from "./pages/officer/OfficerFarms";
import OfficerMap from "./pages/officer/OfficerMap";
import OfficerQueue from "./pages/officer/OfficerQueue";
import OfficerReports from "./pages/officer/OfficerReports";
import OfficerSurveys from "./pages/officer/OfficerSurveys";
import OfficerVisits from "./pages/officer/OfficerVisits";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />

      <Route element={<ProtectedRoute role="officer" />}>
        <Route path="/officer" element={<OfficerLayout />}>
          <Route index element={<OfficerDashboard />} />
          <Route path="map" element={<OfficerMap />} />
          <Route path="analytics" element={<OfficerAnalytics />} />
          <Route path="farms" element={<OfficerFarms />} />
          <Route path="surveys" element={<OfficerSurveys />} />
          <Route path="visits" element={<OfficerVisits />} />
          <Route path="queue" element={<OfficerQueue />} />
          <Route path="reports" element={<OfficerReports />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="farmer" />}>
        <Route path="/farmer" element={<FarmerPortal />} />
      </Route>

      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="approvals" element={<AdminApprovals />} />
          <Route path="officers" element={<AdminOfficers />} />
          <Route path="farms" element={<AdminFarms />} />
          <Route path="surveys" element={<AdminSurveys />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
