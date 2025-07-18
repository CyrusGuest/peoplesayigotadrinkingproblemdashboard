import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useRole } from "../../hooks/useRole";
import RoleBasedContent from "../../components/common/RoleBasedContent";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import AdminOnlyRoute from "../../components/auth/AdminOnlyRoute";
import CreatorOnlyRoute from "../../components/auth/CreatorOnlyRoute";

export default function RoleDemo() {
  const { user, isAdmin, isCreator, isAuthenticated } = useRole();

  return (
    <>
      <PageMeta
        title="Role-Based Access Demo | Influencer Management"
        description="Demo page showing role-based access control features"
      />
      <PageBreadcrumb pageTitle="Role-Based Access Demo" />
      
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Role-Based Access Control Demo
        </h3>

        {/* User Info Section */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Current User Information
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.name || 'Not authenticated'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.email || 'Not authenticated'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">{user?.role || 'Not authenticated'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Authentication Status</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</p>
            </div>
          </div>
        </div>

        {/* Role-Based Content Examples */}
        <div className="space-y-6">
          {/* Example 1: RoleBasedContent Component */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Example 1: RoleBasedContent Component
            </h4>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              This component renders different content based on user roles:
            </p>
            
            <RoleBasedContent
              adminContent={
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    🔐 Admin Content: You can see this because you're an admin!
                  </p>
                  <p className="mt-2 text-xs text-blue-600 dark:text-blue-300">
                    Admins have access to all management features, user management, and system settings.
                  </p>
                </div>
              }
              creatorContent={
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    🎯 Creator Content: You can see this because you're a creator!
                  </p>
                  <p className="mt-2 text-xs text-green-600 dark:text-green-300">
                    Creators can manage their deliverables, view campaigns, and track earnings.
                  </p>
                </div>
              }
              fallbackContent={
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    🔒 No Access: You need to be authenticated to see role-specific content.
                  </p>
                </div>
              }
            />
          </div>

          {/* Example 2: Conditional Rendering with useRole Hook */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Example 2: Conditional Rendering with useRole Hook
            </h4>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Using the useRole hook for conditional rendering:
            </p>
            
            <div className="space-y-3">
              {isAdmin && (
                <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    👑 Admin Features Available:
                  </p>
                  <ul className="mt-2 text-xs text-purple-600 dark:text-purple-300 space-y-1">
                    <li>• Manage all creators</li>
                    <li>• Create and manage campaigns</li>
                    <li>• View system reports</li>
                    <li>• Access admin settings</li>
                  </ul>
                </div>
              )}
              
              {isCreator && (
                <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    🎬 Creator Features Available:
                  </p>
                  <ul className="mt-2 text-xs text-orange-600 dark:text-orange-300 space-y-1">
                    <li>• Submit deliverables</li>
                    <li>• Track earnings</li>
                    <li>• View assigned campaigns</li>
                    <li>• Update profile information</li>
                  </ul>
                </div>
              )}
              
              {!isAuthenticated && (
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    ⚠️ Please sign in to access role-specific features.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Example 3: Route Protection Examples */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Example 3: Route Protection Examples
            </h4>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Different types of route protection available:
            </p>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h5 className="mb-2 font-medium text-gray-800 dark:text-white/90">ProtectedRoute</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Requires authentication for any user
                </p>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Used for: Profile, Dashboard, etc.
                </div>
              </div>
              
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h5 className="mb-2 font-medium text-gray-800 dark:text-white/90">AdminOnlyRoute</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Only accessible by admin users
                </p>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Used for: User management, System settings
                </div>
              </div>
              
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h5 className="mb-2 font-medium text-gray-800 dark:text-white/90">CreatorOnlyRoute</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Only accessible by creator users
                </p>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Used for: Deliverable submission, Earnings
                </div>
              </div>
            </div>
          </div>

          {/* Example 4: Navigation Changes */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Example 4: Dynamic Navigation
            </h4>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              The sidebar navigation automatically changes based on your role:
            </p>
            
            <RoleBasedContent
              adminContent={
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    🧭 Your Admin Navigation Includes:
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
                    <li>• Dashboard (Admin view)</li>
                    <li>• Management (Creators, Campaigns, Deliverables)</li>
                    <li>• Admin Tools (User Management, Settings, Reports)</li>
                    <li>• Analytics & UI Elements</li>
                  </ul>
                </div>
              }
              creatorContent={
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                    🧭 Your Creator Navigation Includes:
                  </p>
                  <ul className="text-xs text-green-600 dark:text-green-300 space-y-1">
                    <li>• Dashboard (Creator view)</li>
                    <li>• Creator Tools (My Deliverables, Campaigns, Earnings)</li>
                    <li>• Analytics & UI Elements</li>
                  </ul>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </>
  );
} 