import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";

export default function CreatorDashboard() {
  const { user } = useAuth();

  // Placeholder data - would come from your backend
  const creatorStats = {
    totalDeliverables: 0,
    totalEarnings: 0,
    averageViews: 0,
    pendingDeliverables: 0,
    completedCampaigns: 0,
    activeCampaigns: 0
  };

  return (
    <>
      <PageMeta
        title="Creator Dashboard | Influencer Management"
        description="Creator dashboard for managing deliverables and tracking performance"
      />
      <PageBreadcrumb pageTitle="Creator Dashboard" />
      
      <div className="rounded-2xl border border-gray-200 bg-white md:ml-64 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-2">
            Welcome back, {user?.name}!
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Here's an overview of your creator performance and upcoming tasks.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Performance Overview */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Performance Overview
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Deliverables</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">{creatorStats.totalDeliverables}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Earnings</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">${creatorStats.totalEarnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Average Views</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">{creatorStats.averageViews.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Campaign Status */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Campaign Status
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Active Campaigns</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">{creatorStats.activeCampaigns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Completed Campaigns</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">{creatorStats.completedCampaigns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Pending Deliverables</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">{creatorStats.pendingDeliverables}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Quick Stats
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">This Month Earnings</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">$0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">This Month Views</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Engagement Rate</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">0%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Quick Actions
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <button className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              Submit Deliverable
            </button>
            <button className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              View Campaigns
            </button>
            <button className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              Update Profile
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Activity
          </h4>
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recent activity to display. Start by submitting your first deliverable!
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 