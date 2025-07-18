import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import RoleBasedHome from "./pages/Dashboard/RoleBasedHome";
import RoleDemo from "./pages/DemoPages/RoleDemo";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminOnlyRoute from "./components/auth/AdminOnlyRoute";
import CreatorOnlyRoute from "./components/auth/CreatorOnlyRoute";
import MyDeliverables from "./pages/CreatorPages/MyDeliverables";
import Earnings from "./pages/CreatorPages/Earnings";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout - All routes require authentication */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            {/* Role-based home page */}
            <Route index path="/" element={<RoleBasedHome />} />

            {/* Public routes (accessible to all authenticated users) */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
            <Route path="/role-demo" element={<RoleDemo />} />

            {/* Admin-only routes */}
            <Route path="/admin" element={
              <AdminOnlyRoute>
                <RoleBasedHome />
              </AdminOnlyRoute>
            } />

            {/* Creator-only routes */}
            <Route path="/creator" element={
              <CreatorOnlyRoute>
                <RoleBasedHome />
              </CreatorOnlyRoute>
            } />
            <Route path="/my-deliverables" element={
              <CreatorOnlyRoute>
                <MyDeliverables />
              </CreatorOnlyRoute>
            } />
            <Route path="/earnings" element={
              <CreatorOnlyRoute>
                <Earnings />
              </CreatorOnlyRoute>
            } />

            {/* Admin-only management routes */}
            <Route path="/creators" element={
              <AdminOnlyRoute>
                <BasicTables />
              </AdminOnlyRoute>
            } />

            {/* Forms - accessible to all */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* UI Elements - accessible to all */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts - accessible to all */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout - No authentication required */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
