import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import PublicLayout from "@/layouts/PublicLayout";
import AppLayout from "@/layouts/AppLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import HouseholdRequiredRoute from "@/components/layout/HouseholdRequiredRoute";
import ChoresPage from "@/pages/Chores";
import NeedsPage from "@/pages/Needs";
import ExpensesPage from "@/pages/Expenses";
import PaymentsPage from "@/pages/Payments";
import HouseholdPage from "@/pages/Household";
import NotificationsPage from "@/pages/Notifications";
import DashboardPage from "@/pages/Dashboard";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Routes that require being in a household */}
          <Route element={<HouseholdRequiredRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/chores" element={<ChoresPage />} />
            <Route path="/needs" element={<NeedsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Always accessible when authenticated */}
          <Route path="/household" element={<HouseholdPage />} />
        </Route>
      </Route>

      {/* Default Redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
