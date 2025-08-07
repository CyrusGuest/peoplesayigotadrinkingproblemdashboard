import { BrowserRouter as Router, Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
import { BackgroundProcessProvider } from "./context/BackgroundProcessContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminOnlyRoute from "./components/auth/AdminOnlyRoute";
import CreatorOnlyRoute from "./components/auth/CreatorOnlyRoute";
import MyDeliverables from "./pages/CreatorPages/MyDeliverables";
import Earnings from "./pages/CreatorPages/Earnings";
import CreatorDetail from "./pages/CreatorPages/CreatorDetail";
import PaymentRequests from "./pages/CreatorPages/PaymentRequests";
import PaymentManagement from "./pages/AdminPages/PaymentManagement";
import UserManagement from "./pages/AdminPages/UserManagement";
import DeliverablesManagement from "./pages/AdminPages/DeliverablesManagement";
import AdminTools from "./pages/AdminPages/AdminTools";
import Reports from "./pages/AdminPages/Reports";
import UnifiedReports from "./pages/AdminPages/UnifiedReports";
import KOLCalendar from "./pages/AdminPages/KOLCalendar";
import NewKOLCampaign from "./pages/AdminPages/NewKOLCampaign";
import Chat from "./pages/Chat";

export default function App() {
  return (
    <AuthProvider>
      <BackgroundProcessProvider>
        <Router>
        <ScrollToTop />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          aria-label="Notifications"
        />
        <Routes>
          {/* Dashboard Layout - All routes require authentication */}
          <Route element={            <ProtectedRoute>
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
            <Route path="/admin" element={              <AdminOnlyRoute>
                <RoleBasedHome />
              </AdminOnlyRoute>
            } />

            {/* Creator-only routes */}
            <Route path="/creator" element={              <CreatorOnlyRoute>
                <RoleBasedHome />
              </CreatorOnlyRoute>
            } />
            <Route path="/my-deliverables" element={              <CreatorOnlyRoute>
                <MyDeliverables />
              </CreatorOnlyRoute>
            } />
            <Route path="/earnings" element={              <CreatorOnlyRoute>
                <Earnings />
              </CreatorOnlyRoute>
            } />
            <Route path="/payment-requests" element={              <CreatorOnlyRoute>
                <PaymentRequests />
              </CreatorOnlyRoute>
            } />
            <Route path="/chat" element={<Chat />} />

            {/* Admin-only management routes */}
            <Route path="/creators" element={              <AdminOnlyRoute>
                <BasicTables />
              </AdminOnlyRoute>
            } />
            <Route path="/creator/:id" element={              <AdminOnlyRoute>
                <CreatorDetail />
              </AdminOnlyRoute>
            } />
            <Route path="/user/:id" element={              <AdminOnlyRoute>
                <CreatorDetail />
              </AdminOnlyRoute>
            } />
            <Route path="/payment-management" element={              <AdminOnlyRoute>
                <PaymentManagement />
              </AdminOnlyRoute>
            } />
            <Route path="/user-management" element={              <AdminOnlyRoute>
                <UserManagement />
              </AdminOnlyRoute>
            } />
            <Route path="/deliverables" element={              <AdminOnlyRoute>
                <DeliverablesManagement />
              </AdminOnlyRoute>
            } />
            <Route path="/admin-tools" element={              <AdminOnlyRoute>
                <AdminTools />
              </AdminOnlyRoute>
            } />
            <Route path="/admin-reports" element={              <AdminOnlyRoute>
                <Reports />
              </AdminOnlyRoute>
            } />
            <Route path="/unified-reports" element={              <AdminOnlyRoute>
                <UnifiedReports />
              </AdminOnlyRoute>
            } />
            <Route path="/kol-calendar" element={              <AdminOnlyRoute>
                <KOLCalendar />
              </AdminOnlyRoute>
            } />
            <Route path="/kol-campaigns/new" element={              <AdminOnlyRoute>
                <NewKOLCampaign />
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
      </BackgroundProcessProvider>
    </AuthProvider>
  );
}
