import AdminDashboard from "../AdminPages/AdminDashboard";
import CreatorDashboard from "../CreatorPages/CreatorDashboard";
import RoleBasedRoute from "../../components/auth/RoleBasedRoute";

export default function RoleBasedHome() {
  return (
    <RoleBasedRoute      adminComponent={<AdminDashboard />}
      creatorComponent={<CreatorDashboard />}
    />
  );
} 